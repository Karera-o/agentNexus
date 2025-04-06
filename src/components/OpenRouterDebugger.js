"use client";

import React, { useState } from 'react';
import { FaSpinner } from 'react-icons/fa';
import { useSettings } from '../context/SettingsContext';
import { useModelContext } from '../context/ModelContext';

/**
 * A component to debug OpenRouter API issues
 */
const OpenRouterDebugger = () => {
  const { settings } = useSettings();
  const { refreshAllModels, availableModels } = useModelContext();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const testOpenRouterAPI = async () => {
    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      // Get the API key from settings or environment variables
      const apiKey = settings.providers.openrouter?.apiKey || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '';

      if (!apiKey) {
        throw new Error('No API key found for OpenRouter');
      }

      console.log(`Testing OpenRouter API with key: ${apiKey ? 'Present (length: ' + apiKey.length + ')' : 'Not set'}`);

      // Create headers
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
        'X-Title': 'Dev Agent App'
      };

      console.log('Headers:', { ...headers, 'Authorization': 'Bearer [REDACTED]' });

      // Test the models endpoint
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        method: 'GET',
        headers: headers
      });

      console.log(`Response status: ${response.status}`);

      if (!response.ok) {
        let errorText;
        try {
          const errorData = await response.json();
          errorText = JSON.stringify(errorData);
        } catch (e) {
          errorText = await response.text();
        }
        throw new Error(`API Error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      setResult(data);
      console.log('OpenRouter API test successful:', data);
    } catch (error) {
      console.error('OpenRouter API test failed:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4">
      <h3 className="text-lg font-semibold mb-2">OpenRouter API Debugger</h3>

      <div className="mb-4">
        <p className="text-sm mb-2">
          API Key: {settings.providers.openrouter?.apiKey ?
            <span className="text-green-600 dark:text-green-400">Present (length: {settings.providers.openrouter.apiKey.length})</span> :
            <span className="text-red-600 dark:text-red-400">Not set</span>}
        </p>
        <p className="text-sm mb-2">
          Env Key: {process.env.NEXT_PUBLIC_OPENROUTER_API_KEY ?
            <span className="text-green-600 dark:text-green-400">Present (length: {process.env.NEXT_PUBLIC_OPENROUTER_API_KEY.length})</span> :
            <span className="text-red-600 dark:text-red-400">Not set</span>}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={testOpenRouterAPI}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 flex items-center"
        >
          {isLoading ? <FaSpinner className="mr-2 animate-spin" /> : null}
          {isLoading ? 'Testing API...' : 'Test OpenRouter API'}
        </button>

        <button
          onClick={() => {
            console.log('Manually refreshing models...');
            refreshAllModels();
          }}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center"
        >
          <FaSpinner className="mr-2" /> Refresh Models
        </button>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-lg">
          <h4 className="font-semibold mb-1">Error:</h4>
          <pre className="text-xs overflow-auto whitespace-pre-wrap">{error}</pre>
        </div>
      )}

      {result && (
        <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-lg">
          <h4 className="font-semibold mb-1">Success:</h4>
          <p className="mb-2">Found {result.data?.length || 0} models</p>
          <details>
            <summary className="cursor-pointer">View Response</summary>
            <pre className="text-xs overflow-auto mt-2 p-2 bg-white dark:bg-gray-700 rounded">{JSON.stringify(result, null, 2)}</pre>
          </details>
        </div>
      )}

      {/* Display available models */}
      <div className="mt-4">
        <h4 className="font-semibold mb-2">Available OpenRouter Models:</h4>
        {availableModels?.openrouter?.length > 0 ? (
          <div className="p-3 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-lg">
            <p className="mb-2">Found {availableModels.openrouter.length} models in context</p>
            <details>
              <summary className="cursor-pointer">View Models</summary>
              <ul className="text-xs mt-2 space-y-1">
                {availableModels.openrouter.map((model, index) => (
                  <li key={index} className="p-1 bg-white dark:bg-gray-700 rounded">
                    {model.displayName || model.name}
                  </li>
                ))}
              </ul>
            </details>
          </div>
        ) : (
          <p className="text-yellow-600 dark:text-yellow-400">No OpenRouter models available in context</p>
        )}

        {/* Display models from settings */}
        <h4 className="font-semibold mt-4 mb-2">OpenRouter Models in Settings:</h4>
        {settings.providers.openrouter?.models?.length > 0 ? (
          <div className="p-3 bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 rounded-lg">
            <p className="mb-2">Found {settings.providers.openrouter.models.length} models in settings</p>
            <details>
              <summary className="cursor-pointer">View Models</summary>
              <ul className="text-xs mt-2 space-y-1">
                {settings.providers.openrouter.models.map((model, index) => (
                  <li key={index} className="p-1 bg-white dark:bg-gray-700 rounded">
                    {model.name || model.id}
                  </li>
                ))}
              </ul>
            </details>
          </div>
        ) : (
          <p className="text-yellow-600 dark:text-yellow-400">No OpenRouter models in settings</p>
        )}
      </div>
    </div>
  );
};

export default OpenRouterDebugger;
