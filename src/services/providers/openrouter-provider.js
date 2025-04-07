"use client";

import { BaseProvider } from './base-provider';

// Constants
const OPENROUTER_DEFAULT_PROVIDER_NAME = "[default]";
const OPENROUTER_DEFAULT_TRANSFORMS = ["middle-out"];

/**
 * OpenRouter model provider with enhanced features
 */
export class OpenRouterProvider extends BaseProvider {
  constructor(settings) {
    super(settings);
    this.name = 'openrouter';

    // Get API key from settings, environment variables, or localStorage
    this.apiKey = settings.providers.openrouter.apiKey || '';

    // Check if we have an API key in process.env
    if (process.env.NEXT_PUBLIC_OPENROUTER_API_KEY && !this.apiKey) {
      console.log('OpenRouter: Using API key from environment variables');
      this.apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
    }

    this.baseUrl = settings.providers.openrouter.baseUrl || 'https://openrouter.ai/api/v1';
    this.specificProvider = settings.providers.openrouter.specificProvider || OPENROUTER_DEFAULT_PROVIDER_NAME;
    this.useMiddleOutTransform = settings.providers.openrouter.useMiddleOutTransform !== false; // Default to true

    // Debug log for API key
    console.log(`OpenRouter: Initialized with API key: ${this.apiKey ? 'Present (length: ' + this.apiKey.length + ')' : 'Not set'}`);
    console.log(`OpenRouter: Base URL: ${this.baseUrl}`);
  }

  /**
   * Get required headers for OpenRouter API
   * @returns {Object} Headers object
   */
  getHeaders() {
    // Double-check if we have an API key in process.env
    if (!this.apiKey && process.env.NEXT_PUBLIC_OPENROUTER_API_KEY) {
      console.log('OpenRouter: Using API key from environment variables in getHeaders');
      this.apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
      'X-Title': 'Dev Agent App'
    };
  }

