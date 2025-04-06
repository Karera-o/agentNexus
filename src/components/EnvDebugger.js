"use client";

import React, { useEffect, useState } from 'react';
import { getClientEnvApiKey } from '../utils/clientEnv';

/**
 * A simple component to debug environment variables
 */
const EnvDebugger = () => {
  const [envVars, setEnvVars] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get all environment variables
    const vars = {
      NEXT_PUBLIC_OPENROUTER_API_KEY: getClientEnvApiKey('openrouter'),
      NEXT_PUBLIC_ANTHROPIC_API_KEY: getClientEnvApiKey('anthropic'),
      NEXT_PUBLIC_GEMINI_API_KEY: getClientEnvApiKey('gemini'),
      NEXT_PUBLIC_DEEPSEEK_API_KEY: getClientEnvApiKey('deepseek'),
      NEXT_PUBLIC_REQUESTY_API_KEY: getClientEnvApiKey('requesty'),
      NEXT_PUBLIC_OLLAMA_HOST: getClientEnvApiKey('ollama_host'),
    };

    // Set the environment variables
    setEnvVars(vars);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return <div>Loading environment variables...</div>;
  }

  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4">
      <h3 className="text-lg font-semibold mb-2">Environment Variables</h3>
      <div className="space-y-2">
        {Object.entries(envVars).map(([key, value]) => (
          <div key={key} className="flex items-start">
            <div className="font-mono text-sm">{key}:</div>
            <div className="ml-2 font-mono text-sm">
              {value ? (
                <span className="text-green-600 dark:text-green-400">
                  Present (length: {value.length})
                </span>
              ) : (
                <span className="text-red-600 dark:text-red-400">Not set</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EnvDebugger;
