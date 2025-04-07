"use client";

import React, { useState, useEffect } from 'react';
import { FaRobot, FaFileAlt, FaDatabase, FaCode, FaPaintBrush, FaPlus, FaBrain, FaFlask, FaFolder, FaEllipsisH, FaEdit, FaTrash, FaEllipsisV, FaTimes } from 'react-icons/fa';
import { useProject, PROJECT_TYPES } from '../context/ProjectContext';

const Sidebar = ({ activeAgent, setActiveAgent }) => {
  const { projects, activeProject, setActiveProject, toggleProjectModal, deleteProject } = useProject();

  // State for project actions menu
  const [projectMenuOpen, setProjectMenuOpen] = useState(null);
  const [projectToEdit, setProjectToEdit] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);

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

  // Handle project menu toggle
  const toggleProjectMenu = (projectId, e) => {
    e.stopPropagation();
    setProjectMenuOpen(projectMenuOpen === projectId ? null : projectId);
  };

  // Handle edit project
  const handleEditProject = (project, e) => {
    e.stopPropagation();
    setProjectMenuOpen(null);
    toggleProjectModal(project);
  };

  // Handle delete project confirmation
  const handleDeleteConfirm = (project, e) => {
    e.stopPropagation();
    setProjectToDelete(project);
    setShowDeleteConfirm(true);
    setProjectMenuOpen(null);
  };

  // Handle actual project deletion
  const confirmDeleteProject = () => {
    if (projectToDelete) {
      deleteProject(projectToDelete.id);
      setShowDeleteConfirm(false);
      setProjectToDelete(null);
    }
  };

  // Close all menus when clicking outside
  const handleClickOutside = () => {
    setProjectMenuOpen(null);
  };

  // Add click outside handler
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (projectMenuOpen && !e.target.closest('.project-menu-container')) {
        setProjectMenuOpen(null);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [projectMenuOpen]);

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
                        <div key={project.id} className="relative group project-menu-container">
                          <button
                            onClick={() => setActiveProject(project)}
                            className={`w-full text-left px-2 py-1.5 rounded-md flex items-center justify-between transition-all duration-200 text-xs
                              ${activeProject?.id === project.id
                                ? `bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border-l-2 border-primary`
                                : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300'
                              }`}
                          >
                            <div className="flex items-center overflow-hidden">
                              <div className="mr-1.5 p-1 rounded-md bg-primary/10 text-primary flex-shrink-0">
                                <FaFolder className="text-xs" />
                              </div>
                              <span className="truncate">{project.name}</span>
                            </div>
                            <button
                              onClick={(e) => toggleProjectMenu(project.id, e)}
                              className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-opacity"
                            >
                              <FaEllipsisV size={10} />
                            </button>
                          </button>

                          {/* Project actions menu */}
                          {projectMenuOpen === project.id && (
                            <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 py-1 text-sm border border-gray-200 dark:border-gray-700">
                              <button
                                onClick={(e) => handleEditProject(project, e)}
                                className="w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center text-gray-700 dark:text-gray-300"
                              >
                                <FaEdit className="mr-2 text-xs" />
                                Edit Project
                              </button>
                              <button
                                onClick={(e) => handleDeleteConfirm(project, e)}
                                className="w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center text-red-500 dark:text-red-400"
                              >
                                <FaTrash className="mr-2 text-xs" />
                                Delete Project
                              </button>
                            </div>
                          )}
                        </div>
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
                        <div key={project.id} className="relative group project-menu-container">
                          <button
                            onClick={() => setActiveProject(project)}
                            className={`w-full text-left px-2 py-1.5 rounded-md flex items-center justify-between transition-all duration-200 text-xs
                              ${activeProject?.id === project.id
                                ? `bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border-l-2 border-secondary`
                                : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300'
                              }`}
                          >
                            <div className="flex items-center overflow-hidden">
                              <div className="mr-1.5 p-1 rounded-md bg-secondary/10 text-secondary flex-shrink-0">
                                <FaFlask className="text-xs" />
                              </div>
                              <span className="truncate">{project.name}</span>
                            </div>
                            <button
                              onClick={(e) => toggleProjectMenu(project.id, e)}
                              className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-opacity"
                            >
                              <FaEllipsisV size={10} />
                            </button>
                          </button>

                          {/* Project actions menu */}
                          {projectMenuOpen === project.id && (
                            <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 py-1 text-sm border border-gray-200 dark:border-gray-700">
                              <button
                                onClick={(e) => handleEditProject(project, e)}
                                className="w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center text-gray-700 dark:text-gray-300"
                              >
                                <FaEdit className="mr-2 text-xs" />
                                Edit Project
                              </button>
                              <button
                                onClick={(e) => handleDeleteConfirm(project, e)}
                                className="w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center text-red-500 dark:text-red-400"
                              >
                                <FaTrash className="mr-2 text-xs" />
                                Delete Project
                              </button>
                            </div>
                          )}
                        </div>
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

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
            <div className="bg-red-500 p-4 text-white flex justify-between items-center">
              <h2 className="text-xl font-semibold">Delete Project</h2>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <FaTimes />
              </button>
            </div>
            <div className="p-6">
              <p className="mb-4 text-gray-700 dark:text-gray-300">
                Are you sure you want to delete <span className="font-semibold">{projectToDelete?.name}</span>? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteProject}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