  /**
   * Check if OpenRouter API is accessible
   * @returns {Promise<boolean>} True if API is accessible
   */
  async isAvailable() {
    console.log('OpenRouter: Checking if API is available');
    if (!this.apiKey) {
      console.log('OpenRouter: No API key provided');
      return false;
    }

    try {
      console.log(`OpenRouter: Testing connection to ${this.baseUrl}/auth/key`);
      const response = await fetch(`${this.baseUrl}/auth/key`, {
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      if (response.ok) {
        console.log('OpenRouter: API is accessible');
        return true;
      } else {
        const errorText = await response.text().catch(() => 'No error details');
        console.error(`OpenRouter API Error (${response.status}): ${errorText}`);
        return false;
      }
    } catch (error) {
      console.error('OpenRouter API check failed:', error);
      return false;
    }
  }

  // Track the last time we fetched models to prevent too many requests
  lastModelFetchTime = 0;
  modelFetchInProgress = false;
  cachedModels = null;

  /**
   * List available models from OpenRouter
   * @returns {Promise<Array>} List of available models
   */
  async listModels() {
    console.log('OpenRouter: Attempting to list models');
    console.log(`OpenRouter: API Key: ${this.apiKey ? 'Present (length: ' + this.apiKey.length + ')' : 'Not set'}`);

    // Double-check if we have an API key in process.env
    if (!this.apiKey && process.env.NEXT_PUBLIC_OPENROUTER_API_KEY) {
      console.log('OpenRouter: Using API key from environment variables');
      this.apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
    }

    if (!this.apiKey) {
      console.log('OpenRouter: No API key provided, returning empty list');
      return [];
    }

    // Check if we have cached models and it's been less than 5 minutes since the last fetch
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    if (this.cachedModels && now - this.lastModelFetchTime < fiveMinutes) {
      console.log('OpenRouter: Using cached models (less than 5 minutes old)');
      return this.cachedModels;
    }

    // Check if a fetch is already in progress
    if (this.modelFetchInProgress) {
      console.log('OpenRouter: Model fetch already in progress, waiting...');
      // Wait for the current fetch to complete (up to 10 seconds)
      let waitTime = 0;
      while (this.modelFetchInProgress && waitTime < 10000) {
        await new Promise(resolve => setTimeout(resolve, 100));
        waitTime += 100;
      }

      // If we have cached models after waiting, return them
      if (this.cachedModels) {
        console.log('OpenRouter: Using cached models after waiting for fetch to complete');
        return this.cachedModels;
      }

      // If we still don't have models, continue with a new fetch
    }

    // Mark that a fetch is in progress
    this.modelFetchInProgress = true;

    try {
      // Log the headers we're sending (without the actual API key)
      const headers = this.getHeaders();
      console.log('OpenRouter: Request headers:', {
        ...headers,
        'Authorization': headers.Authorization ? 'Bearer [REDACTED]' : 'Not set'
      });

      console.log(`OpenRouter: Fetching models from ${this.baseUrl}/models`);

      // Create an abort controller for the timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: headers,
        signal: controller.signal
      });

      // Clear the timeout
      clearTimeout(timeoutId);

      console.log(`OpenRouter: Response status: ${response.status}`);

      if (!response.ok) {
        let errorText;
        try {
          const errorData = await response.json();
          errorText = JSON.stringify(errorData);
        } catch (e) {
          errorText = await response.text().catch(() => 'No error details');
        }
        console.error(`OpenRouter API Error (${response.status}): ${errorText}`);
        throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`OpenRouter: Response data:`, data);
      console.log(`OpenRouter: Successfully fetched ${data.data?.length || 0} models`);

      // Map the models to our format
      const mappedModels = data.data.map(model => {
        // Check if the model is free
        const isFree = model.id.includes('free') ||
                      (model.pricing && model.pricing.prompt === 0 && model.pricing.completion === 0);

        return {
          name: model.id,
          displayName: this.getDisplayName(model.id),
          size: null,
          modified_at: Date.now(),
          provider: 'openrouter',
          context_length: model.context_length,
          pricing: model.pricing,
          description: model.description,
          supports_images: model.architecture?.modality?.includes("image") || false,
          supports_vision: model.architecture?.modality?.includes("image") || false,
          supports_functions: model.architecture?.features?.includes("tools") || false,
          top_provider: model.top_provider,
          is_free: isFree
        };
      });

      // Cache the models and update the last fetch time
      this.cachedModels = mappedModels;
      this.lastModelFetchTime = Date.now();

      console.log('OpenRouter: Mapped models:', mappedModels.map(m => m.name).join(', '));
      return mappedModels;
    } catch (error) {
      console.error('Error fetching OpenRouter models:', error);
      return this.cachedModels || [];
    } finally {
      // Mark that the fetch is no longer in progress
      this.modelFetchInProgress = false;
    }
  }



