"use client";

import React, { useEffect } from 'react';
import { ModelProvider, useModelContext } from '@/context/ModelContext';
import { SettingsProvider, useSettings } from '@/context/SettingsContext';
import { ProjectProvider } from '@/context/ProjectContext';

// ModelInitializer component to handle model loading logic
const ModelInitializer = () => {
  const { settings } = useSettings();
  const { refreshAllModels, availableModels } = useModelContext();

  useEffect(() => {
    if (settings && availableModels) { // Ensure settings and availableModels are loaded
      const needsOpenRouterModels =
        settings.providers?.openrouter?.enabled &&
        (!availableModels.openrouter || availableModels.openrouter.length === 0);

      const needsOllamaModels =
        settings.providers?.ollama?.enabled &&
        (!availableModels.ollama || availableModels.ollama.length === 0);

      if (needsOpenRouterModels || needsOllamaModels) {
        console.log('AppProviders: Initializing models...');
        refreshAllModels();
      }
    }
  }, [
    settings,
    availableModels,
    refreshAllModels,
  ]);

  return null; // This component doesn't render anything visible
};

export default function AppProviders({ children }) {
  return (
    <SettingsProvider>
      <ModelProvider>
        <ProjectProvider>
          <ModelInitializer />
          {children}
        </ProjectProvider>
      </ModelProvider>
    </SettingsProvider>
  );
} 