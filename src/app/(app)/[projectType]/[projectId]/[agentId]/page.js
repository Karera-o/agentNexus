"use client";

import React, { useEffect } from 'react';
import ChatInterface from '@/components/ChatInterface';
import ResearchChatInterface from '@/components/ResearchChatInterface';
import WelcomeMessage from '@/components/WelcomeMessage'; // Fallback
import { useProject, PROJECT_TYPES } from '@/context/ProjectContext';
import { useRouter } from 'next/navigation';

export default function ProjectAgentPage({ params }) {
  const {
    projects, // All projects
    activeProject,
    setActiveProject,
    activeAgent,
    setActiveAgent,
    PROJECT_TYPES
  } = useProject();
  
  const router = useRouter();

  const { projectType, projectId, agentId } = params;

  useEffect(() => {
    // Find the project from the list based on projectId from URL
    const projectFromUrl = projects.find(p => p.id === projectId);

    if (projectFromUrl) {
      if (projectFromUrl.type !== projectType) {
        // Project type mismatch, perhaps redirect or show an error
        console.error("Project type mismatch in URL vs project data. Redirecting to home.");
        router.push('/'); // Or a more specific error page
        return;
      }
      // Set this project as active if it's not already
      if (!activeProject || activeProject.id !== projectId) {
        setActiveProject(projectFromUrl);
      }
    } else if (projects.length > 0) {
      // ProjectId not found, and projects are loaded. This is an invalid project ID.
      console.error("Project ID from URL not found. Redirecting to home.");
      router.push('/');
      return;
    }
    // If projects are not yet loaded, this effect will re-run when they are.

    // Set the active agent based on agentId from URL
    // We assume agentId is a simple string identifier like 'requirements', 'documentor', etc.
    if (agentId && activeAgent !== agentId) {
        setActiveAgent(agentId);
    }

  }, [projectId, agentId, projectType, projects, setActiveProject, setActiveAgent, activeProject, router]);

  // Determine if we should show the research interface based on the activeProject from context
  const isResearchProject = activeProject?.type === PROJECT_TYPES.RESEARCH;

  // Ensure activeProject and activeAgent are set before rendering chat interfaces
  if (!activeProject || activeProject.id !== projectId || activeAgent !== agentId) {
    // Data is not yet aligned with URL params, show loading or welcome message as a fallback
    // This can happen briefly while useEffect updates the context
    return <WelcomeMessage />; // Or a dedicated loading spinner
  }

  return (
    <div className="h-full animate-fade-in">
      {activeAgent ? (
        isResearchProject ? (
          <ResearchChatInterface /> // This component implicitly uses activeProject from context
        ) : (
          <ChatInterface activeAgent={activeAgent} /> // Pass activeAgent; uses activeProject from context
        )
      ) : (
        <WelcomeMessage /> // Should ideally not be reached if agentId is in URL
      )}
    </div>
  );
} 