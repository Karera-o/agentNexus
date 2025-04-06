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

  // Store selected model for each agent with provider information
  const [agentModels, setAgentModels] = useState({
    requirements: { provider: 'ollama', model: '' },
    documentor: { provider: 'ollama', model: '' },
    system: { provider: 'ollama', model: '' },
    database: { provider: 'ollama', model: '' },
    ui: { provider: 'ollama', model: '' },
  });

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
              console.log('ModelContext: Fetching OpenRouter models');
              console.log(`ModelContext: OpenRouter API Key in settings: ${settings.providers.openrouter.apiKey ? 'Present (length: ' + settings.providers.openrouter.apiKey.length + ')' : 'Not set'}`);
              console.log(`ModelContext: OpenRouter API Key in env: ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY ? 'Present (length: ' + process.env.NEXT_PUBLIC_OPENROUTER_API_KEY.length + ')' : 'Not set'}`);

              // First check if we already have models in settings
              if (settings.providers.openrouter.models && settings.providers.openrouter.models.length > 0) {
                console.log(`ModelContext: Using ${settings.providers.openrouter.models.length} models from settings`);
                modelsObj[provider] = settings.providers.openrouter.models.map(model => ({
                  name: model.id,
                  displayName: model.name,
                  description: model.description || ''
                }));
                statusObj[provider] = { checked: true, running: true };
              } else {
                // If no models in settings, fetch from API
                const openRouterProvider = createProvider(provider, settings);
                console.log(`ModelContext: OpenRouter provider created with API Key: ${openRouterProvider.apiKey ? 'Present (length: ' + openRouterProvider.apiKey.length + ')' : 'Not set'}`);

                const models = await openRouterProvider.listModels();

                console.log(`ModelContext: Fetched ${models.length} OpenRouter models`);
                statusObj[provider] = { checked: true, running: models.length > 0 };
                modelsObj[provider] = models;

                // If we got models, update the settings
                if (models.length > 0) {
                  const settingsModels = models.map(model => ({
                    id: model.name,
                    name: model.displayName || model.name,
                    description: model.description || ''
                  }));

                  // Update the models in settings
                  settings.providers.openrouter.models = settingsModels;
                  localStorage.setItem('settings', JSON.stringify(settings));
                }
              }
            } catch (error) {
              console.error('Error fetching OpenRouter models:', error);
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
      const defaultAgentModels = {};

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

      // Set default models for each agent
      const agentIds = ['requirements', 'documentor', 'system', 'database', 'ui'];
      agentIds.forEach(agentId => {
        if (savedAgentModels[agentId]) {
          defaultAgentModels[agentId] = savedAgentModels[agentId];
        } else {
          defaultAgentModels[agentId] = { provider: defaultProvider, model: defaultModel };
        }

        // Validate that the saved model exists in the available models
        const savedProvider = defaultAgentModels[agentId].provider;
        const savedModel = defaultAgentModels[agentId].model;

        if (!modelsObj[savedProvider] ||
            !modelsObj[savedProvider].some(m => m.name === savedModel)) {
          // If the saved model is not available, use the default
          defaultAgentModels[agentId] = { provider: defaultProvider, model: defaultModel };
        }
      });

      setAgentModels(defaultAgentModels);
    } catch (err) {
      setError('Failed to load models from providers');
      console.error('Error loading models:', err);
    } finally {
      setIsLoading(false);
    }
  }, [settings.providers, fetchModelsForProvider]);

  // Create a ref to track if models have been loaded
  const hasLoadedModels = useRef(false);

  // Load models on initial mount only
  useEffect(() => {
    if (!hasLoadedModels.current) {
      hasLoadedModels.current = true;
      // Use setTimeout to ensure this runs after the component is fully mounted
      setTimeout(() => {
        loadAllProviderModels();
      }, 100);
    }
  }, []); // Empty dependency array to run only once on mount

  // Save agent models to localStorage when they change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('agentModels', JSON.stringify(agentModels));
    }
  }, [agentModels, isLoading]);

  // Set model for a specific agent
  const setModelForAgent = (agentId, provider, modelName) => {
    // Check if the model is already selected to prevent unnecessary updates
    const currentModel = agentModels[agentId];
    if (currentModel && currentModel.provider === provider && currentModel.model === modelName) {
      return; // No change needed
    }

    // Update the model
    setAgentModels(prev => ({
      ...prev,
      [agentId]: { provider, model: modelName }
    }));

    // Save to localStorage immediately
    const updatedModels = {
      ...agentModels,
      [agentId]: { provider, model: modelName }
    };
    localStorage.setItem('agentModels', JSON.stringify(updatedModels));

    console.log(`Model set for ${agentId}: ${provider}/${modelName}`);
  };

  // Get model for a specific agent
  const getModelForAgent = (agentId) => {
    return agentModels[agentId] || { provider: '', model: '' };
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
    // Force a refresh by setting isLoading to false first
    setIsLoading(false);
    // Then call loadAllProviderModels
    return loadAllProviderModels();
  }, [loadAllProviderModels]);

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
