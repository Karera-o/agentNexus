"use client";

import React, { createContext, useState, useContext, useEffect } from 'react';
import { createDirectory, getDefaultStoragePath } from '../utils/fileSystem';

// Project types
export const PROJECT_TYPES = {
  SOFTWARE: 'software',
  RESEARCH: 'research'
};



// Default project settings
const defaultProject = {
  type: PROJECT_TYPES.SOFTWARE,
  name: 'New Project',
  description: '',
  storagePath: getDefaultStoragePath('New Project', PROJECT_TYPES.SOFTWARE), // Path to store project files and chat history
  created: new Date().toISOString(),
  lastModified: new Date().toISOString()
};

// Create context
const ProjectContext = createContext();

// Provider component
export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);
  const [activeAgent, setActiveAgent] = useState(null);

  // Load projects from file system on initial mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        // Fetch projects from API
        const response = await fetch('/api/projects');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.projects && data.projects.length > 0) {
          setProjects(data.projects);
        }

        // Fetch active project from API
        const activeResponse = await fetch('/api/projects/active');
        if (!activeResponse.ok) {
          throw new Error(`HTTP error! status: ${activeResponse.status}`);
        }

        const activeData = await activeResponse.json();
        if (activeData.activeProject) {
          setActiveProject(activeData.activeProject);
        } else {
          // Create a default project if none exists
          const defaultProjectWithId = {
            ...defaultProject,
            id: generateId(),
            storagePath: getDefaultStoragePath('New Project', PROJECT_TYPES.SOFTWARE)
          };
          setProjects([defaultProjectWithId]);
          setActiveProject(defaultProjectWithId);
        }
      } catch (error) {
        console.error('Error loading projects:', error);

        // Fallback to localStorage if API fails
        const savedProjects = localStorage.getItem('projects');
        if (savedProjects) {
          setProjects(JSON.parse(savedProjects));
        }

        const savedActiveProject = localStorage.getItem('activeProject');
        if (savedActiveProject) {
          setActiveProject(JSON.parse(savedActiveProject));
        } else {
          // Create a default project if none exists
          const defaultProjectWithId = {
            ...defaultProject,
            id: generateId(),
            storagePath: getDefaultStoragePath('New Project', PROJECT_TYPES.SOFTWARE)
          };
          setProjects([defaultProjectWithId]);
          setActiveProject(defaultProjectWithId);
        }
      }
    };

    loadProjects();
  }, []);

  // Save projects to file system whenever they change
  useEffect(() => {
    const saveProjects = async () => {
      if (projects.length > 0) {
        try {
          // Save projects to API
          const response = await fetch('/api/projects', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ projects }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        } catch (error) {
          console.error('Error saving projects:', error);

          // Fallback to localStorage if API fails
          localStorage.setItem('projects', JSON.stringify(projects));
        }
      }
    };

    saveProjects();
  }, [projects]);

  // Save active project to file system whenever it changes
  useEffect(() => {
    const saveActiveProject = async () => {
      if (activeProject) {
        try {
          // Save active project to API
          const response = await fetch('/api/projects/active', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ activeProject }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        } catch (error) {
          console.error('Error saving active project:', error);

          // Fallback to localStorage if API fails
          localStorage.setItem('activeProject', JSON.stringify(activeProject));
        }
      }
    };

    saveActiveProject();
  }, [activeProject]);

  // Generate a unique ID for new projects
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  // Create a new project
  const createProject = (projectData) => {
    // Generate storage path if not provided
    if (!projectData.storagePath) {
      projectData.storagePath = getDefaultStoragePath(
        projectData.name || defaultProject.name,
        projectData.type || defaultProject.type
      );
    }

    const newProject = {
      ...defaultProject,
      ...projectData,
      id: generateId(),
      created: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    // Create the project directory
    createDirectory(newProject.storagePath);

    setProjects(prev => [...prev, newProject]);
    setActiveProject(newProject);
    return newProject;
  };

  // Update an existing project
  const updateProject = (id, projectData) => {
    const updatedProjects = projects.map(project => {
      if (project.id === id) {
        const updatedProject = {
          ...project,
          ...projectData,
          lastModified: new Date().toISOString()
        };

        // Update active project if it's the one being updated
        if (activeProject && activeProject.id === id) {
          setActiveProject(updatedProject);
        }

        return updatedProject;
      }
      return project;
    });

    setProjects(updatedProjects);
  };

  // Delete a project
  const deleteProject = (id) => {
    const filteredProjects = projects.filter(project => project.id !== id);
    setProjects(filteredProjects);

    // If the active project is deleted, set the first available project as active
    if (activeProject && activeProject.id === id) {
      if (filteredProjects.length > 0) {
        setActiveProject(filteredProjects[0]);
      } else {
        setActiveProject(null);
      }
    }
  };

  // Toggle project modal
  const toggleProjectModal = (project = null) => {
    if (!isProjectModalOpen) {
      // Opening the modal
      setProjectToEdit(project);
    } else {
      // Closing the modal
      setProjectToEdit(null);
    }
    setIsProjectModalOpen(!isProjectModalOpen);
  };

  // Context value
  const value = {
    projects,
    activeProject,
    setActiveProject,
    createProject,
    updateProject,
    deleteProject,
    isProjectModalOpen,
    toggleProjectModal,
    projectToEdit,
    PROJECT_TYPES,
    activeAgent,
    setActiveAgent,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};

// Custom hook for using the project context
export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
