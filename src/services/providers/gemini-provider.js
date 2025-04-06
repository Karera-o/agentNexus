"use client";

import { BaseProvider } from './base-provider';

/**
 * Google Gemini model provider
 */
export class GeminiProvider extends BaseProvider {
  constructor(settings) {
    super(settings);
    this.name = 'gemini';
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1';
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

      return geminiModels.map(model => ({
        name: model.name.split('/').pop(),
        size: null,
        modified_at: Date.now(),
        provider: 'gemini'
      }));
    } catch (error) {
      console.error('Error fetching Gemini models:', error);
      return [
        { name: 'gemini-1.5-pro', size: null, modified_at: Date.now(), provider: 'gemini' },
        { name: 'gemini-1.5-flash', size: null, modified_at: Date.now(), provider: 'gemini' },
        { name: 'gemini-1.0-pro', size: null, modified_at: Date.now(), provider: 'gemini' }
      ];
    }
  }

  /**
   * Convert messages to Gemini format
   * @param {Array} messages - Array of message objects with role and content
   * @returns {Array} Messages in Gemini format
   */
  _convertToGeminiFormat(messages) {
    const geminiMessages = [];
    
    for (const message of messages) {
      if (message.role === 'system') {
        // Add system message as a user message at the beginning
        geminiMessages.push({
          role: 'user',
          parts: [{ text: message.content }]
        });
        
        // Add a placeholder assistant response
        geminiMessages.push({
          role: 'model',
          parts: [{ text: 'I understand. I will follow these instructions.' }]
        });
      } else if (message.role === 'user' || message.role === 'assistant') {
        geminiMessages.push({
          role: message.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: message.content }]
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
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
      };
      
      const geminiMessages = this._convertToGeminiFormat(messages);
      
      const requestBody = {
        contents: geminiMessages,
        generationConfig: {
          ...defaultOptions,
          ...options,
        },
      };

      const modelId = model.includes('/') ? model : `models/${model}`;
      const response = await fetch(`${this.baseUrl}/${modelId}:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
          content: data.candidates[0].content.parts[0].text
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
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
      };
      
      const geminiMessages = this._convertToGeminiFormat(messages);
      
      const requestBody = {
        contents: geminiMessages,
        generationConfig: {
          ...defaultOptions,
          ...options,
        },
      };

      const modelId = model.includes('/') ? model : `models/${model}`;
      const response = await fetch(`${this.baseUrl}/${modelId}:streamGenerateContent?key=${this.apiKey}`, {
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
        const lines = chunk.split('\n').filter(line => line.trim() && line.startsWith('data: '));

        for (const line of lines) {
          const data = line.substring(6); // Remove 'data: ' prefix
          
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.candidates && parsed.candidates[0]?.content?.parts?.length > 0) {
              const content = parsed.candidates[0].content.parts[0].text || '';
              
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
      console.error('Error generating streaming Gemini completion:', error);
      throw error;
    }
  }
}
