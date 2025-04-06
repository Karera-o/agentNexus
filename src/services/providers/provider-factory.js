"use client";

import { OllamaProvider } from './ollama-provider';
import { OpenAIProvider } from './openai-provider';
import { AnthropicProvider } from './anthropic-provider';
import { GeminiProvider } from './gemini-provider';
import { DeepSeekProvider } from './deepseek-provider';
import { OpenRouterProvider } from './openrouter-provider';
import { RequestyProvider } from './requesty-provider';

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
