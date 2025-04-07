"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FaRobot, FaChevronDown, FaExclamationTriangle, FaSpinner, FaServer, FaCloud, FaGlobe } from 'react-icons/fa';
import { useModelContext } from '../context/ModelContext';
import { useSettings } from '../context/SettingsContext';
import { createProvider } from '../services/providers/provider-factory';

const ModelSelector = ({ selectedModel, onModelSelect, agentColor }) => {
  // State variables
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectionStep, setSelectionStep] = useState('provider'); // 'provider' or 'model'

  // Reset selection step when dropdown is closed
  const toggleDropdown = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);

    // Reset to provider selection when closing
    if (!newIsOpen) {
      setSelectionStep('provider');
      setSelectedProvider(null);
    } else {
      // When opening the dropdown, check if any models need to be loaded
      const needsOpenRouterModels = settings.providers.openrouter?.enabled &&
                                  (!availableModels.openrouter || availableModels.openrouter.length === 0);

      const needsOllamaModels = settings.providers.ollama?.enabled &&
                              (!availableModels.ollama || availableModels.ollama.length === 0);

      if (needsOpenRouterModels || needsOllamaModels) {
        console.log('ModelSelector: Opening dropdown and some models are missing, refreshing...');
        refreshAllModels();
      }
    }
  };

  const { settings } = useSettings();
  const {
    availableModels,
    providerStatus,
    isLoading,
    error,
    getAllAvailableModels,
    refreshAllModels
  } = useModelContext();

  // Effect to initialize models when the component mounts
  useEffect(() => {
    // Check for both OpenRouter and Ollama models
    const needsOpenRouterModels = settings.providers.openrouter?.enabled &&
                                (!availableModels.openrouter || availableModels.openrouter.length === 0);

    const needsOllamaModels = settings.providers.ollama?.enabled &&
                            (!availableModels.ollama || availableModels.ollama.length === 0);

    // If we need to fetch models for either provider, do it
    if (needsOpenRouterModels || needsOllamaModels) {
      console.log('ModelSelector: Some models are missing, fetching them...');

      // Fetch OpenRouter models if needed
      if (needsOpenRouterModels) {
        console.log('ModelSelector: OpenRouter is enabled but no models found, fetching directly from API...');

        // Get the API key from settings or environment variables
        const apiKey = settings.providers.openrouter?.apiKey || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '';

        if (apiKey) {
          console.log('ModelSelector: API key found, fetching OpenRouter models...');

          // Create headers
          const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
            'X-Title': 'Dev Agent App'
          };

          // Fetch models directly from the API
          fetch('https://openrouter.ai/api/v1/models', {
            method: 'GET',
            headers: headers
          })
          .then(response => {
            if (!response.ok) {
              throw new Error(`API Error (${response.status})`);
            }
            return response.json();
          })
          .then(data => {
            console.log(`ModelSelector: Successfully fetched ${data.data?.length || 0} OpenRouter models`);

            if (data.data && data.data.length > 0) {
              // Update settings with the models
              const settingsModels = data.data.map(model => ({
                id: model.id,
                name: model.name || model.id,
                description: model.description || ''
              }));

              // Update the models in settings context if the global function exists
              if (window.updateOpenRouterModelsInSettings) {
                window.updateOpenRouterModelsInSettings(settingsModels);
              }
            }
          })
          .catch(error => {
            console.error('Error fetching OpenRouter models:', error);
          });
        }
      }

      // Fetch Ollama models if needed
      if (needsOllamaModels) {
        console.log('ModelSelector: Ollama is enabled but no models found, fetching directly from API...');

        // Get the Ollama API URL from settings
        const ollamaUrl = settings.providers.ollama?.baseUrl || 'http://localhost:11434/api';

        // Fetch models directly from the Ollama API
        fetch(`${ollamaUrl}/tags`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        .then(response => {
          if (!response.ok) {
            throw new Error(`API Error (${response.status})`);
          }
          return response.json();
        })
        .then(data => {
          const models = data.models || [];
          console.log(`ModelSelector: Successfully fetched ${models.length} Ollama models`);

          if (models.length > 0) {
            // Update availableModels directly
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
        .catch(error => {
          console.error('Error fetching Ollama models:', error);
        });
      }

      // We'll let the models we just fetched directly be saved to the state
      // No need to call refreshAllModels() here as it would create an infinite loop
      // The models will be available in the state after the direct fetch completes
    }
  }, [settings.providers.openrouter?.enabled, settings.providers.openrouter?.apiKey,
      settings.providers.ollama?.enabled, settings.providers.ollama?.baseUrl,
      availableModels.openrouter, availableModels.ollama, refreshAllModels]);

  // Handle provider selection
  const handleProviderSelect = (provider) => {
    setSelectedProvider(provider);
    setSelectionStep('model');
    setSearchTerm(''); // Clear search when switching to model selection

    // Automatically fetch models for OpenRouter if needed
    if (provider === 'openrouter' && (!availableModels.openrouter || availableModels.openrouter.length === 0)) {
      console.log('Automatically fetching OpenRouter models because they are missing...');
      // Only refresh models when they're not already loaded
      refreshAllModels();
    }
  };

  // Handle model selection
  const handleModelSelect = (provider, model) => {
    // Check if this model is already selected to prevent unnecessary updates
    if (selectedModel?.provider === provider && selectedModel?.model === model) {
      setIsOpen(false);
      setSelectionStep('provider');
      setSelectedProvider(null);
      return;
    }

    onModelSelect(provider, model);
    setIsOpen(false);
    setSelectionStep('provider');
    setSelectedProvider(null);
  };

  // Go back to provider selection
  const handleBackToProviders = () => {
    setSelectionStep('provider');
    setSelectedProvider(null);
    setSearchTerm(''); // Clear search when going back to provider selection
  };

  // Format model size for display
  const formatSize = (sizeInBytes) => {
    if (!sizeInBytes) return 'Unknown size';

    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    let size = sizeInBytes;

    while (size >= 1024 && i < sizes.length - 1) {
      size /= 1024;
      i++;
    }

    return `${size.toFixed(1)} ${sizes[i]}`;
  };

  // Get provider icon
  const getProviderIcon = (provider) => {
    switch (provider) {
      case 'ollama':
        return <FaServer className="mr-2 text-blue-500" />;
      case 'openai':
        return <FaRobot className="mr-2 text-green-500" />;
      case 'anthropic':
        return <FaRobot className="mr-2 text-purple-500" />;
      case 'gemini':
        return <FaRobot className="mr-2 text-yellow-500" />;
      case 'deepseek':
        return <FaRobot className="mr-2 text-blue-400" />;
      case 'openrouter':
        return <FaGlobe className="mr-2 text-green-400" />;
      case 'requesty':
        return <FaCloud className="mr-2 text-gray-500" />;
      default:
        return <FaRobot className="mr-2 text-gray-500" />;
    }
  };

  // Get provider display name - memoized to prevent unnecessary recalculations
  const getProviderDisplayName = useCallback((provider) => {
    return settings.providers[provider]?.name || provider.charAt(0).toUpperCase() + provider.slice(1);
  }, [settings.providers]);

  // Get current model details - memoized to prevent unnecessary recalculations
  const currentModelDetails = useMemo(() => {
    if (!selectedModel || !selectedModel.provider || !selectedModel.model) {
      return { displayName: 'Select a model', provider: '' };
    }

    const provider = selectedModel.provider;
    const modelName = selectedModel.model;
    const providerModels = availableModels[provider] || [];
    const modelDetails = providerModels.find(m => m.name === modelName);

    return {
      displayName: modelDetails?.displayName || modelName,
      provider
    };
  }, [selectedModel, availableModels]);

  // Filter providers based on search term - memoized to prevent unnecessary recalculations
  const filteredProviders = useMemo(() => {
    // Get all providers from settings that are enabled
    const enabledProviders = Object.keys(settings.providers).filter(
      provider => settings.providers[provider].enabled
    );

    const searchLower = searchTerm.toLowerCase();
    return enabledProviders.filter(provider => {
      // Filter by search term if provided
      if (searchTerm) {
        const providerName = getProviderDisplayName(provider).toLowerCase();
        return providerName.includes(searchLower);
      }

      return true;
    });
  }, [settings.providers, searchTerm, getProviderDisplayName]);

  // Get models for the selected provider - memoized to prevent unnecessary recalculations
  const getProviderModels = useCallback((provider) => {
    if (!provider) return [];

    // Get models from settings if available, otherwise use availableModels
    let providerModels = [];

    try {
      // Special case for OpenRouter - use both fetched models and models from settings
      if (provider === 'openrouter') {
        console.log('ModelSelector: Getting OpenRouter models');

        // First check if we have models in availableModels
        if (availableModels[provider] && availableModels[provider].length > 0) {
          console.log(`ModelSelector: Found ${availableModels[provider].length} OpenRouter models in availableModels`);
          providerModels = availableModels[provider];
        }
        // If not, check if we have models in settings
        else if (settings.providers[provider]?.models?.length > 0) {
          console.log(`ModelSelector: Found ${settings.providers[provider].models.length} models in settings`);
          // Use models from settings
          providerModels = settings.providers[provider].models.map(model => ({
            name: model.id,
            displayName: model.name,
            description: model.description || ''
          }));
        } else {
          console.log('ModelSelector: No OpenRouter models found in availableModels or settings');
          providerModels = [];
        }

        console.log(`ModelSelector: Using ${providerModels.length} OpenRouter models`);
      }
      // For other cloud providers, use the predefined models from settings
      else if (!settings.providers[provider]?.local && settings.providers[provider]?.models?.length > 0) {
        providerModels = settings.providers[provider].models.map(model => ({
          name: model.id,
          displayName: model.name,
          description: model.description
        }));
      } else {
        // For local providers like Ollama, use the fetched models
        providerModels = availableModels[provider] || [];
      }

      console.log(`ModelSelector: Found ${providerModels.length} models for provider ${provider}`);
    } catch (error) {
      console.error(`Error getting models for provider ${provider}:`, error);
      // Return empty array in case of error
      return [];
    }

    return providerModels;
  }, [availableModels, settings.providers]);

  // Filter models for the selected provider - memoized to prevent unnecessary recalculations
  const filteredModels = useMemo(() => {
    if (!selectedProvider) return {};

    const searchLower = searchTerm.toLowerCase();
    const providerModels = getProviderModels(selectedProvider);

    const filtered = providerModels.filter(model =>
      (model.name && model.name.toLowerCase().includes(searchLower)) ||
      (model.displayName && model.displayName.toLowerCase().includes(searchLower))
    );

    return { [selectedProvider]: filtered };
  }, [selectedProvider, searchTerm, getProviderModels]);

  // Check if any provider is available
  const isAnyProviderAvailable = () => {
    // If we're still loading, return true to avoid showing an error
    if (isLoading) return true;

    // Check if any provider is enabled in settings
    return Object.keys(settings.providers).some(provider => settings.providers[provider].enabled);
  };

  // Check if we have any models
  const hasAnyModels = () => {
    return Object.values(availableModels).some(models => models && models.length > 0);
  };

  // Both getCurrentModelDetails and filteredModels are now memoized values

  return (
    <div className="relative">
      {/* We don't show loading state anymore to prevent UI flashing */}
      {error && (
        <div className="flex items-center text-yellow-500">
          <FaExclamationTriangle className="mr-2" />
          <span className="text-sm">{error}</span>
        </div>
      )}
      <button
        onClick={toggleDropdown}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm ${
          isAnyProviderAvailable()
            ? `bg-primary/10 text-gray-800 dark:text-white`
            : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
        }`}
        disabled={!isAnyProviderAvailable()}
      >
        {getProviderIcon(currentModelDetails?.provider || '')}
        <div className="flex flex-col items-start">
          <span className="truncate max-w-[150px] font-medium">{currentModelDetails?.displayName || 'Select a model'}</span>
          {currentModelDetails?.provider && (
            <span className="text-xs opacity-80">{getProviderDisplayName(currentModelDetails.provider)}</span>
          )}
        </div>
        <FaChevronDown className="text-xs" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-[80vh] overflow-y-auto">
          <div className="p-2">
            {/* Search placeholder - actual title moved below */}

            {/* Search input */}
            <div className="mb-3">
              <input
                type="text"
                placeholder={selectionStep === 'provider' ? "Search providers..." : "Search models..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              />
            </div>

            {/* Refresh button */}
            <div className="mb-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  refreshAllModels();
                  // Reset to provider selection after refresh
                  setSelectionStep('provider');
                  setSelectedProvider(null);
                  setSearchTerm('');
                }}
                className="w-full p-2 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                Refresh Models
              </button>
            </div>

            {/* Selection title */}
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {selectionStep === 'provider' ? 'Select Provider' : 'Select Model'}
              </h3>
              {selectionStep === 'model' && (
                <button
                  onClick={handleBackToProviders}
                  className="text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  ← Back to Providers
                </button>
              )}
            </div>

            {/* Provider or Model list */}
            <div className="space-y-3">
              {selectionStep === 'provider' ? (
                // Provider selection step
                filteredProviders.length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                    {searchTerm ? 'No providers match your search' : 'No providers available'}
                  </div>
                ) : (
                  filteredProviders.map(provider => (
                    <button
                      key={provider}
                      onClick={() => handleProviderSelect(provider)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between
                        bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 mb-2 border border-gray-200 dark:border-gray-700`}
                    >
                      <div className="flex items-center">
                        {getProviderIcon(provider)}
                        <span className="font-medium">{getProviderDisplayName(provider)}</span>
                      </div>
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full">
                        {settings.providers[provider].local ? 'Local' : 'Cloud'}
                      </span>
                    </button>
                  ))
                )
              ) : (
                // Model selection step
                !filteredModels[selectedProvider] || filteredModels[selectedProvider].length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                    {searchTerm ? 'No models match your search' : (
                      selectedProvider === 'openrouter' ? (
                        <div>
                          <p className="mb-2">No OpenRouter models found.</p>
                          <p className="mb-2 text-xs">API Key: {settings.providers.openrouter?.apiKey ? 'Present' : 'Not set'}</p>
                          <p className="mb-2 text-xs">Env Key: {process.env.NEXT_PUBLIC_OPENROUTER_API_KEY ? 'Present' : 'Not set'}</p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Prevent the event from bubbling up
                              e.preventDefault();
                              console.log('Manually refreshing OpenRouter models...');
                              // Use a local loading state to prevent multiple clicks
                              const button = e.currentTarget;
                              if (button.disabled) return;

                              button.disabled = true;
                              button.innerHTML = '<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Fetching...';

                              // Try to directly fetch OpenRouter models
                              try {
                                const openRouterProvider = createProvider('openrouter', settings);
                                openRouterProvider.listModels()
                                  .then(models => {
                                    if (models && models.length > 0) {
                                      console.log(`ModelSelector: Successfully fetched ${models.length} OpenRouter models directly`);
                                      // After successful direct fetch, refresh all models to update the UI
                                      refreshAllModels()
                                        .then(() => {
                                          // Force a second refresh after a short delay to ensure UI updates
                                          setTimeout(() => {
                                            console.log('Forcing second refresh to update UI');
                                            refreshAllModels().finally(() => {
                                              button.disabled = false;
                                              button.innerHTML = 'Fetch OpenRouter Models';
                                            });
                                          }, 500);
                                        })
                                        .catch(() => {
                                          button.disabled = false;
                                          button.innerHTML = 'Retry Fetch';
                                        });
                                    } else {
                                      // If no models were fetched directly, try the normal refresh
                                      refreshAllModels()
                                        .then(() => {
                                          setTimeout(() => {
                                            refreshAllModels().finally(() => {
                                              button.disabled = false;
                                              button.innerHTML = 'Fetch OpenRouter Models';
                                            });
                                          }, 500);
                                        })
                                        .catch(() => {
                                          button.disabled = false;
                                          button.innerHTML = 'Retry Fetch';
                                        });
                                    }
                                  })
                                  .catch(err => {
                                    console.error('Error fetching OpenRouter models directly:', err);
                                    // If direct fetch fails, try the normal refresh
                                    refreshAllModels()
                                      .then(() => {
                                        setTimeout(() => {
                                          refreshAllModels().finally(() => {
                                            button.disabled = false;
                                            button.innerHTML = 'Fetch OpenRouter Models';
                                          });
                                        }, 500);
                                      })
                                      .catch(() => {
                                        button.disabled = false;
                                        button.innerHTML = 'Retry Fetch';
                                      });
                                  });
                              } catch (err) {
                                console.error('Error creating OpenRouter provider:', err);
                                // If provider creation fails, try the normal refresh
                                refreshAllModels()
                                  .then(() => {
                                    setTimeout(() => {
                                      refreshAllModels().finally(() => {
                                        button.disabled = false;
                                        button.innerHTML = 'Fetch OpenRouter Models';
                                      });
                                    }, 500);
                                  })
                                  .catch(() => {
                                    button.disabled = false;
                                    button.innerHTML = 'Retry Fetch';
                                  });
                              }
                            }}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm inline-flex items-center"
                          >
                            <FaSpinner className="mr-2" /> Fetch OpenRouter Models
                          </button>
                        </div>
                      ) : 'No models available'
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center">
                        {getProviderIcon(selectedProvider)}
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {getProviderDisplayName(selectedProvider)}
                        </h4>
                      </div>
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full">
                        {settings.providers[selectedProvider].local ? 'Local' : 'Cloud'}
                      </span>
                    </div>

                    {filteredModels[selectedProvider].map((model) => (
                      <button
                        key={`${selectedProvider}-${model.name}`}
                        onClick={() => handleModelSelect(selectedProvider, model.name)}
                        className={`w-full text-left px-3 ${selectedProvider === 'openrouter' ? 'py-1.5' : 'py-2'} rounded-md text-sm flex items-center justify-between mb-1 ${
                          selectedModel?.provider === selectedProvider && selectedModel?.model === model.name
                            ? `bg-primary text-white`
                            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'
                        }`}
                      >
                        <div className="flex flex-col">
                          <div className="flex items-center">
                            {selectedProvider === 'openrouter' ? (
                              <div className="flex flex-col">
                                <span className="font-medium">{model.displayName || model.name}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{model.name.split('/')[0]}/{model.name.split('/')[1]}</span>
                                {(model.is_free || model.name.includes('free')) && (
                                  <span className="text-xs text-green-500 dark:text-green-400 font-semibold">Free</span>
                                )}
                                {!model.is_free && model.pricing && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    ${model.pricing.prompt.toFixed(6)}/1M prompt, ${model.pricing.completion.toFixed(6)}/1M completion
                                  </span>
                                )}
                              </div>
                            ) : (
                              <>
                                <FaRobot className="mr-2" />
                                <span className="font-medium">{model.displayName || model.name}</span>
                              </>
                            )}
                          </div>
                          {model.description && selectedProvider !== 'openrouter' && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-6 mt-1">{model.description}</span>
                          )}
                        </div>
                        {selectedProvider === 'openrouter' && model.top_provider && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full">
                            {model.top_provider}
                          </span>
                        )}
                        {model.size && (
                          <span className="text-xs opacity-80 ml-2">{formatSize(model.size)}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelSelector;
