"use client";

import { generateChatCompletion, generateStreamingChatCompletion, isOllamaServerRunning } from './ollamaService';

/**
 * Base class for model providers
 */
class ModelProvider {
  constructor(settings) {
    this.settings = settings;
    this.name = 'base';
    this.baseUrl = '';
  }

  async isAvailable() {
    return false;
  }

  async listModels() {
    return [];
  }

  async generateCompletion(model, messages, options = {}) {
    throw new Error('Not implemented');
  }

  async generateStreamingCompletion(model, messages, onChunk, options = {}) {
    throw new Error('Not implemented');
  }
}

/**
 * Ollama model provider
 */
class OllamaProvider extends ModelProvider {
  constructor(settings) {
    super(settings);
    this.name = 'ollama';
    this.baseUrl = settings.providers.ollama.apiUrl || 'http://localhost:11434/api';
  }

  async isAvailable() {
    return await isOllamaServerRunning(this.baseUrl);
  }

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

  async generateCompletion(model, messages, options = {}) {
    return await generateChatCompletion(model, messages, options, this.baseUrl);
  }

  async generateStreamingCompletion(model, messages, onChunk, options = {}) {
    return await generateStreamingChatCompletion(model, messages, onChunk, options, this.baseUrl);
  }
}

/**
 * OpenAI model provider
 */
class OpenAIProvider extends ModelProvider {
  constructor(settings) {
    super(settings);
    this.name = 'openai';
    this.baseUrl = 'https://api.openai.com/v1';
    this.apiKey = settings.providers.openai.apiKey || '';
  }

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
        model.id.includes('gpt') && !model.id.includes('instruct')
      );

      return chatModels.map(model => ({
        name: model.id,
        size: null,
        modified_at: model.created * 1000, // Convert to milliseconds
        provider: 'openai'
      }));
    } catch (error) {
      console.error('Error fetching OpenAI models:', error);
      return [];
    }
  }

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

      // Convert to Ollama-like format for consistency
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

        try {
          // OpenAI returns each chunk as a data: JSON object
          const lines = chunk.split('\\n').filter(line => line.trim().startsWith('data:'));

          for (const line of lines) {
            const jsonStr = line.replace('data: ', '').trim();

            // Skip the [DONE] message
            if (jsonStr === '[DONE]') continue;

            const data = JSON.parse(jsonStr);

            if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
              const content = data.choices[0].delta.content;
              fullText += content;
              onChunk(content, fullText);
            }
          }
        } catch (e) {
          console.error('Error parsing streaming response:', e);
        }
      }
    } catch (error) {
      console.error('Error generating streaming OpenAI completion:', error);
      throw error;
    }
  }
}

/**
 * Anthropic model provider
 */
class AnthropicProvider extends ModelProvider {
  constructor(settings) {
    super(settings);
    this.name = 'anthropic';
    this.baseUrl = 'https://api.anthropic.com/v1';
    this.apiKey = settings.providers.anthropic.apiKey || '';
  }

