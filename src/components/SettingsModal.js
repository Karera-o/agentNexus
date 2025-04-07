"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { FaCog, FaTimes, FaCheck, FaExclamationTriangle, FaRobot, FaServer, FaKey, FaGlobe, FaToggleOn, FaToggleOff, FaInfoCircle, FaSave, FaCopy } from 'react-icons/fa';
import { useSettings } from '../context/SettingsContext';
import { extractApiKeys, saveApiKeysToStorage, generateApiKeyInstructions } from '../utils/storageManager';
import { saveApiKeysToEnv } from '../utils/envManager';
import EnvDebugger from './EnvDebugger';
import OpenRouterDebugger from './OpenRouterDebugger';

const SettingsModal = () => {
  const { settings, updateSetting, updateProviderSetting, resetSettings, isSettingsOpen, setIsSettingsOpen, fetchModelsForProvider, fetchAllModels } = useSettings();
  const [activeTab, setActiveTab] = useState('general');
  const [providerStatus, setProviderStatus] = useState({});
  const [testingConnection, setTestingConnection] = useState(false);
  const [saveApiKeysMessage, setSaveApiKeysMessage] = useState('');
  const [showApiKeyInstructions, setShowApiKeyInstructions] = useState(false);

  // Handle saving API keys to localStorage
  const handleSaveApiKeys = () => {
    // Extract API keys from settings
    const apiKeys = extractApiKeys(settings);

    // Save API keys to localStorage
    saveApiKeysToStorage(apiKeys);

    // Generate instructions for the user
    const instructions = generateApiKeyInstructions(apiKeys);

    // Show instructions to the user
    setSaveApiKeysMessage(instructions);
    setShowApiKeyInstructions(true);
  };

  // Handle saving API keys to .env file
  const handleSaveApiKeysToEnv = async () => {
    // Extract API keys from settings
    const apiKeys = extractApiKeys(settings);

    // Save API keys to .env file
    setTestingConnection(true);
    try {
      const result = await saveApiKeysToEnv(apiKeys);

      if (result.success) {
        setSaveApiKeysMessage(`API keys successfully saved to .env file. The changes will take effect after restarting the application.`);
      } else {
        setSaveApiKeysMessage(`Error saving API keys to .env file: ${result.message}`);
      }

      setShowApiKeyInstructions(true);
    } catch (error) {
      setSaveApiKeysMessage(`Error saving API keys to .env file: ${error.message || 'Unknown error'}`);
      setShowApiKeyInstructions(true);
    } finally {
      setTestingConnection(false);
    }
  };

  // Copy API key instructions to clipboard
  const copyInstructionsToClipboard = () => {
    const apiKeys = extractApiKeys(settings);
    const apiKeysList = Object.entries(apiKeys)
      .filter(([_, value]) => value) // Only include non-empty values
      .map(([provider, value]) => `${provider}: ${value}`)
      .join('\n');

    navigator.clipboard.writeText(apiKeysList);
    alert('API keys copied to clipboard!');
  };

  // Fetch status for all enabled providers
  const fetchAllProviderStatus = useCallback(async () => {
    setTestingConnection(true);
    try {
      // Get all enabled providers
      const enabledProviders = Object.keys(settings.providers).filter(
        (provider) => settings.providers[provider].enabled
      );

      // Initialize status object
      const statusObj = {};

      // Fetch models for each provider
      for (const provider of enabledProviders) {
        try {
          await fetchModelsForProvider(provider);
          statusObj[provider] = { checked: true, running: true };
        } catch (error) {
          console.error(`Error fetching models for ${provider}:`, error);
          statusObj[provider] = { checked: true, running: false };
        }
      }

      setProviderStatus(statusObj);
    } catch (error) {
      console.error('Error fetching provider status:', error);
    } finally {
      setTestingConnection(false);
    }
  }, [settings.providers, fetchModelsForProvider, setProviderStatus, setTestingConnection]);

  // Check provider status when settings modal is opened
  useEffect(() => {
    if (isSettingsOpen) {
      fetchAllProviderStatus();
    }
  }, [isSettingsOpen, fetchAllProviderStatus]);

  // Check status for a specific provider
  const checkProviderStatus = async (provider) => {
    setTestingConnection(true);
    try {
      // Fetch models and store the result
      const models = await fetchModelsForProvider(provider);

      // Update provider status
      setProviderStatus(prev => ({
        ...prev,
        [provider]: { checked: true, running: true }
      }));

      // Log success message
      console.log(`Successfully loaded ${models.length} models for ${provider}`);

      // If it's OpenRouter, set the default model if none is selected
      if (provider === 'openrouter' && !settings.providers.openrouter.defaultModel && models.length > 0) {
        updateProviderSetting('openrouter', 'defaultModel', models[0].name);
      }

      return models;
    } catch (error) {
      console.error(`Error checking ${provider} status:`, error);
      setProviderStatus(prev => ({
        ...prev,
        [provider]: { checked: true, running: false }
      }));
      return [];
    } finally {
      setTestingConnection(false);
    }
  };

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-md shadow-md w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-base font-medium flex items-center text-gray-900 dark:text-white">
            <FaCog className="mr-1.5 text-gray-500 dark:text-gray-400" /> Settings
          </h2>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
          >
            <FaTimes className="text-sm" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-40 border-r border-gray-200 dark:border-gray-700 p-2 overflow-y-auto">
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('general')}
                className={`w-full text-left px-2 py-1.5 rounded-md flex items-center text-sm ${
                  activeTab === 'general'
                    ? 'bg-primary/10 text-primary dark:text-primary-light border-l-2 border-primary'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                <FaCog className="mr-1.5 text-xs" /> General
              </button>
              <button
                onClick={() => setActiveTab('providers')}
                className={`w-full text-left px-2 py-1.5 rounded-md flex items-center text-sm ${
                  activeTab === 'providers'
                    ? 'bg-primary/10 text-primary dark:text-primary-light border-l-2 border-primary'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                <FaRobot className="mr-1.5 text-xs" /> Model Providers
              </button>
              <button
                onClick={() => setActiveTab('about')}
                className={`w-full text-left px-2 py-1.5 rounded-md flex items-center text-sm ${
                  activeTab === 'about'
                    ? 'bg-primary/10 text-primary dark:text-primary-light border-l-2 border-primary'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                <FaInfoCircle className="mr-1.5 text-xs" /> About
              </button>
            </nav>
          </div>

          {/* Main content */}
          <div className="flex-1 p-4 overflow-y-auto">
            {activeTab === 'general' && (
              <div className="space-y-4">
                <h3 className="text-base font-medium text-gray-900 dark:text-white">General Settings</h3>

                <div className="space-y-3">
                  {/* Default Model Provider */}
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Default Model Provider</label>
                    <select
                      value={settings.modelProvider}
                      onChange={(e) => updateSetting('modelProvider', e.target.value)}
                      className="w-full p-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
                    >
                      {Object.entries(settings.providers)
                        .filter(([_, providerSettings]) => providerSettings.enabled)
                        .map(([provider]) => (
                          <option key={provider} value={provider}>
                            {provider.charAt(0).toUpperCase() + provider.slice(1)}
                          </option>
                        ))
                      }
                    </select>
                  </div>

                  {/* Theme */}
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Theme</label>
                    <select
                      value={settings.theme}
                      onChange={(e) => updateSetting('theme', e.target.value)}
                      className="w-full p-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="system">System</option>
                    </select>
                  </div>

                  {/* Message History */}
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                      Message History Limit
                      <span className="text-xs text-gray-500 ml-2">(Number of messages to keep)</span>
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="500"
                      value={settings.messageHistory}
                      onChange={(e) => updateSetting('messageHistory', parseInt(e.target.value))}
                      className="w-full p-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
                    />
                  </div>

                  {/* Stream Responses */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Stream Responses</label>
                    <button
                      onClick={() => updateSetting('streamResponses', !settings.streamResponses)}
                      className={`relative inline-flex items-center h-5 rounded-full w-9 transition-colors focus:outline-none ${
                        settings.streamResponses ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block w-3 h-3 transform bg-white rounded-full transition-transform ${
                          settings.streamResponses ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Debug Mode */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Debug Mode</label>
                    <button
                      onClick={() => updateSetting('debugMode', !settings.debugMode)}
                      className={`relative inline-flex items-center h-5 rounded-full w-9 transition-colors focus:outline-none ${
                        settings.debugMode ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block w-3 h-3 transform bg-white rounded-full transition-transform ${
                          settings.debugMode ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Reset Button */}
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  {/* Environment Variables Debugger */}
                  <EnvDebugger />

                  <div className="flex flex-wrap gap-2 mt-2">
                    <button
                      className="px-3 py-1.5 bg-primary/10 text-primary dark:text-primary-light rounded-md hover:bg-primary/20 transition-colors flex items-center text-sm"
                      onClick={() => {
                        handleSaveApiKeys();
                      }}
                    >
                      <FaSave className="mr-1.5 text-xs" /> Save to Browser
                    </button>
                    <button
                      className="px-3 py-1.5 bg-secondary/10 text-secondary dark:text-secondary-light rounded-md hover:bg-secondary/20 transition-colors flex items-center text-sm"
                      onClick={() => {
                        handleSaveApiKeysToEnv();
                      }}
                      disabled={testingConnection}
                    >
                      <FaKey className="mr-1.5 text-xs" /> {testingConnection ? 'Saving...' : 'Save to .env File'}
                    </button>
                    <button
                      onClick={resetSettings}
                      className="px-3 py-1.5 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm"
                    >
                      Reset to Default Settings
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'providers' && (
              <div className="space-y-4">
                <h3 className="text-base font-medium text-gray-900 dark:text-white">Model Providers</h3>

                {/* Ollama */}
                {settings.providers.ollama && (
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center">
                        <FaServer className="mr-2 text-blue-500" />
                        <h4 className="text-lg font-medium">Ollama</h4>
                      </div>
                      <button
                        onClick={() => updateProviderSetting('ollama', 'enabled', !settings.providers.ollama.enabled)}
                        className={`relative inline-flex items-center h-5 rounded-full w-9 transition-colors focus:outline-none ${
                          settings.providers.ollama.enabled ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block w-3 h-3 transform bg-white rounded-full transition-transform ${
                            settings.providers.ollama.enabled ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {settings.providers.ollama.enabled && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">API URL</label>
                          <div className="flex">
                            <input
                              type="text"
                              value={settings.providers.ollama.apiUrl}
                              onChange={(e) => updateProviderSetting('ollama', 'apiUrl', e.target.value)}
                              className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-l-lg bg-white dark:bg-gray-700"
                            />
                            <button
                              onClick={() => checkProviderStatus('ollama')}
                              disabled={testingConnection}
                              className="px-3 py-1.5 bg-primary text-white rounded-r-md hover:bg-primary-dark transition-colors disabled:bg-gray-400 text-sm"
                            >
                              {testingConnection ? 'Testing...' : 'Test'}
                            </button>
                          </div>
                        </div>

                        {providerStatus.ollama?.checked && (
                          <div className={`p-3 rounded-lg ${providerStatus.ollama?.running ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'}`}>
                            <div className="flex items-center">
                              {providerStatus.ollama?.running ? (
                                <>
                                  <FaCheck className="mr-2" />
                                  <span>Ollama server is running</span>
                                </>
                              ) : (
                                <>
                                  <FaExclamationTriangle className="mr-2" />
                                  <span>Ollama server is not running</span>
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium mb-2">Default Model</label>
                          <select
                            value={settings.providers.ollama.defaultModel}
                            onChange={(e) => updateProviderSetting('ollama', 'defaultModel', e.target.value)}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                          >
                            {providerStatus.ollama?.running && settings.providers.ollama.models && settings.providers.ollama.models.length > 0 ? (
                              settings.providers.ollama.models.map((model) => (
                                <option key={model.name} value={model.name}>
                                  {model.name}
                                </option>
                              ))
                            ) : (
                              <option value="">No models available</option>
                            )}
                          </select>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Select the default model to use with Ollama
                          </p>
                        </div>

                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Ollama runs locally on your machine. Make sure you have Ollama installed and running.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* OpenAI */}
                {settings.providers.openai && (
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center">
                        <FaRobot className="mr-2 text-green-500" />
                        <h4 className="text-lg font-medium">OpenAI</h4>
                      </div>
                      <button
                        onClick={() => updateProviderSetting('openai', 'enabled', !settings.providers.openai.enabled)}
                        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none ${
                          settings.providers.openai.enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                            settings.providers.openai.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {settings.providers.openai.enabled && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">API Key</label>
                          <input
                            type="password"
                            value={settings.providers.openai.apiKey}
                            onChange={(e) => updateProviderSetting('openai', 'apiKey', e.target.value)}
                            placeholder="sk-..."
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Default Model</label>
                          <select
                            value={settings.providers.openai.defaultModel}
                            onChange={(e) => updateProviderSetting('openai', 'defaultModel', e.target.value)}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                          >
                            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                            <option value="gpt-4">GPT-4</option>
                            <option value="gpt-4-turbo">GPT-4 Turbo</option>
                          </select>
                        </div>

                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          You need an OpenAI API key to use OpenAI models. Your API key is stored locally and never sent to our servers.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Anthropic */}
                {settings.providers.anthropic && (
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center">
                        <FaRobot className="mr-2 text-purple-500" />
                        <h4 className="text-lg font-medium">Anthropic</h4>
                      </div>
                      <button
                        onClick={() => updateProviderSetting('anthropic', 'enabled', !settings.providers.anthropic.enabled)}
                        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none ${
                          settings.providers.anthropic.enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                            settings.providers.anthropic.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {settings.providers.anthropic.enabled && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">API Key</label>
                          <input
                            type="password"
                            value={settings.providers.anthropic.apiKey}
                            onChange={(e) => updateProviderSetting('anthropic', 'apiKey', e.target.value)}
                            placeholder="sk-ant-..."
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Default Model</label>
                          <select
                            value={settings.providers.anthropic.defaultModel}
                            onChange={(e) => updateProviderSetting('anthropic', 'defaultModel', e.target.value)}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                          >
                            <option value="claude-2">Claude 2</option>
                            <option value="claude-instant-1">Claude Instant</option>
                            <option value="claude-3-opus">Claude 3 Opus</option>
                            <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                            <option value="claude-3-haiku">Claude 3 Haiku</option>
                          </select>
                        </div>

                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          You need an Anthropic API key to use Claude models. Your API key is stored locally and never sent to our servers.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* LocalAI */}
                {settings.providers.localAI && (
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center">
                        <FaServer className="mr-2 text-yellow-500" />
                        <h4 className="text-lg font-medium">LocalAI</h4>
                      </div>
                      <button
                        onClick={() => updateProviderSetting('localAI', 'enabled', !settings.providers.localAI.enabled)}
                        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none ${
                          settings.providers.localAI.enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                            settings.providers.localAI.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {settings.providers.localAI.enabled && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">API URL</label>
                          <input
                            type="text"
                            value={settings.providers.localAI.apiUrl}
                            onChange={(e) => updateProviderSetting('localAI', 'apiUrl', e.target.value)}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">API Key (if required)</label>
                          <input
                            type="password"
                            value={settings.providers.localAI.apiKey}
                            onChange={(e) => updateProviderSetting('localAI', 'apiKey', e.target.value)}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                          />
                        </div>

                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          LocalAI is an API compatible with OpenAI&apos;s API but running locally or on your own server.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* DeepSeek */}
                {settings.providers.deepseek && (
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center">
                        <FaRobot className="mr-2 text-blue-400" />
                        <h4 className="text-lg font-medium">DeepSeek</h4>
                      </div>
                      <button
                        onClick={() => updateProviderSetting('deepseek', 'enabled', !settings.providers.deepseek.enabled)}
                        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none ${
                          settings.providers.deepseek.enabled ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                            settings.providers.deepseek.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {settings.providers.deepseek.enabled && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">API Key</label>
                          <input
                            type="password"
                            value={settings.providers.deepseek.apiKey}
                            onChange={(e) => updateProviderSetting('deepseek', 'apiKey', e.target.value)}
                            placeholder="sk-..."
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Default Model</label>
                          <select
                            value={settings.providers.deepseek.defaultModel}
                            onChange={(e) => updateProviderSetting('deepseek', 'defaultModel', e.target.value)}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                          >
                            <option value="deepseek-chat">DeepSeek Chat</option>
                            <option value="deepseek-coder">DeepSeek Coder</option>
                          </select>
                        </div>

                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          DeepSeek provides powerful AI models for chat and coding tasks. You need a DeepSeek API key to use these models.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Gemini */}
                {settings.providers.gemini && (
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center">
                        <FaRobot className="mr-2 text-blue-500" />
                        <h4 className="text-lg font-medium">Google Gemini</h4>
                      </div>
                      <button
                        onClick={() => updateProviderSetting('gemini', 'enabled', !settings.providers.gemini.enabled)}
                        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none ${
                          settings.providers.gemini.enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                            settings.providers.gemini.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {settings.providers.gemini.enabled && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">API Key</label>
                          <input
                            type="password"
                            value={settings.providers.gemini.apiKey}
                            onChange={(e) => updateProviderSetting('gemini', 'apiKey', e.target.value)}
                            placeholder="YOUR_API_KEY"
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Default Model</label>
                          <select
                            value={settings.providers.gemini.defaultModel}
                            onChange={(e) => updateProviderSetting('gemini', 'defaultModel', e.target.value)}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                          >
                            <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                            <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                            <option value="gemini-1.0-pro">Gemini 1.0 Pro</option>
                          </select>
                        </div>

                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Google Gemini provides powerful AI models with multimodal capabilities. You need a Google API key to use these models.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* OpenRouter */}
                {settings.providers.openrouter && (
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center">
                        <FaGlobe className="mr-2 text-green-400" />
                        <h4 className="text-lg font-medium">OpenRouter</h4>
                      </div>
                      <button
                        onClick={() => updateProviderSetting('openrouter', 'enabled', !settings.providers.openrouter.enabled)}
                        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none ${
                          settings.providers.openrouter.enabled ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                            settings.providers.openrouter.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {settings.providers.openrouter.enabled && (
                      <div className="space-y-4">
                        {/* OpenRouter Debugger */}
                        <OpenRouterDebugger />

                        <div>
                          <label className="block text-sm font-medium mb-2">API Key</label>
                          <div className="flex">
                            <input
                              type="password"
                              value={settings.providers.openrouter.apiKey}
                              onChange={(e) => updateProviderSetting('openrouter', 'apiKey', e.target.value)}
                              placeholder="sk-or-..."
                              className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-l-lg bg-white dark:bg-gray-700"
                            />
                            <button
                              onClick={() => checkProviderStatus('openrouter')}
                              disabled={testingConnection}
                              className="px-3 py-1.5 bg-primary text-white rounded-r-md hover:bg-primary-dark transition-colors disabled:bg-gray-400 text-sm"
                            >
                              {testingConnection ? 'Testing...' : 'Test'}
                            </button>
                          </div>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Get your API key from <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">OpenRouter</a>. After adding your key, click Test to fetch available models.
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Default Model</label>
                          <select
                            value={settings.providers.openrouter.defaultModel}
                            onChange={(e) => updateProviderSetting('openrouter', 'defaultModel', e.target.value)}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                          >
                            {providerStatus.openrouter?.running && settings.providers.openrouter.models && settings.providers.openrouter.models.length > 0 ? (
                              settings.providers.openrouter.models.map((model) => (
                                <option key={model.name} value={model.name}>
                                  {model.displayName || model.name}
                                </option>
                              ))
                            ) : (
                              <>
                                <option value="openai/gpt-3.5-turbo">OpenAI / GPT-3.5 Turbo</option>
                                <option value="openai/gpt-4">OpenAI / GPT-4</option>
                                <option value="openai/gpt-4-turbo">OpenAI / GPT-4 Turbo</option>
                                <option value="anthropic/claude-3-opus">Anthropic / Claude 3 Opus</option>
                                <option value="anthropic/claude-3-sonnet">Anthropic / Claude 3 Sonnet</option>
                                <option value="anthropic/claude-3-haiku">Anthropic / Claude 3 Haiku</option>
                                <option value="google/gemini-pro">Google / Gemini Pro</option>
                                <option value="meta/llama-3-70b">Meta / Llama 3 70B</option>
                                <option value="meta/llama-3-8b">Meta / Llama 3 8B</option>
                                <option value="mistralai/mistral-large">Mistral / Mistral Large</option>
                                <option value="mistralai/mistral-medium">Mistral / Mistral Medium</option>
                                <option value="mistralai/mistral-small">Mistral / Mistral Small</option>
                              </>
                            )}
                          </select>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Select the default model to use with OpenRouter
                          </p>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="text-sm font-medium mr-2">Status:</span>
                            {providerStatus.openrouter?.checked ? (
                              providerStatus.openrouter.running ? (
                                <span className="text-green-500 flex items-center">
                                  <FaCheck className="mr-1" /> Connected
                                </span>
                              ) : (
                                <span className="text-red-500 flex items-center">
                                  <FaExclamationTriangle className="mr-1" /> Not Connected
                                </span>
                              )
                            ) : (
                              <span className="text-gray-500">Not Checked</span>
                            )}
                          </div>
                          <button
                            onClick={() => checkProviderStatus('openrouter')}
                            disabled={testingConnection}
                            className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 text-xs"
                          >
                            {testingConnection ? 'Checking...' : 'Check Connection'}
                          </button>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Advanced Settings</label>

                          <div className="space-y-2 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <div className="flex items-center justify-between">
                              <label className="text-sm">Use Middle-Out Transform</label>
                              <button
                                onClick={() => updateProviderSetting('openrouter', 'useMiddleOutTransform', !settings.providers.openrouter.useMiddleOutTransform)}
                                className={`relative inline-flex items-center h-5 rounded-full w-9 transition-colors focus:outline-none ${settings.providers.openrouter.useMiddleOutTransform ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                              >
                                <span className={`inline-block w-3 h-3 transform bg-white rounded-full transition-transform ${settings.providers.openrouter.useMiddleOutTransform ? 'translate-x-5' : 'translate-x-1'}`} />
                              </button>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Improves response quality by generating the middle of the response first
                            </p>

                            <div className="mt-2">
                              <label className="text-sm block mb-1">Specific Provider (Optional)</label>
                              <input
                                type="text"
                                value={settings.providers.openrouter.specificProvider}
                                onChange={(e) => updateProviderSetting('openrouter', 'specificProvider', e.target.value)}
                                placeholder="[default]"
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                              />
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Force a specific provider (e.g., &apos;openai&apos;, &apos;anthropic&apos;). Leave as &apos;[default]&apos; to use OpenRouter&apos;s routing.
                              </p>
                            </div>
                          </div>
                        </div>

                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          OpenRouter provides access to multiple AI models through a single API. Models are specified in the format &quot;provider/model-name&quot;.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Requesty */}
                {settings.providers.requesty && (
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center">
                        <FaServer className="mr-2 text-orange-400" />
                        <h4 className="text-lg font-medium">Requesty</h4>
                      </div>
                      <button
                        onClick={() => updateProviderSetting('requesty', 'enabled', !settings.providers.requesty.enabled)}
                        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none ${
                          settings.providers.requesty.enabled ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                            settings.providers.requesty.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {settings.providers.requesty.enabled && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">API URL</label>
                          <input
                            type="text"
                            value={settings.providers.requesty.baseUrl}
                            onChange={(e) => updateProviderSetting('requesty', 'baseUrl', e.target.value)}
                            placeholder="https://api.requesty.ai/v1"
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">API Key</label>
                          <input
                            type="password"
                            value={settings.providers.requesty.apiKey}
                            onChange={(e) => updateProviderSetting('requesty', 'apiKey', e.target.value)}
                            placeholder="sk-..."
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Default Model</label>
                          <select
                            value={settings.providers.requesty.defaultModel}
                            onChange={(e) => updateProviderSetting('requesty', 'defaultModel', e.target.value)}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                          >
                            {settings.providers.requesty.models && settings.providers.requesty.models.length > 0 ? (
                              settings.providers.requesty.models.map((model) => (
                                <option key={model.name} value={model.name}>
                                  {model.name}
                                </option>
                              ))
                            ) : (
                              <>
                                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                                <option value="gpt-4">GPT-4</option>
                                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                                <option value="custom">Custom Model</option>
                              </>
                            )}
                          </select>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Select the default model to use with your custom API
                          </p>
                        </div>

                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Requesty is a custom API endpoint compatible with OpenAI&apos;s API format. Use this for self-hosted or custom model APIs.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'about' && (
              <div className="space-y-4">
                <h3 className="text-base font-medium text-gray-900 dark:text-white">About AgentNexus</h3>

                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Version</h4>
                  <p className="text-sm">1.0.0</p>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Description</h4>
                  <p>
                    AgentNexus is a central hub for software and research agents designed to help with various tasks.
                    It provides specialized AI agents for requirements analysis, documentation,
                    system design, database design, and UI architecture.
                  </p>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Features</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li>Multiple specialized AI agents</li>
                    <li>Support for multiple model providers</li>
                    <li>File upload and analysis</li>
                    <li>Local storage for privacy</li>
                    <li>Export/import functionality</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="px-3 py-1.5 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors text-sm"
          >
            Close
          </button>
        </div>
      </div>

      {/* API Key Instructions Modal */}
      {showApiKeyInstructions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setShowApiKeyInstructions(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <FaTimes />
            </button>

            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">API Keys Saved</h3>

            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg mb-4 overflow-auto max-h-60">
              <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                {saveApiKeysMessage.includes('.env file') ? (
                  <>
                    <p className="mb-2">✅ {saveApiKeysMessage}</p>
                  </>
                ) : (
                  <>
                    <p className="mb-2">✅ Your API keys have been saved to your browser&apos;s localStorage.</p>
                    <p className="mb-4">They will be automatically loaded the next time you open the application.</p>

                    <h4 className="font-semibold mb-2">API Keys Saved:</h4>
                    <pre className="bg-gray-200 dark:bg-gray-600 p-2 rounded">
                      {saveApiKeysMessage}
                    </pre>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={copyInstructionsToClipboard}
                className="px-4 py-2 bg-primary/10 text-primary dark:bg-primary-dark/30 dark:text-blue-400 rounded-lg hover:bg-primary/20 dark:hover:bg-blue-900/50 transition-colors flex items-center"
              >
                <FaCopy className="mr-2" /> Copy API Keys
              </button>
              <button
                onClick={() => setShowApiKeyInstructions(false)}
                className="px-4 py-2 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsModal;
