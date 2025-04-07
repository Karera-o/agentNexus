"use client";

import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { useSettings } from './SettingsContext';
import { createProvider, getAllProviders } from '../services/providers/provider-factory';

// Create context
const ModelContext = createContext();

// Provider component
export const ModelProvider = ({ children }) => {
  const { settings, fetchModelsForProvider } = useSettings();
  const [providerStatus, setProviderStatus] = useState({});
  const [availableModels, setAvailableModels] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Store selected model for each project-agent combination with provider information
  // Format: { 'projectId-agentId': { provider: 'provider', model: 'model' } }
  const [agentModels, setAgentModels] = useState({});

  // Define loadAllProviderModels as a memoized function to be reused
  const loadAllProviderModels = useCallback(async () => {
    // Prevent multiple simultaneous loading operations
    if (isLoading) {
      console.log('Already loading models, skipping');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get all enabled providers
      const enabledProviders = Object.keys(settings.providers).filter(
        (provider) => settings.providers[provider].enabled
      );

      if (enabledProviders.length === 0) {
        setAvailableModels({});
        setProviderStatus({});
        setIsLoading(false); // Make sure to set loading to false
        return;
      }

      // Initialize status and models objects
      const statusObj = {};
      const modelsObj = {};

      // For cloud providers with API keys, we'll just mark them as available
      // without actually fetching models to prevent API rate limits
      for (const provider of enabledProviders) {
        // Skip providers that are not local and don't have an API key set
        const providerSettings = settings.providers[provider];
        const isCloud = !providerSettings.local;
        const hasApiKey = isCloud && providerSettings.apiKey && providerSettings.apiKey.trim() !== '';

        if (isCloud) {
          // For cloud providers, use the predefined models from settings
          statusObj[provider] = { checked: true, running: hasApiKey };

          // Special handling for OpenRouter - always try to fetch models from API
          if (provider === 'openrouter') {
            try {
              console.log('ModelContext: Handling OpenRouter models');
              console.log(`ModelContext: OpenRouter API Key in settings: ${settings.providers.openrouter.apiKey ? 'Present (length: ' + settings.providers.openrouter.apiKey.length + ')' : 'Not set'}`);
              console.log(`ModelContext: OpenRouter API Key in env: ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY ? 'Present (length: ' + process.env.NEXT_PUBLIC_OPENROUTER_API_KEY.length + ')' : 'Not set'}`);

              // Always try to fetch fresh models from the API first
              const openRouterProvider = createProvider(provider, settings);
              let models = [];

              try {
                // Try to fetch models from the API
                models = await openRouterProvider.listModels();
                console.log(`ModelContext: Fetched ${models.length} OpenRouter models from API`);

                // If we got models from the API, use them and update settings
                if (models.length > 0) {
                  statusObj[provider] = { checked: true, running: true };
                  modelsObj[provider] = models;

                  // Update the models in settings
                  const settingsModels = models.map(model => ({
                    id: model.name,
                    name: model.displayName || model.name,
                    description: model.description || ''
                  }));

                  // Update the models in settings
                  settings.providers.openrouter.models = settingsModels;
                  localStorage.setItem('settings', JSON.stringify(settings));
                  console.log(`ModelContext: Updated settings with ${settingsModels.length} OpenRouter models`);
                }
              } catch (fetchError) {
                console.warn('Error fetching OpenRouter models from API:', fetchError);
                // If API fetch fails, fall back to models from settings
              }

              // If we couldn't get models from the API, try to use models from settings
              if (models.length === 0 && settings.providers.openrouter.models && settings.providers.openrouter.models.length > 0) {
                console.log(`ModelContext: Using ${settings.providers.openrouter.models.length} models from settings`);
                modelsObj[provider] = settings.providers.openrouter.models.map(model => ({
                  name: model.id,
                  displayName: model.name,
                  description: model.description || ''
                }));
                statusObj[provider] = { checked: true, running: true };
              }

              // If we still don't have any models, mark the provider as not running
              if (!modelsObj[provider] || modelsObj[provider].length === 0) {
                console.warn('No OpenRouter models available from API or settings');
                statusObj[provider] = { checked: true, running: false };
                modelsObj[provider] = [];
              }
            } catch (error) {
              console.error('Error handling OpenRouter models:', error);
              statusObj[provider] = { checked: true, running: false };
              modelsObj[provider] = [];
            }
          }
          // For other cloud providers with API keys, use the predefined models
          else if (hasApiKey) {
            modelsObj[provider] = providerSettings.models.map(model => ({
              name: model.id,
              displayName: model.name,
              description: model.description
            }));
          } else {
            // For cloud providers without API keys, use empty models
            modelsObj[provider] = [];
          }
        } else {
          // For local providers like Ollama, try to fetch models
          try {
            const models = await fetchModelsForProvider(provider);
            statusObj[provider] = { checked: true, running: models.length > 0 };
            modelsObj[provider] = models;
          } catch (error) {
            console.error(`Error fetching models for ${provider}:`, error);
            statusObj[provider] = { checked: true, running: false };
            modelsObj[provider] = [];
          }
        }
      }

      setProviderStatus(statusObj);
      setAvailableModels(modelsObj);

      // Load saved agent models from localStorage or use defaults
      const savedAgentModels = JSON.parse(localStorage.getItem('agentModels')) || {};

      // Find the first available model from any provider
      let defaultProvider = '';
      let defaultModel = '';

      // Check if we have any models available
      let hasModels = false;
      for (const provider in modelsObj) {
        if (modelsObj[provider].length > 0) {
          defaultProvider = provider;
          defaultModel = modelsObj[provider][0].name;
          hasModels = true;
          break;
        }
      }

      // If no models are available, set a fallback
      if (!hasModels) {
        console.log('No models available from any provider, using fallback');
        // Use the first enabled provider as fallback
        if (enabledProviders.length > 0) {
          defaultProvider = enabledProviders[0];
          defaultModel = 'No models available';
        }
      }

      // Keep the saved agent models but ensure they're valid
      // We'll migrate the old format to the new format if needed
      const migratedModels = {};

      // Check if we need to migrate from the old format (no project IDs)
      const needsMigration = Object.keys(savedAgentModels).some(key =>
        !key.includes('-') && ['requirements', 'documentor', 'system', 'database', 'ui'].includes(key));

      if (needsMigration) {
        console.log('Migrating agent models to new project-based format');
        // Migrate old format to new format
        const agentIds = ['requirements', 'documentor', 'system', 'database', 'ui'];
        agentIds.forEach(agentId => {
          if (savedAgentModels[agentId]) {
            // Use 'default' as the project ID for migrated models
            migratedModels[`default-${agentId}`] = savedAgentModels[agentId];
          }
        });
      } else {
        // Already in the new format
        Object.assign(migratedModels, savedAgentModels);
      }

      // Validate all models to ensure they exist
      Object.keys(migratedModels).forEach(key => {
        const modelInfo = migratedModels[key];
        const provider = modelInfo.provider;
        const model = modelInfo.model;

        if (!modelsObj[provider] || !modelsObj[provider].some(m => m.name === model)) {
          // If the saved model is not available, use the default
          migratedModels[key] = { provider: defaultProvider, model: defaultModel };
        }
      });

      setAgentModels(migratedModels);
    } catch (err) {
      setError('Failed to load models from providers');
      console.error('Error loading models:', err);
    } finally {
      setIsLoading(false);
    }
  }, [settings.providers, fetchModelsForProvider]);

  // Function to directly initialize OpenRouter models from settings
  const initializeOpenRouterModels = useCallback(() => {
    // Check if we have OpenRouter models in settings
    if (settings.providers.openrouter?.models?.length > 0) {
      console.log(`ModelContext: Directly initializing ${settings.providers.openrouter.models.length} OpenRouter models from settings`);

      // Convert models from settings format to provider format
      const openRouterModels = settings.providers.openrouter.models.map(model => ({
        name: model.id,
        displayName: model.name,
        description: model.description || ''
      }));

      // Update availableModels with OpenRouter models
      setAvailableModels(prev => ({
        ...prev,
        openrouter: openRouterModels
      }));

      // Update provider status
      setProviderStatus(prev => ({
        ...prev,
        openrouter: { checked: true, running: true }
      }));

      console.log('ModelContext: OpenRouter models initialized from settings');
      return true;
    }

    return false;
  }, [settings.providers.openrouter?.models]);

  // Create a ref to track if models have been loaded
  const hasLoadedModels = useRef(false);

  // Load models on initial mount only
  useEffect(() => {
    if (!hasLoadedModels.current) {
      hasLoadedModels.current = true;

      // First try to initialize OpenRouter models directly from settings
      const initialized = initializeOpenRouterModels();
      console.log(`ModelContext: Direct initialization ${initialized ? 'successful' : 'not needed or failed'}`);

      // Then load all provider models normally
      setTimeout(() => {
        loadAllProviderModels()
          .then(() => {
            // After loading all models, check if any models are missing
            const needsOpenRouterModels = settings.providers.openrouter?.enabled &&
                                        (!availableModels.openrouter || availableModels.openrouter.length === 0);

            const needsOllamaModels = settings.providers.ollama?.enabled &&
                                    (!availableModels.ollama || availableModels.ollama.length === 0);

            // Try to initialize missing models
            if (needsOpenRouterModels) {
              console.log('ModelContext: OpenRouter is enabled but no models loaded, trying to initialize again...');
              initializeOpenRouterModels();
            }

            if (needsOllamaModels) {
              console.log('ModelContext: Ollama is enabled but no models loaded, trying to fetch directly...');
              try {
                const ollamaProvider = createProvider('ollama', settings);
                ollamaProvider.listModels()
                  .then(models => {
                    if (models && models.length > 0) {
                      console.log(`ModelContext: Successfully fetched ${models.length} Ollama models directly`);
                      // Update availableModels with the fetched models
                      setAvailableModels(prev => ({
                        ...prev,
                        ollama: models
                      }));

                      // Update provider status
                      setProviderStatus(prev => ({
                        ...prev,
                        ollama: { checked: true, running: true }
                      }));
                    }
                  })
                  .catch(err => {
                    console.error('Error fetching Ollama models directly:', err);
                  });
              } catch (err) {
                console.error('Error creating Ollama provider:', err);
              }
            }
          })
          .catch(err => {
            console.error('Error loading models:', err);
          });
      }, 100);
    }
  }, [availableModels.openrouter, availableModels.ollama, initializeOpenRouterModels, loadAllProviderModels, settings.providers.openrouter?.enabled, settings.providers.ollama?.enabled, createProvider, settings]); // Add dependencies

  // Save agent models to localStorage when they change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('agentModels', JSON.stringify(agentModels));
    }
  }, [agentModels, isLoading]);

  // Set model for a specific agent in a specific project
  const setModelForAgent = (projectId, agentId, provider, modelName) => {
    // Create a unique key for this project-agent combination
    const key = projectId ? `${projectId}-${agentId}` : `default-${agentId}`;

    // Check if the model is already selected to prevent unnecessary updates
    const currentModel = agentModels[key];
    if (currentModel && currentModel.provider === provider && currentModel.model === modelName) {
      return; // No change needed
    }

    // Update the model
    setAgentModels(prev => ({
      ...prev,
      [key]: { provider, model: modelName }
    }));

    // Save to localStorage immediately
    const updatedModels = {
      ...agentModels,
      [key]: { provider, model: modelName }
    };
    localStorage.setItem('agentModels', JSON.stringify(updatedModels));

    console.log(`Model set for ${projectId || 'default'} - ${agentId}: ${provider}/${modelName}`);
  };

  // Get model for a specific agent in a specific project
  const getModelForAgent = (projectId, agentId) => {
    // Create a unique key for this project-agent combination
    const key = projectId ? `${projectId}-${agentId}` : `default-${agentId}`;

    // Try to get the model for this specific project-agent combination
    if (agentModels[key]) {
      return agentModels[key];
    }

    // If not found, try to get the default model for this agent
    const defaultKey = `default-${agentId}`;
    if (agentModels[defaultKey]) {
      return agentModels[defaultKey];
    }

    // If still not found, return empty values
    return { provider: '', model: '' };
  };

  // Get all models for a specific provider
  const getModelsForProvider = (provider) => {
    return availableModels[provider] || [];
  };

  // Get all available models across all providers
  const getAllAvailableModels = () => {
    return availableModels;
  };

  // Check if a provider is available
  const isProviderAvailable = (provider) => {
    return providerStatus[provider]?.running || false;
  };

  // Refresh models for all providers
  const refreshAllModels = useCallback(() => {
    // Prevent multiple simultaneous refreshes
    if (isLoading) {
      console.log('Already loading models, skipping refresh');
      return Promise.resolve(false);
    }

    console.log('Refreshing all models...');

    // First try to initialize OpenRouter models directly from settings
    // This ensures we have models immediately available
    const initialized = initializeOpenRouterModels();
    console.log(`ModelContext: Direct initialization during refresh ${initialized ? 'successful' : 'not needed or failed'}`);

    // Force a refresh by setting isLoading to false first
    setIsLoading(false);

    // Special handling for OpenRouter - try to fetch models directly if enabled
    if (settings.providers.openrouter?.enabled) {
      console.log('ModelContext: OpenRouter is enabled, attempting to fetch models directly');
      try {
        const openRouterProvider = createProvider('openrouter', settings);
        openRouterProvider.listModels()
          .then(models => {
            if (models && models.length > 0) {
              console.log(`ModelContext: Successfully fetched ${models.length} OpenRouter models directly`);
              // Update availableModels with the fetched models
              setAvailableModels(prev => ({
                ...prev,
                openrouter: models
              }));

              // Update provider status
              setProviderStatus(prev => ({
                ...prev,
                openrouter: { checked: true, running: true }
              }));
            }
          })
          .catch(err => {
            console.error('Error fetching OpenRouter models directly:', err);
          });
      } catch (err) {
        console.error('Error creating OpenRouter provider:', err);
      }
    }

    // Special handling for Ollama - try to fetch models directly if enabled
    if (settings.providers.ollama?.enabled) {
      console.log('ModelContext: Ollama is enabled, attempting to fetch models directly');
      try {
        const ollamaProvider = createProvider('ollama', settings);
        ollamaProvider.listModels()
          .then(models => {
            if (models && models.length > 0) {
              console.log(`ModelContext: Successfully fetched ${models.length} Ollama models directly`);
              // Update availableModels with the fetched models
              setAvailableModels(prev => ({
                ...prev,
                ollama: models
              }));

              // Update provider status
              setProviderStatus(prev => ({
                ...prev,
                ollama: { checked: true, running: true }
              }));
            }
          })
          .catch(err => {
            console.error('Error fetching Ollama models directly:', err);
          });
      } catch (err) {
        console.error('Error creating Ollama provider:', err);
      }
    }

    // Then call loadAllProviderModels and return the promise
    return loadAllProviderModels()
      .then(() => {
        console.log('Models refreshed successfully');

        // After loading all models, make sure OpenRouter models are properly loaded
        // This is a fallback in case the API request failed
        if (settings.providers.openrouter?.enabled &&
            (!availableModels.openrouter || availableModels.openrouter.length === 0)) {
          console.log('No OpenRouter models found after refresh, trying to initialize from settings');
          initializeOpenRouterModels();
        }

        return true;
      })
      .catch(error => {
        console.error('Error refreshing models:', error);

        // Even if the refresh fails, try to initialize OpenRouter models from settings
        console.log('Refresh failed, trying to initialize OpenRouter models from settings');
        initializeOpenRouterModels();

        return false;
      });
  }, [loadAllProviderModels, isLoading, initializeOpenRouterModels, availableModels.openrouter, availableModels.ollama, settings.providers.openrouter?.enabled, settings.providers.ollama?.enabled, createProvider, settings]);

  // Context value
  const value = {
    providerStatus,
    availableModels,
    isLoading,
    error,
    setModelForAgent,
    getModelForAgent,
    getModelsForProvider,
    getAllAvailableModels,
    isProviderAvailable,
    refreshAllModels,
  };

  return (
    <ModelContext.Provider value={value}>
      {children}
    </ModelContext.Provider>
  );
};

// Custom hook to use the model context
export const useModelContext = () => {
  const context = useContext(ModelContext);
  if (context === undefined) {
    throw new Error('useModelContext must be used within a ModelProvider');
  }
  return context;
};

export default ModelContext;
