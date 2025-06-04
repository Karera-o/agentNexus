"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Sidebar from '@/components/Sidebar';
import DarkModeToggle from '@/components/DarkModeToggle';
import SettingsButton from '@/components/SettingsButton';
import SettingsModal from '@/components/SettingsModal';
import ProjectModal from '@/components/ProjectModal';
import { useProject } from '@/context/ProjectContext'; // Assuming activeAgent might come from here or a new context

// Loading component for Suspense fallback
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-900">
    <div className="text-center">
      <div className="inline-block bg-primary p-3 rounded-md shadow-sm mb-4 animate-pulse">
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
        </svg>
      </div>
      <h2 className="text-xl font-medium text-gray-800 dark:text-gray-100 mb-2">Loading AgentNexus</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">Preparing your multi-agent assistant...</p>
    </div>
  </div>
);

export default function AppLayout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Initial loading state for the layout itself

  // Access activeProject to potentially influence sidebar or other elements if needed in the future
  // For now, the primary control of activeAgent for chat interfaces will be on the page level.
  const { activeProject, activeAgent, setActiveAgent } = useProject(); // Assuming useProject now provides activeAgent and setActiveAgent

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500); // Shorter delay for layout load, page content might have its own loading
    return () => clearTimeout(timer);
  }, []);

  // Close mobile menu when an agent is selected (if activeAgent changes)
  useEffect(() => {
    if (activeAgent && isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }, [activeAgent, isMobileMenuOpen]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-[60] p-2 rounded-lg bg-white dark:bg-gray-800 shadow-md"
        aria-label="Toggle menu"
      >
        <svg className="w-6 h-6 text-gray-800 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          {isMobileMenuOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
          )}
        </svg>
      </button>

      {/* Header controls */}
      <div className="fixed top-4 right-4 z-[60] flex gap-2">
        <SettingsButton />
        <DarkModeToggle />
      </div>

      {/* Sidebar - responsive */}
      {/* Ensure Sidebar has access to activeAgent and setActiveAgent if it needs to set/display it */}
      {/* This might now come from ProjectContext or a dedicated AgentContext */}
      <div className={`
        lg:relative fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar 
          activeAgent={activeAgent} 
          setActiveAgent={setActiveAgent} 
        />
      </div>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8">
          <Suspense fallback={<LoadingSpinner />}>
            {children}
          </Suspense>
        </main>
      </div>

      {/* Global Modals */}
      <SettingsModal />
      <ProjectModal />
    </div>
  );
} 