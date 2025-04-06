"use client";

import { BaseProvider } from './base-provider';

/**
 * Ollama model provider
 */
export class OllamaProvider extends BaseProvider {
  constructor(settings) {
    super(settings);
    this.name = 'ollama';
    this.baseUrl = settings.providers.ollama.apiUrl || 'http://localhost:11434/api';
  }

  /**
   * Check if Ollama server is running
   * @returns {Promise<boolean>} True if server is running
   */
  async isAvailable() {
    try {
      const response = await fetch(`${this.baseUrl}/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      return response.ok;
    } catch (error) {
      console.error('Ollama server check failed:', error);
      return false;
    }
  }

  /**
   * List available models from Ollama
   * @returns {Promise<Array>} List of available models
   */
  async listModels() {
    try {
      const response = await fetch(`${this.baseUrl}/tags`);

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.models || [];
    } catch (error) {
      console.error('Error fetching Ollama models:', error);
      return [];
    }
  }

  /**
   * Generate a chat completion using Ollama
   * @param {string} model - The model to use
   * @param {Array} messages - Array of message objects with role and content
   * @param {Object} options - Additional options for the model
   * @returns {Promise<Object>} The generated response
   */
  async generateCompletion(model, messages, options = {}) {
    try {
      const defaultOptions = {
        temperature: 0.7,
        top_p: 0.9,
        stream: false,
      };

      const requestBody = {
        model,
        messages,
        options: { ...defaultOptions, ...options },
      };

      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate completion: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating chat completion:', error);
      throw error;
    }
  }

  /**
   * Generate a streaming chat completion using Ollama
   * @param {string} model - The model to use
   * @param {Array} messages - Array of message objects with role and content
   * @param {Function} onChunk - Callback function for each chunk of the response
   * @param {Object} options - Additional options for the model
   * @returns {Promise<void>}
   */
  async generateStreamingCompletion(model, messages, onChunk, options = {}) {
    try {
      const defaultOptions = {
        temperature: 0.7,
        top_p: 0.9,
        stream: true,
      };

      const requestBody = {
        model,
        messages,
        options: { ...defaultOptions, ...options },
      };

      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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

        try {
          // Ollama returns each chunk as a JSON object
          const lines = chunk.split('\n').filter(line => line.trim());

          for (const line of lines) {
            const data = JSON.parse(line);

            if (data.message) {
              fullText += data.message.content || '';
              onChunk(data.message.content || '', fullText);
            }
          }
        } catch (e) {
          console.error('Error parsing streaming response:', e);
        }
      }
    } catch (error) {
      console.error('Error generating streaming chat completion:', error);
      throw error;
    }
  }
}