  /**
   * Get a user-friendly display name from a model ID
   * @param {string} modelId - The model ID
   * @returns {string} A user-friendly display name
   */
  getDisplayName(modelId) {
    const parts = modelId.split('/');
    if (parts.length < 2) return modelId;

    const provider = parts[0];
    const model = parts[1];

    // Format the provider name
    let providerDisplay = '';

    // Special case for meta-llama to show as Meta
    if (provider === 'meta-llama') {
      providerDisplay = 'Meta';
    } else if (provider === 'anthropic') {
      providerDisplay = 'Anthropic';
    } else if (provider === 'openai') {
      providerDisplay = 'OpenAI';
    } else if (provider === 'google') {
      providerDisplay = 'Google';
    } else if (provider === 'mistralai') {
      providerDisplay = 'Mistral';
    } else if (provider === 'deepseek') {
      providerDisplay = 'DeepSeek';
    } else {
      // Capitalize the provider name
      providerDisplay = provider.charAt(0).toUpperCase() + provider.slice(1);
    }

    // Format the model name
    let modelDisplay = model;

    // Special formatting for common models
    if (model.includes('llama')) {
      // For Llama models, show version and size
      if (model.includes('llama-3')) {
        modelDisplay = `Llama 3${model.includes('70b') ? ' 70B' : model.includes('8b') ? ' 8B' : ''}`;
        // Add 'free' tag if it's a free model
        if (model.includes('free')) {
          modelDisplay += ' (Free)';
        }
      } else if (model.includes('llama-2')) {
        modelDisplay = `Llama 2${model.includes('70b') ? ' 70B' : model.includes('13b') ? ' 13B' : ' 7B'}`;
      }
    } else if (model.includes('claude')) {
      // For Claude models
      if (model.includes('opus')) {
        modelDisplay = 'Claude Opus';
      } else if (model.includes('sonnet')) {
        modelDisplay = 'Claude Sonnet';
      } else if (model.includes('haiku')) {
        modelDisplay = 'Claude Haiku';
      } else {
        modelDisplay = 'Claude ' + model.split('-').pop();
      }
    } else if (model.includes('gpt-4')) {
      // For GPT-4 models
      if (model.includes('turbo')) {
        modelDisplay = 'GPT-4 Turbo';
      } else if (model.includes('vision')) {
        modelDisplay = 'GPT-4 Vision';
      } else {
        modelDisplay = 'GPT-4';
      }
    } else if (model.includes('gpt-3.5')) {
      modelDisplay = 'GPT-3.5 Turbo';
    } else if (model.includes('gemini')) {
      if (model.includes('pro')) {
        modelDisplay = 'Gemini Pro';
      } else if (model.includes('flash')) {
        modelDisplay = 'Gemini Flash';
      } else {
        modelDisplay = 'Gemini';
      }
    } else if (model.includes('mistral')) {
      if (model.includes('large')) {
        modelDisplay = 'Mistral Large';
      } else if (model.includes('medium')) {
        modelDisplay = 'Mistral Medium';
      } else if (model.includes('small')) {
        modelDisplay = 'Mistral Small';
      } else {
        modelDisplay = 'Mistral';
      }
    } else {
      // For other models, capitalize and clean up the name
      modelDisplay = model.split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
    }

    return `${providerDisplay} ${modelDisplay}`;
  }

  /**
   * Prepare messages for specific model requirements
   * @param {string} model - The model ID
   * @param {Array} messages - The messages to prepare
   * @returns {Array} Prepared messages
   */
  prepareMessages(model, messages) {
    // Handle special cases for certain models
    if (model.startsWith('anthropic/claude')) {
      // Add cache_control for Claude models to improve performance
      return this.addCacheControlToMessages(messages);
    }

    // Default case - return messages as is
    return messages;
  }

  /**
   * Add cache_control to messages for Claude models
   * @param {Array} messages - The messages to modify
   * @returns {Array} Modified messages with cache_control
   */
  addCacheControlToMessages(messages) {
    return messages.map(msg => {
      // Only modify system and user messages
      if (msg.role !== 'system' && msg.role !== 'user') return msg;

      // Create a deep copy of the message
      const newMsg = { ...msg };

      // If content is a string, convert to an array with a text object
      if (typeof newMsg.content === 'string') {
        newMsg.content = [
          {
            type: 'text',
            text: newMsg.content,
            cache_control: { type: 'ephemeral' }
          }
        ];
      } else if (Array.isArray(newMsg.content)) {
        // If content is already an array, add cache_control to text parts
        newMsg.content = newMsg.content.map(part => {
          if (part.type === 'text') {
            return {
              ...part,
              cache_control: { type: 'ephemeral' }
            };
          }
          return part;
        });
      }

      return newMsg;
    });
  }

