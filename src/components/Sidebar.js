"use client";

import React from 'react';
import { FaRobot, FaFileAlt, FaDatabase, FaCode, FaPaintBrush, FaPlus, FaBrain } from 'react-icons/fa';

const Sidebar = ({ activeAgent, setActiveAgent }) => {
  const agents = [
    { id: 'requirements', name: 'Requirements Analyst', icon: <FaFileAlt />, color: 'from-blue-500 to-blue-600' },
    { id: 'documentor', name: 'Software Documentor', icon: <FaCode />, color: 'from-green-500 to-green-600' },
    { id: 'system', name: 'System Designer', icon: <FaRobot />, color: 'from-purple-500 to-purple-600' },
    { id: 'database', name: 'DB Designer', icon: <FaDatabase />, color: 'from-yellow-500 to-yellow-600' },
    { id: 'ui', name: 'UI Architect', icon: <FaPaintBrush />, color: 'from-red-500 to-red-600' },
  ];

  return (
    <div className="w-[var(--sidebar-width)] bg-gradient-to-b from-gray-800 to-gray-900 text-white h-full flex flex-col shadow-xl">
      {/* Logo and title */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-2 rounded-lg">
            <FaBrain className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Dev Agent</h1>
            <p className="text-gray-400 text-sm">AI Development Assistant</p>
          </div>
        </div>
      </div>

      {/* Agents section */}
      <div className="flex-1 overflow-y-auto p-4">
        <h2 className="text-gray-400 uppercase text-xs font-semibold mb-3 ml-2">Agents</h2>
        <ul className="space-y-2">
          {agents.map((agent) => (
            <li key={agent.id} className="animate-fade-in" style={{animationDelay: `${agents.indexOf(agent) * 0.1}s`}}>
              <button
                onClick={() => setActiveAgent(agent.id)}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center transition-all duration-200 ${activeAgent === agent.id
                  ? `bg-gradient-to-r ${agent.color} text-white shadow-md`
                  : 'hover:bg-gray-700/50 text-gray-300'
                }`}
              >
                <div className={`mr-3 p-2 rounded-md ${activeAgent === agent.id ? 'bg-white/20' : `bg-gradient-to-r ${agent.color} bg-opacity-20`}`}>
                  {agent.icon}
                </div>
                <span className="font-medium">{agent.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Projects section */}
      <div className="p-4 border-t border-gray-700">
        <h2 className="text-gray-400 uppercase text-xs font-semibold mb-3 ml-2">Projects</h2>
        <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-700/50 text-gray-300 flex items-center transition-all duration-200 group">
          <div className="mr-3 p-2 rounded-md bg-gradient-to-r from-gray-600 to-gray-700">
            <FaPlus className="text-gray-300 group-hover:text-white transition-colors" />
          </div>
          <span className="font-medium">New Project</span>
        </button>
      </div>

      {/* Footer with version */}
      <div className="p-4 text-center text-gray-500 text-xs">
        <p>Version 1.0.0</p>
      </div>
    </div>
  );
};

export default Sidebar;
