"use client";

import React, { useEffect, use, useState, startTransition } from 'react';
import ChatInterface from '@/components/ChatInterface';
import ResearchChatInterface from '@/components/ResearchChatInterface';
// WelcomeMessage is removed from here as a primary fallback during loading
// import WelcomeMessage from '@/components/WelcomeMessage'; 
import { useProject, PROJECT_TYPES } from '@/context/ProjectContext';
import { useRouter } from 'next/navigation';

export default function ProjectAgentPage(props) {
  const resolvedParams = use(props.params);
  const {
    projects,
    activeProject,
    setActiveProject,
    activeAgent,
    setActiveAgent,
    setActiveProjectAndAgent,
    // PROJECT_TYPES is already available from the import, no need to destructure if not modifying it
  } = useProject();
  
  const router = useRouter();
  const { projectType, projectId, agentId } = resolvedParams;
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // If projects are not loaded yet from context, wait for them.
    if (projects.length === 0) {
      setIsInitializing(true);
      return; 
    }

    const projectFromUrl = projects.find(p => p.id === projectId);

    if (!projectFromUrl) {
      // Project not found - redirect to home
      console.error("Project ID from URL not found after projects loaded. Redirecting to home.");
      router.push('/');
      return;
    }

    if (projectFromUrl.type !== projectType) {
      console.error("Project type mismatch in URL vs project data. Redirecting to home.");
      router.push('/');
      return;
    }

    // Check what needs to be updated
    const needsProjectUpdate = !activeProject || activeProject.id !== projectId;
    const needsAgentUpdate = !activeAgent || activeAgent !== agentId;

    // Always ensure we have the correct project and agent from URL
    if (needsProjectUpdate || needsAgentUpdate) {
      startTransition(() => {
        if (needsProjectUpdate && needsAgentUpdate) {
          // Update both at once
          setActiveProjectAndAgent(projectFromUrl, agentId);
        } else if (needsProjectUpdate) {
          setActiveProject(projectFromUrl);
        } else if (needsAgentUpdate) {
          setActiveAgent(agentId);
        }
        // Mark as still initializing until next render
        setIsInitializing(true);
      });
    } else {
      // Everything is aligned - we're ready
      setIsInitializing(false);
    }

  }, [projectId, agentId, projectType, projects, activeProject, activeAgent, setActiveProject, setActiveAgent, setActiveProjectAndAgent, router]);

  // Rendering Logic:

  // 1. If we're still initializing or projects are not loaded, show loading
  if (isInitializing || projects.length === 0 || !activeProject || activeProject.id !== projectId || !activeAgent || activeAgent !== agentId) {
    return <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">Loading agent interface...</div>;
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