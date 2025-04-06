"use client";

import React from 'react';
import { FaRobot, FaFileAlt, FaDatabase, FaCode, FaPaintBrush, FaBrain, FaArrowRight } from 'react-icons/fa';

const WelcomeMessage = () => {
  return (
    <div className="flex flex-col h-full overflow-auto bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero section */}
      <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
        <div className="animate-fade-in">
          <div className="inline-block bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-3 rounded-2xl shadow-lg mb-6">
            <FaBrain className="text-white text-4xl" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
            Welcome to Dev Agent
          </h1>
          <p className="text-lg md:text-xl mb-8 max-w-2xl text-gray-600 dark:text-gray-300">
            Your personal multi-agent assistant for software development tasks.
            Upload documents, images, and code files for analysis.
            Choose from your locally installed Ollama models for each agent.
            Select an agent from the sidebar to begin your journey.
          </p>
        </div>

        <div className="w-full max-w-6xl">
          <h2 className="text-2xl font-semibold mb-8 text-gray-800 dark:text-gray-100 animate-fade-in" style={{animationDelay: '0.2s'}}>
            Choose your AI assistant
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
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
          </div>
        </div>
      </div>

      {/* Features section */}
      <div className="bg-gray-100 dark:bg-gray-800 py-16 px-8 animate-fade-in" style={{animationDelay: '0.8s'}}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold mb-8 text-center text-gray-800 dark:text-gray-100">
            Key Features
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              title="Chat Interface"
              description="Interact with specialized AI agents through a conversational UI."
            />
            <FeatureCard
              title="Ollama Integration"
              description="Use your locally installed Ollama models with each specialized agent."
            />
            <FeatureCard
              title="File Upload"
              description="Upload documents, images, and code files for AI analysis and processing."
            />
            <FeatureCard
              title="Local Storage"
              description="Save and load your projects locally for privacy and convenience."
            />
            <FeatureCard
              title="Export/Import"
              description="Export your data in various formats including JSON, Markdown, and PDF."
            />
            <FeatureCard
              title="Multi-Agent System"
              description="Specialized agents for different aspects of software development."
            />
            <FeatureCard
              title="Plugin Support"
              description="Extend functionality with custom agents and tools."
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white dark:bg-gray-900 py-8 px-8 text-center text-gray-600 dark:text-gray-400 text-sm">
        <p>Dev Agent - Version 1.0.0</p>
        <p className="mt-2">© 2023 All Rights Reserved</p>
      </div>
    </div>
  );
};

const AgentCard = ({ icon, title, description, color, delay }) => {
  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group animate-fade-in"
      style={{animationDelay: `${delay}s`}}
    >
      <div className={`bg-gradient-to-r ${color} h-2 w-full`}></div>
      <div className="p-6">
        <div className="flex items-center mb-4">
          <div className={`bg-gradient-to-r ${color} p-3 rounded-lg text-white text-xl`}>
            {icon}
          </div>
          <h3 className="text-lg font-semibold ml-3 text-gray-800 dark:text-white">{title}</h3>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-4">{description}</p>
        <div className="flex justify-end">
          <button className="text-sm flex items-center text-gray-500 dark:text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
            <span className="mr-1">Select</span>
            <FaArrowRight className="transform group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ title, description }) => {
  return (
    <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
      <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  );
};

export default WelcomeMessage;
