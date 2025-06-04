"use client";

import React from 'react';
import ChatInterface from '@/components/ChatInterface';
import ResearchChatInterface from '@/components/ResearchChatInterface';
import WelcomeMessage from '@/components/WelcomeMessage';
import { useProject, PROJECT_TYPES } from '@/context/ProjectContext';

export default function AppPage() {
  const { activeProject, activeAgent } = useProject();

  // Determine if we should show the research interface
  const isResearchProject = activeProject?.type === PROJECT_TYPES.RESEARCH;

  return (
    <div className="h-full animate-fade-in">
      {activeAgent ? (
        isResearchProject ? (
          <ResearchChatInterface />
        ) : (
          <ChatInterface activeAgent={activeAgent} />
        )
      ) : (
        <WelcomeMessage />
      )}
    </div>
  );
} 