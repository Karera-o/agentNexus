"use client";

import { BaseProvider } from './base-provider';

// Constants
const GEMINI_DEFAULT_TEMPERATURE = 0.7;
const GEMINI_DEFAULT_TOP_P = 0.95;
const GEMINI_DEFAULT_TOP_K = 40;
const GEMINI_DEFAULT_MAX_TOKENS = 8192;

/**
 * Google Gemini model provider
 */
export class GeminiProvider extends BaseProvider {
  constructor(settings) {
    super(settings);
    this.name = 'gemini';
    this.baseUrl = settings.providers.gemini.baseUrl || 'https://generativelanguage.googleapis.com/v1';
    this.apiKey = settings.providers.gemini.apiKey || '';
  }

  /**
   * Check if Gemini API is accessible
   * @returns {Promise<boolean>} True if API is accessible
   */
  async isAvailable() {
    if (!this.apiKey) return false;

    try {
      const response = await fetch(`${this.baseUrl}/models?key=${this.apiKey}`, {
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      return response.ok;
    } catch (error) {
      console.error('Gemini API check failed:', error);
      return false;
    }
  }

  /**
   * List available models from Gemini
   * @returns {Promise<Array>} List of available models
   */
  async listModels() {
    if (!this.apiKey) return [];

    try {
      const response = await fetch(`${this.baseUrl}/models?key=${this.apiKey}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Filter to only include Gemini models
      const geminiModels = data.models.filter(model =>
        model.name.includes('gemini')
      );

      return geminiModels.map(model => {
        // Extract model name from full path (e.g., "models/gemini-1.5-pro" -> "gemini-1.5-pro")
        const fullName = model.name;
        const nameParts = fullName.split('/');
        const shortName = nameParts[nameParts.length - 1];

        return {
          name: shortName,
          displayName: this._getDisplayName(shortName),
          size: null,
          modified_at: Date.now(),
          provider: 'gemini'
        };
      });
    } catch (error) {
      console.error('Error fetching Gemini models:', error);
      // Return default models from settings
      const defaultModels = this.settings?.providers?.gemini?.models || [];
      return defaultModels.map(model => ({
        name: model.id,
        displayName: model.name,
        description: model.description,
        size: null,
        modified_at: Date.now(),
        provider: 'gemini'
      }));
    }
  }

  /**
   * Get a display name for a model
   * @param {string} modelName - The model name
   * @returns {string} A user-friendly display name
   */
  _getDisplayName(modelName) {
    // Map of model names to display names
    const displayNames = {
      'gemini-2.5-pro-exp-03-25': 'Gemini 2.5 Pro (Experimental)',
      'gemini-2.0-flash-001': 'Gemini 2.0 Flash',
      'gemini-1.5-pro-latest': 'Gemini 1.5 Pro',
      'gemini-1.5-flash-latest': 'Gemini 1.5 Flash',
      'gemini-1.0-pro': 'Gemini 1.0 Pro'
    };

    return displayNames[modelName] || modelName;
  }

  /**
   * Extract system message from messages array
   * @param {Array} messages - Array of message objects with role and content
   * @returns {Object} Object containing system message and remaining messages
   */
  _extractSystemMessage(messages) {
    let systemMessage = '';
    const conversationMessages = [];

    for (const message of messages) {
      if (message.role === 'system') {
        systemMessage = message.content;
      } else {
        conversationMessages.push(message);
      }
    }

    return { systemMessage, conversationMessages };
  }

  /**
   * Convert messages to Gemini format
   * @param {Array} messages - Array of message objects with role and content
   * @returns {Array} Messages in Gemini format
   */
  _convertToGeminiFormat(messages) {
    const geminiMessages = [];

    for (const message of messages) {
      if (message.role === 'user' || message.role === 'assistant') {
        // Handle content that might be an array of parts (for multimodal content)
        let parts = [];

        if (typeof message.content === 'string') {
          parts = [{ text: message.content }];
        } else if (Array.isArray(message.content)) {
          parts = message.content.map(part => {
            if (typeof part === 'string') {
              return { text: part };
            } else if (part.type === 'text') {
              return { text: part.text };
            } else if (part.type === 'image_url') {
              // Handle image URLs
              return {
                inline_data: {
                  mime_type: 'image/jpeg', // Assume JPEG by default
                  data: part.image_url.url.replace(/^data:image\/(jpeg|png|gif);base64,/, '')
                }
              };
            }
            return { text: JSON.stringify(part) };
          });
        }

        geminiMessages.push({
          role: message.role === 'assistant' ? 'model' : 'user',
          parts: parts
        });
      }
    }

    return geminiMessages;
  }

  /**
   * Generate a chat completion using Gemini
   * @param {string} model - The model to use
   * @param {Array} messages - Array of message objects with role and content
   * @param {Object} options - Additional options for the model
   * @returns {Promise<Object>} The generated response
   */
  async generateCompletion(model, messages, options = {}) {
    if (!this.apiKey) throw new Error('Gemini API key not set');

    try {
      const defaultOptions = {
        temperature: GEMINI_DEFAULT_TEMPERATURE,
        topP: GEMINI_DEFAULT_TOP_P,
        topK: GEMINI_DEFAULT_TOP_K,
        maxOutputTokens: options.max_tokens || GEMINI_DEFAULT_MAX_TOKENS,
      };

      // Extract system message to use as system instruction
      const { systemMessage, conversationMessages } = this._extractSystemMessage(messages);
      const geminiMessages = this._convertToGeminiFormat(conversationMessages);

      const requestBody = {
        contents: geminiMessages,
        generationConfig: {
          ...defaultOptions,
          ...options,
        },
      };

      // Add system instruction if present
      if (systemMessage) {
        // For older models that don't support systemInstruction
        // Add it as a user message at the beginning
        if (model.includes('gemini-1.0')) {
          // Prepend system message as a user message
          requestBody.contents.unshift({
            role: 'user',
            parts: [{ text: systemMessage }]
          });

          // Add a placeholder model response
          requestBody.contents.unshift({
            role: 'model',
            parts: [{ text: 'I understand. I will follow these instructions.' }]
          });
        } else {
          // For newer models that support systemInstruction
          requestBody.systemInstruction = { parts: [{ text: systemMessage }] };
        }
      }

      // Ensure model ID is properly formatted
      let modelId;
      if (model.includes('/')) {
        modelId = model;
      } else if (model.startsWith('models/')) {
        modelId = model;
      } else {
        modelId = `models/${model}`;
      }
      const response = await fetch(`${this.baseUrl}/${modelId}:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Gemini API Error (${response.status}): ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();

      // Check for error in response
      if (data.error) {
        throw new Error(`Gemini API Error: ${data.error.message || 'Unknown error'}`);
      }

      // Handle potential response formats
      let content = '';
      if (data.candidates && data.candidates.length > 0) {
        const candidate = data.candidates[0];

        // Check for finish reason - handle blocked content
        if (candidate.finishReason === 'SAFETY' || candidate.finishReason === 'BLOCKED') {
          throw new Error(`Gemini response blocked: ${candidate.finishReason}`);
        }

        // Extract content from parts
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
          content = candidate.content.parts.map(part => part.text || '').join('');
        }
      } else if (data.promptFeedback && data.promptFeedback.blockReason) {
        // Handle blocked prompts
        throw new Error(`Gemini prompt blocked: ${data.promptFeedback.blockReason}`);
      }

      // Convert to Ollama-like format for consistency
      return {
        message: {
          role: 'assistant',
          content: content
        },
        usage: {
          prompt_tokens: data.usageMetadata?.promptTokenCount || 0,
          completion_tokens: data.usageMetadata?.candidatesTokenCount || 0,
          total_tokens: (data.usageMetadata?.promptTokenCount || 0) + (data.usageMetadata?.candidatesTokenCount || 0)
        }
      };
    } catch (error) {
      console.error('Error generating Gemini completion:', error);
      throw error;
    }
  }

  /**
   * Generate a streaming chat completion using Gemini
   * @param {string} model - The model to use
   * @param {Array} messages - Array of message objects with role and content
   * @param {Function} onChunk - Callback function for each chunk of the response
   * @param {Object} options - Additional options for the model
   * @returns {Promise<void>}
   */
  async generateStreamingCompletion(model, messages, onChunk, options = {}) {
    if (!this.apiKey) throw new Error('Gemini API key not set');

    try {
      const defaultOptions = {
        temperature: GEMINI_DEFAULT_TEMPERATURE,
        topP: GEMINI_DEFAULT_TOP_P,
        topK: GEMINI_DEFAULT_TOP_K,
        maxOutputTokens: options.max_tokens || GEMINI_DEFAULT_MAX_TOKENS,
      };

      // Extract system message to use as system instruction
      const { systemMessage, conversationMessages } = this._extractSystemMessage(messages);
      const geminiMessages = this._convertToGeminiFormat(conversationMessages);

      const requestBody = {
        contents: geminiMessages,
        generationConfig: {
          ...defaultOptions,
          ...options,
        },
      };

      // Add system instruction if present
      if (systemMessage) {
        // For older models that don't support systemInstruction
        // Add it as a user message at the beginning
        if (model.includes('gemini-1.0')) {
          // Prepend system message as a user message
          requestBody.contents.unshift({
            role: 'user',
            parts: [{ text: systemMessage }]
          });

          // Add a placeholder model response
          requestBody.contents.unshift({
            role: 'model',
            parts: [{ text: 'I understand. I will follow these instructions.' }]
          });
        } else {
          // For newer models that support systemInstruction
          requestBody.systemInstruction = { parts: [{ text: systemMessage }] };
        }
      }

      // Ensure model ID is properly formatted
      let modelId;
      if (model.includes('/')) {
        modelId = model;
      } else if (model.startsWith('models/')) {
        modelId = model;
      } else {
        modelId = `models/${model}`;
      }
      const response = await fetch(`${this.baseUrl}/${modelId}:streamGenerateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error details');
        throw new Error(`Gemini API Error (${response.status}): ${errorText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let fullText = '';
      let totalPromptTokens = 0;
      let totalCompletionTokens = 0;

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

            // Handle usage metadata if available
            if (parsed.usageMetadata) {
              totalPromptTokens = parsed.usageMetadata.promptTokenCount || 0;
              totalCompletionTokens = parsed.usageMetadata.candidatesTokenCount || 0;
            }

            // Check for safety issues
            if (parsed.promptFeedback && parsed.promptFeedback.blockReason) {
              throw new Error(`Gemini prompt blocked: ${parsed.promptFeedback.blockReason}`);
            }

            // Check for finish reason
            if (parsed.candidates && parsed.candidates[0]?.finishReason === 'SAFETY') {
              throw new Error('Gemini response blocked for safety reasons');
            }

            // Handle content chunks
            if (parsed.candidates && parsed.candidates[0]?.content?.parts?.length > 0) {
              const parts = parsed.candidates[0].content.parts;
              const content = parts.map(part => part.text || '').join('');

              if (content) {
                fullText += content;
                onChunk(content, fullText);
              }
            }
          } catch (e) {
            console.error('Error parsing streaming response:', e);
          }
        }
      }

      // Send final usage information
      onChunk('', fullText, {
        prompt_tokens: totalPromptTokens,
        completion_tokens: totalCompletionTokens,
        total_tokens: totalPromptTokens + totalCompletionTokens
      });
    } catch (error) {
      console.error('Error generating streaming Gemini completion:', error);
      throw error;
    }
  }

  /**
   * Get model information
   * @param {string} modelId - The model ID
   * @returns {Object} Model information
   */
  getModelInfo(modelId) {
    // Map of model IDs to their context window sizes
    const contextWindows = {
      'gemini-2.5-pro-exp-03-25': 1048576, // 1M tokens
      'gemini-2.0-flash-001': 1048576,     // 1M tokens
      'gemini-1.5-pro-latest': 2097152,    // 2M tokens
      'gemini-1.5-flash-latest': 1048576,  // 1M tokens
      'gemini-1.0-pro': 32768,             // 32K tokens
    };

    return {
      id: modelId,
      contextWindow: contextWindows[modelId] || 32768,
      provider: 'gemini'
    };
  }
}
