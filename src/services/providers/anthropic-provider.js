"use client";

import { BaseProvider } from './base-provider';

/**
 * Anthropic model provider
 */
export class AnthropicProvider extends BaseProvider {
  constructor(settings) {
    super(settings);
    this.name = 'anthropic';
    this.apiKey = settings.providers.anthropic.apiKey || '';
    this.baseUrl = 'https://api.anthropic.com';
  }

  /**
   * Check if Anthropic API is accessible
   * @returns {Promise<boolean>} True if API is accessible
   */
  async isAvailable() {
    if (!this.apiKey) return false;

    try {
      // Anthropic doesn't have a dedicated endpoint to check API status
      // We'll make a minimal request to the messages endpoint
      const response = await fetch(`${this.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'Hi' }]
        }),
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      // Even if we get a 400 error, the API is still accessible
      // A 401 would indicate an authentication issue
      return response.status !== 401;
    } catch (error) {
      console.error('Anthropic API check failed:', error);
      return false;
    }
  }

  /**
   * List available models from Anthropic
   * @returns {Promise<Array>} List of available models
   */
  async listModels() {
    // Anthropic doesn't have a models endpoint, so we'll return a hardcoded list
    return [
      { name: 'claude-3-opus-20240229', size: null, modified_at: Date.now(), provider: 'anthropic' },
      { name: 'claude-3-sonnet-20240229', size: null, modified_at: Date.now(), provider: 'anthropic' },
      { name: 'claude-3-haiku-20240307', size: null, modified_at: Date.now(), provider: 'anthropic' },
      { name: 'claude-2.1', size: null, modified_at: Date.now(), provider: 'anthropic' },
      { name: 'claude-2.0', size: null, modified_at: Date.now(), provider: 'anthropic' },
      { name: 'claude-instant-1.2', size: null, modified_at: Date.now(), provider: 'anthropic' }
    ];
  }

  /**
   * Generate a chat completion using Anthropic
   * @param {string} model - The model to use
   * @param {Array} messages - Array of message objects with role and content
   * @param {Object} options - Additional options for the model
   * @returns {Promise<Object>} The generated response
   */
  async generateCompletion(model, messages, options = {}) {
    if (!this.apiKey) throw new Error('Anthropic API key not set');

    try {
      const defaultOptions = {
        temperature: 0.7,
        max_tokens: 1024,
      };

      const requestBody = {
        model,
        messages,
        ...defaultOptions,
        ...options,
      };

      const response = await fetch(`${this.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate completion: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      return {
        message: {
          role: 'assistant',
          content: data.content[0].text
        }
      };
    } catch (error) {
      console.error('Error generating Anthropic completion:', error);
      throw error;
    }
  }

  /**
   * Generate a streaming chat completion using Anthropic
   * @param {string} model - The model to use
   * @param {Array} messages - Array of message objects with role and content
   * @param {Function} onChunk - Callback function for each chunk of the response
   * @param {Object} options - Additional options for the model
   * @returns {Promise<void>}
   */
  async generateStreamingCompletion(model, messages, onChunk, options = {}) {
    if (!this.apiKey) throw new Error('Anthropic API key not set');

    try {
      const defaultOptions = {
        temperature: 0.7,
        max_tokens: 1024,
      };

      const requestBody = {
        model,
        messages,
        ...defaultOptions,
        ...options,
        stream: true
      };

      const response = await fetch(`${this.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate streaming completion: ${response.status} ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let fullText = '';

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
            
            if (parsed.type === 'content_block_delta' && parsed.delta.type === 'text_delta') {
              const content = parsed.delta.text || '';
              
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
    } catch (error) {
      console.error('Error generating streaming Anthropic completion:', error);
      throw error;
    }
  }
}