  /**
   * Generate a chat completion using OpenRouter
   * @param {string} model - The model to use
   * @param {Array} messages - Array of message objects with role and content
   * @param {Object} options - Additional options for the model
   * @returns {Promise<Object>} The generated response
   */
  async generateCompletion(model, messages, options = {}) {
    if (!this.apiKey) throw new Error('OpenRouter API key not set');

    try {
      const defaultOptions = {
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 1024,
      };

      // Prepare messages for the specific model
      const preparedMessages = this.prepareMessages(model, messages);

      // Build request body with enhanced options
      const requestBody = {
        model,
        messages: preparedMessages,
        ...defaultOptions,
        ...options,
        stream: false,
        // Add provider selection if a specific provider is set
        ...(this.specificProvider !== OPENROUTER_DEFAULT_PROVIDER_NAME && {
          provider: { order: [this.specificProvider] }
        }),
        // Add transforms if enabled
        ...(this.useMiddleOutTransform && { transforms: OPENROUTER_DEFAULT_TRANSFORMS })
      };

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenRouter API Error (${response.status}): ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();

      // Check for error in response
      if ('error' in data) {
        throw new Error(`OpenRouter API Error: ${data.error.message || 'Unknown error'}`);
      }

      return {
        message: {
          role: 'assistant',
          content: data.choices[0].message.content
        },
        usage: data.usage,
        model: data.model,
        id: data.id
      };
    } catch (error) {
      console.error('Error generating OpenRouter completion:', error);
      throw error;
    }
  }

  /**
   * Generate a streaming chat completion using OpenRouter
   * @param {string} model - The model to use
   * @param {Array} messages - Array of message objects with role and content
   * @param {Function} onChunk - Callback function for each chunk of the response
   * @param {Object} options - Additional options for the model
   * @returns {Promise<void>}
   */
  async generateStreamingCompletion(model, messages, onChunk, options = {}) {
    if (!this.apiKey) throw new Error('OpenRouter API key not set');

    try {
      const defaultOptions = {
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 1024,
      };

      // Prepare messages for the specific model
      const preparedMessages = this.prepareMessages(model, messages);

      // Build request body with enhanced options
      const requestBody = {
        model,
        messages: preparedMessages,
        ...defaultOptions,
        ...options,
        stream: true,
        stream_options: { include_usage: true },
        // Add provider selection if a specific provider is set
        ...(this.specificProvider !== OPENROUTER_DEFAULT_PROVIDER_NAME && {
          provider: { order: [this.specificProvider] }
        }),
        // Add transforms if enabled
        ...(this.useMiddleOutTransform && { transforms: OPENROUTER_DEFAULT_TRANSFORMS })
      };

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenRouter API Error (${response.status}): ${errorData.error?.message || response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let fullText = '';
      let lastUsage = null;

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() && line.startsWith('data: '));

        for (const line of lines) {
          const data = line.substring(6); // Remove 'data: ' prefix

          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);

            // Check for error in response
            if ('error' in parsed) {
              throw new Error(`OpenRouter API Error: ${parsed.error.message || 'Unknown error'}`);
            }

            // Handle content delta
            const delta = parsed.choices[0]?.delta;
            const content = delta?.content || '';

            if (content) {
              fullText += content;
              onChunk(content, fullText);
            }

            // Handle reasoning if available
            if ('reasoning' in delta && delta.reasoning) {
              onChunk(`\n[Reasoning: ${delta.reasoning}]\n`, fullText);
            }

            // Store usage information
            if (parsed.usage) {
              lastUsage = parsed.usage;
            }
          } catch (e) {
            console.error('Error parsing streaming response:', e);
          }
        }
      }

      // Return usage information if available
      if (lastUsage) {
        console.log('Usage metrics:', {
          inputTokens: lastUsage.prompt_tokens || 0,
          outputTokens: lastUsage.completion_tokens || 0,
          totalCost: lastUsage.cost || 0,
        });
      }
    } catch (error) {
      console.error('Error generating streaming OpenRouter completion:', error);
      throw error;
    }
  }
}
