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
    <div className="w-[var(--sidebar-width)] bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white h-full flex flex-col shadow-sm border-r border-gray-200 dark:border-gray-800">
      {/* Logo and title */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-1.5 rounded-md">
            <FaBrain className="text-white text-sm" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900 dark:text-white">AgentNexus</h1>
            <p className="text-gray-500 dark:text-gray-400 text-xs">Multi-Agent Assistant</p>
          </div>
        </div>
      </div>

      {/* Active Project */}
      {activeProject && (
        <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`mr-2 p-1.5 rounded-md ${activeProject.type === PROJECT_TYPES.RESEARCH ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'}`}>
                {activeProject.type === PROJECT_TYPES.RESEARCH ? <FaFlask className="text-xs" /> : <FaFolder className="text-xs" />}
              </div>
              <div className="truncate">
                <h3 className="text-sm font-medium truncate">{activeProject.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {activeProject.type === PROJECT_TYPES.RESEARCH ? 'Research Project' : 'Software Project'}
                </p>
              </div>
            </div>
            <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md transition-colors">
              <FaEllipsisH className="text-gray-400 text-xs" />
            </button>
          </div>
        </div>
      )}

      {/* Agents section */}
      <div className="flex-1 overflow-y-auto p-3">
        <h2 className="text-gray-500 dark:text-gray-400 text-xs font-medium mb-2 ml-1">Agents</h2>
        <ul className="space-y-1">
          {agents.map((agent) => (
            <li key={agent.id} className="animate-fade-in" style={{animationDelay: `${agents.indexOf(agent) * 0.05}s`}}>
              <button
                onClick={() => setActiveAgent(agent.id)}
                className={`w-full text-left px-3 py-2 rounded-md flex items-center transition-all duration-200 ${activeAgent === agent.id
                  ? `bg-primary/10 text-primary dark:text-primary-light border-l-2 border-primary`
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className={`mr-2 p-1.5 rounded-md ${activeAgent === agent.id ? 'bg-primary/20 text-primary' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                  {agent.icon}
                </div>
                <span className="font-medium text-sm">{agent.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Projects section */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-800">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-gray-500 dark:text-gray-400 text-xs font-medium ml-1">Projects</h2>
          <span className="text-xs text-gray-400 dark:text-gray-500">{projects.length}</span>
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
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mr-1.5"></div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Software Projects ({softwareProjects.length})</span>
                    </div>
                    <div className="space-y-1">
                      {softwareProjects.map(project => (
                        <button
                          key={project.id}
                          onClick={() => setActiveProject(project)}
                          className={`w-full text-left px-2 py-1.5 rounded-md flex items-center transition-all duration-200 text-xs
                            ${activeProject?.id === project.id
                              ? `bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border-l-2 border-primary`
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300'
                            }`}
                        >
                          <div className="mr-1.5 p-1 rounded-md bg-primary/10 text-primary">
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
                      <div className="w-1.5 h-1.5 rounded-full bg-secondary mr-1.5"></div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Research Projects ({researchProjects.length})</span>
                    </div>
                    <div className="space-y-1">
                      {researchProjects.map(project => (
                        <button
                          key={project.id}
                          onClick={() => setActiveProject(project)}
                          className={`w-full text-left px-2 py-1.5 rounded-md flex items-center transition-all duration-200 text-xs
                            ${activeProject?.id === project.id
                              ? `bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border-l-2 border-secondary`
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300'
                            }`}
                        >
                          <div className="mr-1.5 p-1 rounded-md bg-secondary/10 text-secondary">
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
                  <div className="text-center py-2 text-gray-500 dark:text-gray-400 text-xs">
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
          className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 flex items-center transition-all duration-200 group mt-2"
        >
          <div className="mr-2 p-1.5 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
            <FaPlus className="text-xs group-hover:text-primary dark:group-hover:text-primary-light transition-colors" />
          </div>
          <span className="text-sm">New Project</span>
        </button>
      </div>

      {/* Footer with version */}
      <div className="p-3 text-center text-gray-400 dark:text-gray-500 text-xs border-t border-gray-200 dark:border-gray-800">
        <p>AgentNexus v1.0.0</p>
      </div>
    </div>
  );
};

export default Sidebar;
