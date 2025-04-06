"use client";

// Import statements need to be at the top
// These will be imported after the BaseProvider is defined

/**
 * Base class for model providers
 * Implements common functionality and defines the interface for all providers
 */
export class BaseProvider {
  constructor(settings) {
    this.settings = settings;
    this.name = 'base';
    this.baseUrl = '';
  }

  /**
   * Check if the provider is available (API is accessible)
   * @returns {Promise<boolean>} True if the provider is available
   */
  async isAvailable() {
    return false;
  }

  /**
   * List available models from the provider
   * @returns {Promise<Array>} List of available models
   */
  async listModels() {
    return [];
  }

  /**
   * Generate a chat completion
   * @param {string} model - The model to use
   * @param {Array} messages - Array of message objects with role and content
   * @param {Object} options - Additional options for the model
   * @returns {Promise<Object>} The generated response
   */
  async generateCompletion(model, messages, options = {}) {
    throw new Error('Not implemented');
  }

  /**
   * Generate a streaming chat completion
   * @param {string} model - The model to use
   * @param {Array} messages - Array of message objects with role and content
   * @param {Function} onChunk - Callback function for each chunk of the response
   * @param {Object} options - Additional options for the model
   * @returns {Promise<void>}
   */
  async generateStreamingCompletion(model, messages, onChunk, options = {}) {
    throw new Error('Not implemented');
  }
}

/**
 * Factory function to create a provider instance based on provider name
 * @param {string} providerName - The name of the provider
 * @param {Object} settings - The settings object
 * @returns {BaseProvider} A provider instance
 */
export const createProvider = (providerName, settings) => {
  switch (providerName) {
    case 'ollama':
      return new OllamaProvider(settings);
    case 'openai':
      return new OpenAIProvider(settings);
    case 'anthropic':
      return new AnthropicProvider(settings);
    case 'gemini':
      return new GeminiProvider(settings);
    case 'deepseek':
      return new DeepSeekProvider(settings);
    case 'openrouter':
      return new OpenRouterProvider(settings);
    case 'requesty':
      return new RequestyProvider(settings);
    default:
      throw new Error(`Unknown provider: ${providerName}`);
  }
};

/**
 * Get all available providers based on settings
 * @param {Object} settings - The settings object
 * @returns {Array} Array of provider instances
 */
export const getAllProviders = (settings) => {
  const providers = [];

  if (settings.providers.ollama && settings.providers.ollama.enabled) {
    providers.push(new OllamaProvider(settings));
  }

  if (settings.providers.openai && settings.providers.openai.enabled) {
    providers.push(new OpenAIProvider(settings));
  }

  if (settings.providers.anthropic && settings.providers.anthropic.enabled) {
    providers.push(new AnthropicProvider(settings));
  }

  if (settings.providers.gemini && settings.providers.gemini.enabled) {
    providers.push(new GeminiProvider(settings));
  }

  if (settings.providers.deepseek && settings.providers.deepseek.enabled) {
    providers.push(new DeepSeekProvider(settings));
  }

  if (settings.providers.openrouter && settings.providers.openrouter.enabled) {
    providers.push(new OpenRouterProvider(settings));
  }

  if (settings.providers.requesty && settings.providers.requesty.enabled) {
    providers.push(new RequestyProvider(settings));
  }

  return providers;
};
