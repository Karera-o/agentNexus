"use client";

import React from 'react';
import { FaRobot, FaFileAlt, FaDatabase, FaCode, FaPaintBrush, FaBrain, FaArrowRight, FaFlask, FaFolder } from 'react-icons/fa';
import { useProject, PROJECT_TYPES } from '../context/ProjectContext';

const WelcomeMessage = () => {
  const { activeProject, toggleProjectModal } = useProject();
  const isResearchProject = activeProject?.type === PROJECT_TYPES.RESEARCH;
  return (
    <div className="flex flex-col h-full overflow-auto bg-white dark:bg-gray-900">
      {/* Hero section */}
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="animate-fade-in">
          <div className="inline-block bg-primary p-2 rounded-md shadow-sm mb-4">
            <FaBrain className="text-white text-xl" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-3 text-gray-900 dark:text-white">
            Welcome to AgentNexus
          </h1>
          <p className="text-sm md:text-base mb-4 max-w-xl text-gray-600 dark:text-gray-300">
            {isResearchProject ? (
              <>Your personal AI assistant for research tasks. Upload documents and ask questions to analyze research materials.</>
            ) : (
              <>Your personal multi-agent assistant for software development tasks. Upload documents, images, and code files for analysis.</>
            )}
          </p>

          {/* Project type indicator */}
          <div className="mb-6 flex items-center justify-center">
            <div className={`px-3 py-1.5 rounded-md ${isResearchProject ? 'bg-secondary/10 text-secondary dark:text-secondary-light' : 'bg-primary/10 text-primary dark:text-primary-light'} flex items-center text-sm border border-gray-200 dark:border-gray-700`}>
              {isResearchProject ? (
                <>
                  <FaFlask className="mr-1.5 text-xs" />
                  <span>Research Project: {activeProject?.name}</span>
                </>
              ) : (
                <>
                  <FaFolder className="mr-1.5 text-xs" />
                  <span>Software Project: {activeProject?.name}</span>
                </>
              )}
              <button
                onClick={toggleProjectModal}
                className="ml-2 text-xs text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light"
              >
                Change
              </button>
            </div>
          </div>
        </div>

        <div className="w-full max-w-4xl">
          <h2 className="text-lg font-medium mb-6 text-gray-800 dark:text-gray-100 animate-fade-in" style={{animationDelay: '0.2s'}}>
            {isResearchProject ? 'Research Assistant' : 'Choose your AI assistant'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {isResearchProject ? (
              <AgentCard
                icon={<FaFlask />}
                title="Research Assistant"
                description="Analyze research papers, summarize findings, and answer academic questions."
                color="from-purple-500 to-purple-600"
                delay={0.3}
              />
            ) : (
              <>
                <AgentCard
                  icon={<FaFileAlt />}
                  title="Requirements Analyst"
                  description="Extract, clarify, and organize software requirements from your input."
                  color="from-blue-500 to-blue-600"
                  delay={0.3}
                />
                <AgentCard
                  icon={<FaCode />}
                  title="Software Documentor"
                  description="Generate technical documentation from your project data."
                  color="from-green-500 to-green-600"
                  delay={0.4}
                />
                <AgentCard
                  icon={<FaRobot />}
                  title="System Designer"
                  description="Create and visualize architecture diagrams for your system."
                  color="from-purple-500 to-purple-600"
                  delay={0.5}
                />
                <AgentCard
                  icon={<FaDatabase />}
                  title="DB Designer"
                  description="Design, visualize, and export database schemas."
                  color="from-yellow-500 to-yellow-600"
                  delay={0.6}
                />
                <AgentCard
                  icon={<FaPaintBrush />}
                  title="UI Architect"
                  description="Get expert UI design recommendations and guidance."
                  color="from-red-500 to-red-600"
                  delay={0.7}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white dark:bg-gray-900 py-6 px-6 text-center text-gray-500 dark:text-gray-400 text-xs">
        <p>AgentNexus - Version 1.0.0</p>
        <p className="mt-1">© 2023 All Rights Reserved</p>
      </div>
    </div>
  );
};

const AgentCard = ({ icon, title, description, color, delay }) => {
  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 hover:shadow-sm transition-all duration-300 overflow-hidden group animate-fade-in"
      style={{animationDelay: `${delay}s`}}
    >
      <div className="p-4">
        <div className="flex items-center mb-3">
          <div className={`bg-primary/10 text-primary dark:text-primary-light p-2 rounded-md text-sm`}>
            {icon}
          </div>
          <h3 className="text-sm font-medium ml-2 text-gray-800 dark:text-white">{title}</h3>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">{description}</p>
        <div className="flex justify-end">
          <button className="text-xs flex items-center text-gray-500 dark:text-gray-400 group-hover:text-primary dark:group-hover:text-primary-light transition-colors">
            <span className="mr-1">Select</span>
            <FaArrowRight className="transform group-hover:translate-x-1 transition-transform text-xs" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeMessage;
