"use client";

/**
 * Utility functions for managing API keys in localStorage and environment variables
 * These functions are used to read and write API keys
 */

/**
 * Get an API key from localStorage
 * @param {string} provider - The provider name
 * @param {string} defaultValue - Default value if the API key is not set
 * @returns {string} - The API key or the default value
 */
export const getStoredApiKey = (provider, defaultValue = '') => {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    // Get API key from localStorage
    return localStorage.getItem(`apiKey_${provider}`) || defaultValue;
  }
  return defaultValue;
};

/**
 * Get an API key from environment variables
 * @param {string} provider - The provider name
 * @returns {string|null} - The API key or null if not set
 */
export const getEnvApiKey = (provider) => {
  // Special case for Ollama host
  if (provider === 'ollama_host') {
    return process.env.NEXT_PUBLIC_OLLAMA_HOST || null;
  }

  // Special case for OpenRouter
  if (provider === 'openrouter') {
    return process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || null;
  }

  // For regular API keys
  const envKey = `NEXT_PUBLIC_${provider.toUpperCase()}_API_KEY`;
  return process.env[envKey] || null;
};

/**
 * Get an API key from either environment variables or localStorage
 * Prioritizes environment variables over localStorage
 * @param {string} provider - The provider name
 * @param {string} defaultValue - Default value if the API key is not set
 * @returns {string} - The API key or the default value
 */
export const getApiKey = (provider, defaultValue = '') => {
  // First try to get from environment variables
  const envKey = getEnvApiKey(provider);
  if (envKey) {
    console.log(`Found API key for ${provider} in environment variables`);
    return envKey;
  }

  // If not found in environment variables, try localStorage
  const storedKey = getStoredApiKey(provider, defaultValue);
  console.log(`${storedKey ? 'Found' : 'Did not find'} API key for ${provider} in localStorage`);
  return storedKey;
};

/**
 * Save API keys to the .env file via API endpoint
 * This function will call a server-side API to update the .env file
 *
 * @param {Object} apiKeys - Object containing API keys for different providers
 * @returns {Promise<{success: boolean, message: string}>} - Result of the operation
 */
export const saveApiKeysToEnv = async (apiKeys) => {
  try {
    // Filter out empty values
    const filteredKeys = Object.fromEntries(
      Object.entries(apiKeys).filter(([_, value]) => value)
    );

    // Call the API endpoint to update the .env file
    const response = await fetch('/api/update-env', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ apiKeys: filteredKeys }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to update .env file');
    }

    return {
      success: true,
      message: 'API keys saved to .env file successfully',
    };
  } catch (error) {
    console.error('Error saving API keys to .env file:', error);
    return {
      success: false,
      message: error.message || 'Failed to update .env file',
    };
  }
};

/**
 * Extract API keys from settings
 * @param {Object} settings - The application settings
 * @returns {Object} - Object containing API keys for different providers
 */
export const extractApiKeys = (settings) => {
  const apiKeys = {};

  // Extract API keys from settings
  Object.entries(settings.providers).forEach(([provider, config]) => {
    if (config.apiKey) {
      apiKeys[provider] = config.apiKey;
    }
  });

  // Special case for Ollama host
  if (settings.providers.ollama && settings.providers.ollama.baseUrl) {
    apiKeys.ollama_host = settings.providers.ollama.baseUrl;
  }

  return apiKeys;
};
