"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import ChatInterface from './ChatInterface';
import DarkModeToggle from './DarkModeToggle';
import SettingsButton from './SettingsButton';
import SettingsModal from './SettingsModal';
import WelcomeMessage from './WelcomeMessage';
import { ModelProvider } from '../context/ModelContext';
import { SettingsProvider } from '../context/SettingsContext';

const Layout = () => {
  const [activeAgent, setActiveAgent] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Close mobile menu when agent is selected
  useEffect(() => {
    if (activeAgent && isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }, [activeAgent, isMobileMenuOpen]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-3 rounded-2xl shadow-lg mb-6 animate-pulse">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Loading Dev Agent</h2>
          <p className="text-gray-600 dark:text-gray-400">Preparing your AI development assistant...</p>
        </div>
      </div>
    );
  }

  return (
    <SettingsProvider>
      <ModelProvider>
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-md"
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
          <div className="fixed top-4 right-4 z-50 flex gap-2">
            <SettingsButton />
            <DarkModeToggle />
          </div>

          {/* Sidebar - responsive */}
          <div className={`
            lg:relative fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out
            ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}>
            <Sidebar activeAgent={activeAgent} setActiveAgent={setActiveAgent} />
          </div>

          {/* Overlay for mobile */}
          {isMobileMenuOpen && (
            <div
              className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
              onClick={() => setIsMobileMenuOpen(false)}
            ></div>
          )}

          {/* Main content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <main className="flex-1 overflow-hidden">
              <div className="h-full animate-fade-in">
                {activeAgent ? (
                  <ChatInterface activeAgent={activeAgent} />
                ) : (
                  <WelcomeMessage />
                )}
              </div>
            </main>
          </div>

          {/* Settings Modal */}
          <SettingsModal />
        </div>
      </ModelProvider>
    </SettingsProvider>
  );
};

export default Layout;
