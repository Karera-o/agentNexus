"use client";

import React, { createContext, useState, useContext, useEffect } from 'react';
import { createProvider, getAllProviders } from '../services/providers/provider-factory';

// Default settings
const defaultSettings = {
  theme: 'system', // 'light', 'dark', 'system'
  messageHistory: 50, // Number of messages to keep in history
  streamResponses: true, // Whether to stream responses
  providers: {
    // Local models
    ollama: {
      name: 'Ollama',
      enabled: true,
      baseUrl: 'http://localhost:11434/api',
      defaultModel: '',
      models: [],
      description: 'Run large language models locally',
      icon: '🦙',
      local: true,
    },
    // Cloud providers
    anthropic: {
      name: 'Anthropic',
      enabled: true,
      baseUrl: 'https://api.anthropic.com',
      apiKey: '',
      defaultModel: 'claude-3-haiku-20240307',
      models: [
        { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: 'Most powerful model for highly complex tasks' },
        { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', description: 'Balanced model for most tasks' },
        { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', description: 'Fast and efficient model' },
      ],
      description: 'Claude models by Anthropic',
      icon: '🧠',
      local: false,
    },
    deepseek: {
      name: 'DeepSeek',
      enabled: true,
      baseUrl: 'https://api.deepseek.com',
      apiKey: '',
      defaultModel: 'deepseek-chat',
      models: [
        { id: 'deepseek-chat', name: 'DeepSeek Chat', description: 'General purpose chat model' },
        { id: 'deepseek-coder', name: 'DeepSeek Coder', description: 'Specialized for coding tasks' },
      ],
      description: 'DeepSeek AI models',
      icon: '🔍',
      local: false,
    },
    gemini: {
      name: 'Google Gemini',
      enabled: true,
      baseUrl: 'https://generativelanguage.googleapis.com/v1',
      apiKey: '',
      defaultModel: 'gemini-1.5-pro-latest',
      models: [
        { id: 'gemini-2.5-pro-exp-03-25', name: 'Gemini 2.5 Pro (Experimental)', description: 'Latest experimental model with 1M context window' },
        { id: 'gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', description: 'Fast model with 1M context window' },
        { id: 'gemini-1.5-pro-latest', name: 'Gemini 1.5 Pro', description: 'Advanced model with 2M context window' },
        { id: 'gemini-1.5-flash-latest', name: 'Gemini 1.5 Flash', description: 'Fast model with 1M context window' },
        { id: 'gemini-1.0-pro', name: 'Gemini 1.0 Pro', description: 'Previous generation model' },
      ],
      description: 'Google Gemini models',
      icon: '🌐',
      local: false,
    },
    // API aggregators
    openrouter: {
      name: 'OpenRouter',
      enabled: true,
      baseUrl: 'https://openrouter.ai/api/v1',
      apiKey: '',
      defaultModel: 'openai/gpt-3.5-turbo',
      models: [],
      specificProvider: '[default]',
      useMiddleOutTransform: true,
      description: 'Access multiple models through one API',
      icon: '🔄',
      local: false,
    },
    requesty: {
      name: 'Requesty',
      enabled: false,
      baseUrl: 'https://api.requesty.ai/v1',
      apiKey: '',
      defaultModel: '',
      models: [],
      description: 'Custom API endpoint compatible with OpenAI',
      icon: '📡',
      local: false,
    },
  },
  // Store selected model for each agent by provider
  agentModels: {
    requirements: { provider: 'ollama', model: '' },
    documentor: { provider: 'ollama', model: '' },
    system: { provider: 'ollama', model: '' },
    database: { provider: 'ollama', model: '' },
    ui: { provider: 'ollama', model: '' },
  },
};

// Create context
const SettingsContext = createContext();

// Provider component
export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('devAgentSettings');
    if (savedSettings) {
      try {
        // Merge saved settings with default settings to ensure all fields exist
        const parsedSettings = JSON.parse(savedSettings);

        // Create a properly merged providers object
        const mergedProviders = {};

        // Start with all default providers
        Object.keys(defaultSettings.providers).forEach(providerKey => {
          mergedProviders[providerKey] = {
            ...defaultSettings.providers[providerKey],
            ...(parsedSettings.providers && parsedSettings.providers[providerKey] ? parsedSettings.providers[providerKey] : {})
          };
        });

        setSettings({
          ...defaultSettings,
          ...parsedSettings,
          providers: mergedProviders,
        });
      } catch (error) {
        console.error('Error parsing saved settings:', error);
        // If there's an error, use default settings
        setSettings(defaultSettings);
      }
    }
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('devAgentSettings', JSON.stringify(settings));
  }, [settings]);

  // Update a specific setting
  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  // Update a provider setting
  const updateProviderSetting = (provider, key, value) => {
    setSettings(prev => ({
      ...prev,
      providers: {
        ...prev.providers,
        [provider]: {
          ...prev.providers[provider],
          [key]: value,
        },
      },
    }));
  };

  // Toggle settings modal
  const toggleSettings = () => {
    setIsSettingsOpen(prev => !prev);
  };

  // Reset settings to default
  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('devAgentSettings');
  };

  // Fetch models for a specific provider
  const fetchModelsForProvider = async (providerName) => {
    try {
      if (!settings.providers[providerName] || !settings.providers[providerName].enabled) {
        return [];
      }

      // For cloud providers with predefined models, use those models unless it's OpenRouter
      const providerSettings = settings.providers[providerName];
      const isCloud = !providerSettings.local;

      // For OpenRouter, always fetch models from the API if an API key is provided
      if (providerName === 'openrouter' && providerSettings.apiKey && providerSettings.apiKey.trim() !== '') {
        // Don't return early, continue to fetch models from the API
      }
      // For other cloud providers with predefined models, return those models
      else if (isCloud && providerSettings.models && providerSettings.models.length > 0) {
        // Return the predefined models for cloud providers
        return providerSettings.models.map(model => ({
          name: model.id,
          displayName: model.name,
          description: model.description
        }));
      }

      // For local providers like Ollama, fetch models
      const provider = createProvider(providerName, settings);
      const isAvailable = await provider.isAvailable();

      if (!isAvailable) {
        console.warn(`Provider ${providerName} is not available`);
        return [];
      }

      const models = await provider.listModels();

      // If it's OpenRouter and we got models from the API, update the models in settings
      if (providerName === 'openrouter' && models.length > 0) {
        // Convert the models to the format expected by settings
        const settingsModels = models.map(model => ({
          id: model.name,
          name: model.displayName || model.name,
          description: model.description || ''
        }));

        // Update the models in settings
        updateProviderSetting(providerName, 'models', settingsModels);
      }

      // If no default model is set and models are available, set the first one as default
      if (!settings.providers[providerName].defaultModel && models.length > 0) {
        updateProviderSetting(providerName, 'defaultModel', models[0].name);
      }

      return models;
    } catch (error) {
      console.error(`Error fetching models for ${providerName}:`, error);
      return [];
    }
  };

  // Fetch models for all enabled providers
  const fetchAllModels = async () => {
    const enabledProviders = Object.keys(settings.providers).filter(
      (provider) => settings.providers[provider].enabled
    );

    const modelPromises = enabledProviders.map((provider) => fetchModelsForProvider(provider));
    await Promise.all(modelPromises);
  };

  // Context value
  const value = {
    settings,
    updateSetting,
    updateProviderSetting,
    resetSettings,
    isSettingsOpen,
    toggleSettings,
    setIsSettingsOpen,
    fetchModelsForProvider,
    fetchAllModels,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

// Custom hook to use the settings context
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export default SettingsContext;
