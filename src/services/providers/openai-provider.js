"use client";

import { BaseProvider } from './base-provider';

/**
 * OpenAI model provider
 */
export class OpenAIProvider extends BaseProvider {
  constructor(settings) {
    super(settings);
    this.name = 'openai';
    this.apiKey = settings.providers.openai.apiKey || '';
    this.baseUrl = 'https://api.openai.com/v1';
  }

  /**
   * Check if OpenAI API is accessible
   * @returns {Promise<boolean>} True if API is accessible
   */
  async isAvailable() {
    if (!this.apiKey) return false;

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      return response.ok;
    } catch (error) {
      console.error('OpenAI API check failed:', error);
      return false;
    }
  }

  /**
   * List available models from OpenAI
   * @returns {Promise<Array>} List of available models
   */
  async listModels() {
    if (!this.apiKey) return [];

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Filter to only include chat models
      const chatModels = data.data.filter(model => 
        model.id.includes('gpt')
      );

      return chatModels.map(model => ({
        name: model.id,
        size: null,
        modified_at: Date.now(),
        provider: 'openai'
      }));
    } catch (error) {
      console.error('Error fetching OpenAI models:', error);
      return [
        { name: 'gpt-3.5-turbo', size: null, modified_at: Date.now(), provider: 'openai' },
        { name: 'gpt-4', size: null, modified_at: Date.now(), provider: 'openai' },
        { name: 'gpt-4-turbo', size: null, modified_at: Date.now(), provider: 'openai' }
      ];
    }
  }

  /**
   * Generate a chat completion using OpenAI
   * @param {string} model - The model to use
   * @param {Array} messages - Array of message objects with role and content
   * @param {Object} options - Additional options for the model
   * @returns {Promise<Object>} The generated response
   */
  async generateCompletion(model, messages, options = {}) {
    if (!this.apiKey) throw new Error('OpenAI API key not set');

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

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
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

      return {
        message: {
          role: 'assistant',
          content: data.choices[0].message.content
        }
      };
    } catch (error) {
      console.error('Error generating OpenAI completion:', error);
      throw error;
    }
  }

  /**
   * Generate a streaming chat completion using OpenAI
   * @param {string} model - The model to use
   * @param {Array} messages - Array of message objects with role and content
   * @param {Function} onChunk - Callback function for each chunk of the response
   * @param {Object} options - Additional options for the model
   * @returns {Promise<void>}
   */
  async generateStreamingCompletion(model, messages, onChunk, options = {}) {
    if (!this.apiKey) throw new Error('OpenAI API key not set');

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

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
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
      console.error('Error generating streaming OpenAI completion:', error);
      throw error;
    }
  }
}
