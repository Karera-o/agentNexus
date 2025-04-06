"use client";

/**
 * Utility functions for accessing environment variables in client-side code
 */

/**
 * Get an API key from client-side environment variables
 * @param {string} provider - The provider name
 * @returns {string|null} - The API key or null if not set
 */
export const getClientEnvApiKey = (provider) => {
  // Special case for Ollama host
  if (provider === 'ollama_host') {
    return process.env.NEXT_PUBLIC_OLLAMA_HOST || null;
  }

  // Special case for OpenRouter
  if (provider === 'openrouter') {
    return process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || null;
  }

  // For other providers
  const envKey = `NEXT_PUBLIC_${provider.toUpperCase()}_API_KEY`;
  return process.env[envKey] || null;
};

/**
 * Get all client-side environment variables
 * @returns {Object} - Object containing all client-side environment variables
 */
export const getAllClientEnvVars = () => {
  return {
    NEXT_PUBLIC_OPENAI_API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    NEXT_PUBLIC_ANTHROPIC_API_KEY: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
    NEXT_PUBLIC_GEMINI_API_KEY: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
    NEXT_PUBLIC_DEEPSEEK_API_KEY: process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY,
    NEXT_PUBLIC_OPENROUTER_API_KEY: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY,
    NEXT_PUBLIC_REQUESTY_API_KEY: process.env.NEXT_PUBLIC_REQUESTY_API_KEY,
    NEXT_PUBLIC_OLLAMA_HOST: process.env.NEXT_PUBLIC_OLLAMA_HOST,
  };
};

/**
 * Log all client-side environment variables
 */
export const logAllClientEnvVars = () => {
  const envVars = getAllClientEnvVars();
  console.log('Client-side environment variables:');
  Object.entries(envVars).forEach(([key, value]) => {
    console.log(`${key}: ${value ? 'Present (length: ' + value.length + ')' : 'Not set'}`);
  });
};
