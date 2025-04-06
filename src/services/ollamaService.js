"use client";

// Default Base URL for Ollama API
const DEFAULT_OLLAMA_API_BASE_URL = 'http://localhost:11434/api';

/**
 * Fetch all available models from Ollama
 * @param {string} apiUrl - The Ollama API URL
 * @returns {Promise<Array>} List of available models
 */
export const fetchOllamaModels = async (apiUrl = DEFAULT_OLLAMA_API_BASE_URL) => {
  try {
    const response = await fetch(`${apiUrl}/tags`);

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.models || [];
  } catch (error) {
    console.error('Error fetching Ollama models:', error);
    return [];
  }
};

/**
 * Generate a chat completion using Ollama
 * @param {string} model - The model to use
 * @param {Array} messages - Array of message objects with role and content
 * @param {Object} options - Additional options for the model
 * @param {string} apiUrl - The Ollama API URL
 * @returns {Promise<Object>} The generated response
 */
export const generateChatCompletion = async (model, messages, options = {}, apiUrl = DEFAULT_OLLAMA_API_BASE_URL) => {
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

    const response = await fetch(`${apiUrl}/chat`, {
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
};

/**
 * Generate a streaming chat completion using Ollama
 * @param {string} model - The model to use
 * @param {Array} messages - Array of message objects with role and content
 * @param {Function} onChunk - Callback function for each chunk of the response
 * @param {Object} options - Additional options for the model
 * @param {string} apiUrl - The Ollama API URL
 * @returns {Promise<void>}
 */
export const generateStreamingChatCompletion = async (model, messages, onChunk, options = {}, apiUrl = DEFAULT_OLLAMA_API_BASE_URL) => {
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

    const response = await fetch(`${apiUrl}/chat`, {
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
};

/**
 * Check if Ollama server is running
 * @param {string} apiUrl - The Ollama API URL
 * @returns {Promise<boolean>} True if server is running
 */
export const isOllamaServerRunning = async (apiUrl = DEFAULT_OLLAMA_API_BASE_URL) => {
  try {
    const response = await fetch(`${apiUrl}/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    return response.ok;
  } catch (error) {
    console.error('Ollama server check failed:', error);
    return false;
  }
};
