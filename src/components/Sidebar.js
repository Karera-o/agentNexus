"use client";

import React from 'react';
import { FaRobot, FaFileAlt, FaDatabase, FaCode, FaPaintBrush, FaPlus, FaBrain, FaFlask, FaFolder, FaEllipsisH } from 'react-icons/fa';
import { useProject, PROJECT_TYPES } from '../context/ProjectContext';

const Sidebar = ({ activeAgent, setActiveAgent }) => {
  const { projects, activeProject, setActiveProject, toggleProjectModal } = useProject();

  // Software development agents
  const softwareAgents = [
    { id: 'requirements', name: 'Requirements Analyst', icon: <FaFileAlt />, color: 'from-blue-500 to-blue-600' },
    { id: 'documentor', name: 'Software Documentor', icon: <FaCode />, color: 'from-green-500 to-green-600' },
    { id: 'system', name: 'System Designer', icon: <FaRobot />, color: 'from-purple-500 to-purple-600' },
    { id: 'database', name: 'DB Designer', icon: <FaDatabase />, color: 'from-yellow-500 to-yellow-600' },
    { id: 'ui', name: 'UI Architect', icon: <FaPaintBrush />, color: 'from-red-500 to-red-600' },
  ];

  // Research project agents
  const researchAgents = [
    { id: 'research', name: 'Research Assistant', icon: <FaFlask />, color: 'from-purple-500 to-purple-600' },
  ];

  // Determine which agents to show based on project type
  const agents = activeProject?.type === PROJECT_TYPES.RESEARCH ? researchAgents : softwareAgents;

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

      {/* Active Project */}
      {activeProject && (
        <div className="px-4 py-3 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`mr-2 p-2 rounded-md ${activeProject.type === PROJECT_TYPES.RESEARCH ? 'bg-purple-600/20' : 'bg-indigo-600/20'}`}>
                {activeProject.type === PROJECT_TYPES.RESEARCH ? <FaFlask /> : <FaFolder />}
              </div>
              <div className="truncate">
                <h3 className="font-medium truncate">{activeProject.name}</h3>
                <p className="text-xs text-gray-400 truncate">
                  {activeProject.type === PROJECT_TYPES.RESEARCH ? 'Research Project' : 'Software Project'}
                </p>
              </div>
            </div>
            <button className="p-1 hover:bg-gray-700 rounded-md transition-colors">
              <FaEllipsisH className="text-gray-400" />
            </button>
          </div>
        </div>
      )}

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
                <span className="font-medium text-sm">{agent.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Projects section */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-gray-400 uppercase text-xs font-semibold ml-2">Projects</h2>
          <span className="text-xs text-gray-500">{projects.length}</span>
        </div>

        {/* Project list - grouped by type */}
        <div className="mb-2 max-h-60 overflow-y-auto">
          {/* Group projects by type */}
          {(() => {
            // Separate projects by type
            const softwareProjects = projects.filter(p => p.type === PROJECT_TYPES.SOFTWARE);
            const researchProjects = projects.filter(p => p.type === PROJECT_TYPES.RESEARCH);

            return (
              <>
                {/* Software Projects */}
                {softwareProjects.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center mb-1">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 mr-2"></div>
                      <span className="text-xs text-gray-400">Software Projects ({softwareProjects.length})</span>
                    </div>
                    <div className="space-y-1">
                      {softwareProjects.map(project => (
                        <button
                          key={project.id}
                          onClick={() => setActiveProject(project)}
                          className={`w-full text-left px-3 py-2 rounded-lg flex items-center transition-all duration-200 text-sm
                            ${activeProject?.id === project.id
                              ? `bg-gray-700 text-white`
                              : 'hover:bg-gray-700/50 text-gray-300'
                            }`}
                        >
                          <div className="mr-2 p-1.5 rounded-md bg-indigo-600/20">
                            <FaFolder className="text-xs" />
                          </div>
                          <span className="truncate">{project.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Research Projects */}
                {researchProjects.length > 0 && (
                  <div>
                    <div className="flex items-center mb-1">
                      <div className="w-2 h-2 rounded-full bg-purple-500 mr-2"></div>
                      <span className="text-xs text-gray-400">Research Projects ({researchProjects.length})</span>
                    </div>
                    <div className="space-y-1">
                      {researchProjects.map(project => (
                        <button
                          key={project.id}
                          onClick={() => setActiveProject(project)}
                          className={`w-full text-left px-3 py-2 rounded-lg flex items-center transition-all duration-200 text-sm
                            ${activeProject?.id === project.id
                              ? `bg-gray-700 text-white`
                              : 'hover:bg-gray-700/50 text-gray-300'
                            }`}
                        >
                          <div className="mr-2 p-1.5 rounded-md bg-purple-600/20">
                            <FaFlask className="text-xs" />
                          </div>
                          <span className="truncate">{project.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* No projects message */}
                {projects.length === 0 && (
                  <div className="text-center py-2 text-gray-500 text-sm">
                    No projects yet. Create one below.
                  </div>
                )}
              </>
            );
          })()}
        </div>

        {/* New project button */}
        <button
          onClick={toggleProjectModal}
          className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-700/50 text-gray-300 flex items-center transition-all duration-200 group"
        >
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