  async isAvailable() {
    if (!this.apiKey) return false;

    try {
      // Anthropic doesn't have a models endpoint, so we'll just check if the API key is valid
      const response = await fetch(`${this.baseUrl}/messages`, {
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

      return response.ok || response.status === 400; // 400 means the request was invalid but the API key was accepted
    } catch (error) {
      console.error('Anthropic API check failed:', error);
      return false;
    }
  }

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

  async generateCompletion(model, messages, options = {}) {
    if (!this.apiKey) throw new Error('Anthropic API key not set');

    try {
      const defaultOptions = {
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 4096
      };

      // Convert from OpenAI format to Anthropic format
      const anthropicMessages = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      }));

      // Extract system message if present
      let systemPrompt = '';
      const systemMessage = messages.find(msg => msg.role === 'system');
      if (systemMessage) {
        systemPrompt = systemMessage.content;
      }

      const requestBody = {
        model,
        messages: anthropicMessages.filter(msg => msg.role !== 'system'),
        system: systemPrompt,
        ...defaultOptions,
        ...options,
      };

      const response = await fetch(`${this.baseUrl}/messages`, {
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

      // Convert to Ollama-like format for consistency
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

  async generateStreamingCompletion(model, messages, onChunk, options = {}) {
    if (!this.apiKey) throw new Error('Anthropic API key not set');

    try {
      const defaultOptions = {
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 4096
      };

      // Convert from OpenAI format to Anthropic format
      const anthropicMessages = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      }));

      // Extract system message if present
      let systemPrompt = '';
      const systemMessage = messages.find(msg => msg.role === 'system');
      if (systemMessage) {
        systemPrompt = systemMessage.content;
      }

      const requestBody = {
        model,
        messages: anthropicMessages.filter(msg => msg.role !== 'system'),
        system: systemPrompt,
        ...defaultOptions,
        ...options,
        stream: true
      };

      const response = await fetch(`${this.baseUrl}/messages`, {
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

        try {
          // Anthropic returns each chunk as a data: JSON object
          const lines = chunk.split('\\n').filter(line => line.trim().startsWith('data:'));

          for (const line of lines) {
            const jsonStr = line.replace('data: ', '').trim();

            if (jsonStr === '[DONE]') continue;

            const data = JSON.parse(jsonStr);

            if (data.type === 'content_block_delta' && data.delta && data.delta.text) {
              const content = data.delta.text;
              fullText += content;
              onChunk(content, fullText);
            }
          }
        } catch (e) {
          console.error('Error parsing streaming response:', e);
        }
      }
    } catch (error) {
      console.error('Error generating streaming Anthropic completion:', error);
      throw error;
    }
  }
}

/**
 * Google Gemini model provider
 */
class GeminiProvider extends ModelProvider {
  constructor(settings) {
    super(settings);
    this.name = 'gemini';
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1';
    this.apiKey = settings.providers.gemini.apiKey || '';
  }

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
      return [];
    }
  }

  async generateCompletion(model, messages, options = {}) {
    if (!this.apiKey) throw new Error('Gemini API key not set');

    try {
      const defaultOptions = {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
      };

      // Convert from OpenAI format to Gemini format
      const contents = [];
      let systemPrompt = '';

      // Extract system message if present
      const systemMessage = messages.find(msg => msg.role === 'system');
      if (systemMessage) {
        systemPrompt = systemMessage.content;
      }

      // Add other messages
      for (const msg of messages) {
        if (msg.role === 'system') continue;

        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        });
      }

      const requestBody = {
        contents,
        generationConfig: {
          ...defaultOptions,
          ...options,
        }
      };

      // Add system prompt if present
      if (systemPrompt) {
        requestBody.systemInstruction = {
          parts: [{ text: systemPrompt }]
        };
      }

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

  async generateStreamingCompletion(model, messages, onChunk, options = {}) {
    if (!this.apiKey) throw new Error('Gemini API key not set');

    try {
      const defaultOptions = {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
      };

      // Convert from OpenAI format to Gemini format
      const contents = [];
      let systemPrompt = '';

      // Extract system message if present
      const systemMessage = messages.find(msg => msg.role === 'system');
      if (systemMessage) {
        systemPrompt = systemMessage.content;
      }

      // Add other messages
      for (const msg of messages) {
        if (msg.role === 'system') continue;

        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        });
      }

      const requestBody = {
        contents,
        generationConfig: {
          ...defaultOptions,
          ...options,
        }
      };

      // Add system prompt if present
      if (systemPrompt) {
        requestBody.systemInstruction = {
          parts: [{ text: systemPrompt }]
        };
      }

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

        try {
          // Gemini returns each chunk as a JSON object
          const lines = chunk.split('\\n').filter(line => line.trim());

          for (const line of lines) {
            const data = JSON.parse(line);

            if (data.candidates && data.candidates[0].content.parts[0].text) {
              const content = data.candidates[0].content.parts[0].text;
              fullText += content;
              onChunk(content, fullText);
            }
          }
        } catch (e) {
          console.error('Error parsing streaming response:', e);
        }
      }
    } catch (error) {
      console.error('Error generating streaming Gemini completion:', error);
      throw error;
    }
  }
}

/**
 * DeepSeek model provider
 */
class DeepSeekProvider extends ModelProvider {
  constructor(settings) {
    super(settings);
    this.name = 'deepseek';
    this.baseUrl = settings.providers.deepseek.baseUrl || 'https://api.deepseek.com';
    this.apiKey = settings.providers.deepseek.apiKey || '';
  }

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
      // Return default models from settings if API call fails
      return settings.providers.deepseek.models.map(model => ({
        name: model.id,
        size: null,
        modified_at: Date.now(),
        provider: 'deepseek'
      }));
    }
  }

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

        try {
          // DeepSeek returns each chunk as a data: JSON object (OpenAI compatible)
          const lines = chunk.split('\n').filter(line => line.trim().startsWith('data:'));

          for (const line of lines) {
            const jsonStr = line.replace('data: ', '').trim();

            // Skip the [DONE] message
            if (jsonStr === '[DONE]') continue;

            const data = JSON.parse(jsonStr);

            if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
              const content = data.choices[0].delta.content;
              fullText += content;
              onChunk(content, fullText);
            }
          }
        } catch (e) {
          console.error('Error parsing streaming response:', e);
        }
      }
    } catch (error) {
      console.error('Error generating streaming DeepSeek completion:', error);
      throw error;
    }
  }
}

