"use client";

import React, { useEffect } from 'react';
import ChatInterface from '@/components/ChatInterface';
import ResearchChatInterface from '@/components/ResearchChatInterface';
// WelcomeMessage is removed from here as a primary fallback during loading
// import WelcomeMessage from '@/components/WelcomeMessage'; 
import { useProject, PROJECT_TYPES } from '@/context/ProjectContext';
import { useRouter } from 'next/navigation';

export default function ProjectAgentPage({ params }) {
  const {
    projects,
    activeProject,
    setActiveProject,
    activeAgent,
    setActiveAgent,
    // PROJECT_TYPES is already available from the import, no need to destructure if not modifying it
  } = useProject();
  
  const router = useRouter();
  const { projectType, projectId, agentId } = params;

  useEffect(() => {
    // If projects are not loaded yet from context, wait for them.
    // The effect will re-run when `projects` array is populated.
    if (projects.length === 0) {
      return; 
    }

    const projectFromUrl = projects.find(p => p.id === projectId);

    if (projectFromUrl) {
      if (projectFromUrl.type !== projectType) {
        console.error("Project type mismatch in URL vs project data. Redirecting to home.");
        router.push('/');
        return;
      }
      
      // Set this project as active if it's not already or different
      if (!activeProject || activeProject.id !== projectId) {
        setActiveProject(projectFromUrl);
        return; // Return early to wait for activeProject to be set by context re-render
      }
      
      // Now activeProject should be aligned with projectId (or effect will re-run if setActiveProject was called).
      // Proceed to set agent.
      if (agentId && (!activeAgent || activeAgent !== agentId)) {
        setActiveAgent(agentId);
        return; // Return early to wait for activeAgent to be set by context re-render
      }

    } else { // This 'else' corresponds to 'if (projectFromUrl)'
      // This block is reached if projects ARE loaded (projects.length > 0), but projectId was not found.
      console.error("Project ID from URL not found after projects loaded. Redirecting to home.");
      router.push('/');
      return;
    }
    // If we reach here, all necessary context setting calls in this effect pass have been made.
    // Subsequent re-renders will confirm their state.

  }, [projectId, agentId, projectType, projects, activeProject, setActiveProject, activeAgent, setActiveAgent, router]);

  // Rendering Logic:

  // 1. If projects list is not yet populated from context, it's too early. Show loading.
  if (projects.length === 0) {
    // This indicates the initial fetch for projects in ProjectContext is likely still pending.
    return <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">Loading project data...</div>;
  }

  // 2. If activeProject is not set or doesn't match URL's projectId.
  //    (This implies projects ARE loaded from context, but activeProject isn't aligned yet).
  if (!activeProject || activeProject.id !== projectId) {
    // The useEffect is working on setting this.
    return <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">Verifying project...</div>;
  }

  // 3. If activeAgent is not set or doesn't match URL's agentId.
  //    (This implies activeProject IS set and matches, but activeAgent isn't aligned yet).
  if (!activeAgent || activeAgent !== agentId) {
    // The useEffect is working on setting this. This was where WelcomeMessage used to flash.
    return <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">Initializing agent...</div>;
  }

  // All checks passed: projects loaded, activeProject matches URL, activeAgent matches URL.
  // activeProject is guaranteed to be non-null here.
  const isResearchProject = activeProject.type === PROJECT_TYPES.RESEARCH;

  return (
    <div className="h-full animate-fade-in">
      {isResearchProject ? (
        <ResearchChatInterface /> // Implicitly uses activeProject from context
      ) : (
        <ChatInterface activeAgent={activeAgent} /> // Pass activeAgent; implicitly uses activeProject from context
      )}
    </div>
  );
} 