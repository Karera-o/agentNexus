"use client";

import { BaseProvider } from './base-provider';

/**
 * DeepSeek model provider
 */
export class DeepSeekProvider extends BaseProvider {
  constructor(settings) {
    super(settings);
    this.name = 'deepseek';
    this.apiKey = settings.providers.deepseek.apiKey || '';
    this.baseUrl = settings.providers.deepseek.baseUrl || 'https://api.deepseek.com';
  }

  /**
   * Check if DeepSeek API is accessible
   * @returns {Promise<boolean>} True if API is accessible
   */
  async isAvailable() {
    if (!this.apiKey) return false;

    try {
      // DeepSeek API is compatible with OpenAI, so we can use the models endpoint
      const response = await fetch(`${this.baseUrl}/v1/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      return response.ok;
    } catch (error) {
      console.error('DeepSeek API check failed:', error);
      return false;
    }
  }

  /**
   * List available models from DeepSeek
   * @returns {Promise<Array>} List of available models
   */
  async listModels() {
    if (!this.apiKey) return [];

    try {
      const response = await fetch(`${this.baseUrl}/v1/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      return data.data.map(model => ({
        name: model.id,
        size: null,
        modified_at: Date.now(),
        provider: 'deepseek'
      }));
    } catch (error) {
      console.error('Error fetching DeepSeek models:', error);
      // Return default models if API call fails
      return [
        { name: 'deepseek-chat', size: null, modified_at: Date.now(), provider: 'deepseek' },
        { name: 'deepseek-coder', size: null, modified_at: Date.now(), provider: 'deepseek' }
      ];
    }
  }

  /**
   * Generate a chat completion using DeepSeek
   * @param {string} model - The model to use
   * @param {Array} messages - Array of message objects with role and content
   * @param {Object} options - Additional options for the model
   * @returns {Promise<Object>} The generated response
   */
  async generateCompletion(model, messages, options = {}) {
    if (!this.apiKey) throw new Error('DeepSeek API key not set');

    try {
      const defaultOptions = {
        temperature: 0.7,
        top_p: 0.9,
      };

      const requestBody = {
        model,
        messages,
        ...defaultOptions,
        ...options,
        stream: false
      };

      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate completion: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Convert to Ollama-like format for consistency
      return {
        message: {
          role: 'assistant',
          content: data.choices[0].message.content
        }
      };
    } catch (error) {
      console.error('Error generating DeepSeek completion:', error);
      throw error;
    }
  }

  /**
   * Generate a streaming chat completion using DeepSeek
   * @param {string} model - The model to use
   * @param {Array} messages - Array of message objects with role and content
   * @param {Function} onChunk - Callback function for each chunk of the response
   * @param {Object} options - Additional options for the model
   * @returns {Promise<void>}
   */
  async generateStreamingCompletion(model, messages, onChunk, options = {}) {
    if (!this.apiKey) throw new Error('DeepSeek API key not set');

    try {
      const defaultOptions = {
        temperature: 0.7,
        top_p: 0.9,
      };

      const requestBody = {
        model,
        messages,
        ...defaultOptions,
        ...options,
        stream: true
      };

      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
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
            const content = parsed.choices[0]?.delta?.content || '';
            
            if (content) {
              fullText += content;
              onChunk(content, fullText);
            }
          } catch (e) {
            console.error('Error parsing streaming response:', e);
          }
        }
      }
    } catch (error) {
      console.error('Error generating streaming DeepSeek completion:', error);
      throw error;
    }
  }
}