/**
 * OpenRouter model provider
 */
class OpenRouterProvider extends ModelProvider {
  constructor(settings) {
    super(settings);
    this.name = 'openrouter';
    this.baseUrl = settings.providers.openrouter.baseUrl || 'https://openrouter.ai/api/v1';
    this.apiKey = settings.providers.openrouter.apiKey || '';
  }

  async isAvailable() {
    if (!this.apiKey) return false;

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Dev Agent App'
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      return response.ok;
    } catch (error) {
      console.error('OpenRouter API check failed:', error);
      return false;
    }
  }

  async listModels() {
    if (!this.apiKey) return [];

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Dev Agent App'
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
        provider: 'openrouter',
        context_length: model.context_length,
        pricing: model.pricing
      }));
    } catch (error) {
      console.error('Error fetching OpenRouter models:', error);
      return [];
    }
  }

  async generateCompletion(model, messages, options = {}) {
    if (!this.apiKey) throw new Error('OpenRouter API key not set');

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
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Dev Agent App'
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
      console.error('Error generating OpenRouter completion:', error);
      throw error;
    }
  }

  async generateStreamingCompletion(model, messages, onChunk, options = {}) {
    if (!this.apiKey) throw new Error('OpenRouter API key not set');

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
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Dev Agent App'
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
          // OpenRouter returns each chunk as a data: JSON object (OpenAI compatible)
          const lines = chunk.split('\n').filter(line => line.trim().startsWith('data:'));

          for (const line of lines) {
            const jsonStr = line.replace('data: ', '').trim();

            // Skip the [DONE] message
            if (jsonStr === '[DONE]') continue;

            const data = JSON.parse(jsonStr);

            if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
              const content = data.choices[0].delta.content;
              fullText += content;
              onChunk(content, fullText);
            }
          }
        } catch (e) {
          console.error('Error parsing streaming response:', e);
        }
      }
    } catch (error) {
      console.error('Error generating streaming OpenRouter completion:', error);
      throw error;
    }
  }
}

/**
 * Requesty model provider (OpenAI compatible)
 */
class RequestyProvider extends ModelProvider {
  constructor(settings) {
    super(settings);
    this.name = 'requesty';
    this.baseUrl = settings.providers.requesty.baseUrl || 'https://api.requesty.ai/v1';
    this.apiKey = settings.providers.requesty.apiKey || '';
  }

  async isAvailable() {
    if (!this.apiKey || !this.baseUrl) return false;

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      return response.ok;
    } catch (error) {
      console.error('Requesty API check failed:', error);
      return false;
    }
  }

  async listModels() {
    if (!this.apiKey || !this.baseUrl) return [];

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

      return data.data.map(model => ({
        name: model.id,
        size: null,
        modified_at: model.created * 1000, // Convert to milliseconds
        provider: 'requesty'
      }));
    } catch (error) {
      console.error('Error fetching Requesty models:', error);
      return [];
    }
  }

  async generateCompletion(model, messages, options = {}) {
    if (!this.apiKey || !this.baseUrl) throw new Error('Requesty API key or URL not set');

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

      // Convert to Ollama-like format for consistency
      return {
        message: {
          role: 'assistant',
          content: data.choices[0].message.content
        }
      };
    } catch (error) {
      console.error('Error generating Requesty completion:', error);
      throw error;
    }
  }

  async generateStreamingCompletion(model, messages, onChunk, options = {}) {
    if (!this.apiKey || !this.baseUrl) throw new Error('Requesty API key or URL not set');

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

        try {
          // Requesty returns each chunk as a data: JSON object (OpenAI compatible)
          const lines = chunk.split('\n').filter(line => line.trim().startsWith('data:'));

          for (const line of lines) {
            const jsonStr = line.replace('data: ', '').trim();

            // Skip the [DONE] message
            if (jsonStr === '[DONE]') continue;

            const data = JSON.parse(jsonStr);

            if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
              const content = data.choices[0].delta.content;
              fullText += content;
              onChunk(content, fullText);
            }
          }
        } catch (e) {
          console.error('Error parsing streaming response:', e);
        }
      }
    } catch (error) {
      console.error('Error generating streaming Requesty completion:', error);
      throw error;
    }
  }
}

/**
 * Factory function to create a provider instance based on provider name
 * @param {string} providerName - The name of the provider
 * @param {Object} settings - The settings object
 * @returns {ModelProvider} A provider instance
 */
export const createProvider = (providerName, settings) => {
  // Check if settings and providers exist
  if (!settings || !settings.providers) {
    throw new Error('Invalid settings object');
  }

  // Check if the provider exists in settings
  if (!settings.providers[providerName]) {
    throw new Error(`Provider ${providerName} not found in settings`);
  }

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
