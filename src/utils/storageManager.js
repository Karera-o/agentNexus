"use client";

/**
 * Utility functions for managing API keys in localStorage
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
 * Save API keys to localStorage
 * @param {Object} apiKeys - Object containing API keys for different providers
 * @returns {boolean} - True if successful
 */
export const saveApiKeysToStorage = (apiKeys) => {
  try {
    // Save each API key to localStorage
    Object.entries(apiKeys).forEach(([provider, apiKey]) => {
      if (apiKey) {
        localStorage.setItem(`apiKey_${provider}`, apiKey);
        console.log(`Saved API key for ${provider} to localStorage`);
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error saving API keys to localStorage:', error);
    return false;
  }
};

/**
 * Generate instructions for manually saving API keys
 * @param {Object} apiKeys - Object containing API keys for different providers
 * @returns {string} - Instructions for saving API keys
 */
export const generateApiKeyInstructions = (apiKeys) => {
  // Create a formatted string with the API keys
  const instructions = Object.entries(apiKeys)
    .filter(([_, value]) => value) // Only include non-empty values
    .map(([provider, value]) => `${provider}: ${value.substring(0, 5)}...${value.substring(value.length - 5)}`)
    .join('\n');
  
  // Create instructions for the user
  return `
Your API keys have been saved to your browser's localStorage.
They will be remembered the next time you open the application.

API keys saved:
${instructions}
  `;
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
  
  return apiKeys;
};
