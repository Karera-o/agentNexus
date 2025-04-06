"use client";

import React, { useState, useEffect } from 'react';
import { FaTimes, FaCode, FaFlask, FaFolder, FaFolderOpen } from 'react-icons/fa';
import { useProject, PROJECT_TYPES } from '../context/ProjectContext';
import { isValidPath, getDefaultStoragePath, selectFolder } from '../utils/fileSystem';

const ProjectModal = () => {
  const { isProjectModalOpen, toggleProjectModal, createProject, updateProject, activeProject } = useProject();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: PROJECT_TYPES.SOFTWARE,
    storagePath: ''
  });

  const [pathError, setPathError] = useState('');

  const [isEditing, setIsEditing] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isProjectModalOpen && activeProject && isEditing) {
      // Editing existing project
      setFormData({
        name: activeProject.name || '',
        description: activeProject.description || '',
        type: activeProject.type || PROJECT_TYPES.SOFTWARE,
        storagePath: activeProject.storagePath || ''
      });
    } else {
      // Creating new project
      setFormData({
        name: '',
        description: '',
        type: PROJECT_TYPES.SOFTWARE,
        storagePath: ''
      });
      setIsEditing(false);
    }
    setPathError('');
  }, [isProjectModalOpen, activeProject, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Update storage path when name or type changes
    if ((name === 'name' || name === 'type') && formData.name) {
      const defaultPath = getDefaultStoragePath(formData.name, name === 'type' ? value : formData.type);
      setFormData(prev => ({ ...prev, [name]: value, storagePath: defaultPath }));
    }

    // Clear path error when storage path changes
    if (name === 'storagePath') {
      setPathError('');
    }
  };

  const handleTypeSelect = (type) => {
    // Update both type and storage path
    const defaultPath = getDefaultStoragePath(formData.name, type);
    setFormData(prev => ({ ...prev, type, storagePath: defaultPath }));
  };

  // We no longer need folder selection as we use a predefined structure
  // This is kept as a placeholder in case we want to re-enable it in the future
  const handleSelectFolder = async () => {
    // Do nothing - we use predefined paths now
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate project name
    if (!formData.name.trim()) {
      alert('Please enter a project name');
      return;
    }

    // Validate storage path
    if (!formData.storagePath.trim()) {
      setPathError('Please specify a storage location for this project');
      return;
    }

    if (!isValidPath(formData.storagePath)) {
      setPathError('Please enter a valid storage path');
      return;
    }

    // Create or update project
    if (isEditing && activeProject) {
      updateProject(activeProject.id, formData);
    } else {
      createProject(formData);
    }

    toggleProjectModal();
  };

  if (!isProjectModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 text-white flex justify-between items-center">
          <h2 className="text-xl font-semibold">{isEditing ? 'Edit Project' : 'Create New Project'}</h2>
          <button
            onClick={toggleProjectModal}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Project Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Project Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter project name"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          {/* Project Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter project description"
              rows="3"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Storage Path - Read-only display */}
          <div>
            <label htmlFor="storagePath" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Storage Location
              <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                (Where project files and chat history will be stored)
              </span>
            </label>
            <div className="flex">
              <input
                type="text"
                id="storagePath"
                name="storagePath"
                value={formData.storagePath}
                readOnly
                className="flex-1 p-2 border rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              All project files and chat history will be saved in this location.
            </p>
          </div>

          {/* Project Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Project Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleTypeSelect(PROJECT_TYPES.SOFTWARE)}
                className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                  formData.type === PROJECT_TYPES.SOFTWARE
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                    : 'border-gray-300 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-700'
                }`}
              >
                <div className={`p-3 rounded-full mb-2 ${
                  formData.type === PROJECT_TYPES.SOFTWARE
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}>
                  <FaCode className="text-xl" />
                </div>
                <span className={`font-medium ${
                  formData.type === PROJECT_TYPES.SOFTWARE
                    ? 'text-indigo-700 dark:text-indigo-300'
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  Software Project
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                  Full agent suite for software development
                </span>

                {/* Features list */}
                <ul className="mt-3 text-xs text-left w-full space-y-1 text-gray-600 dark:text-gray-400">
                  <li className="flex items-center">
                    <svg className="w-3 h-3 mr-1.5 text-indigo-500 dark:text-indigo-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                    Requirements Analyst
                  </li>
                  <li className="flex items-center">
                    <svg className="w-3 h-3 mr-1.5 text-indigo-500 dark:text-indigo-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                    Software Documentor
                  </li>
                  <li className="flex items-center">
                    <svg className="w-3 h-3 mr-1.5 text-indigo-500 dark:text-indigo-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                    System Designer
                  </li>
                  <li className="flex items-center">
                    <svg className="w-3 h-3 mr-1.5 text-indigo-500 dark:text-indigo-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                    DB Designer
                  </li>
                  <li className="flex items-center">
                    <svg className="w-3 h-3 mr-1.5 text-indigo-500 dark:text-indigo-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                    UI Architect
                  </li>
                </ul>
              </button>

              <button
                type="button"
                onClick={() => handleTypeSelect(PROJECT_TYPES.RESEARCH)}
                className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                  formData.type === PROJECT_TYPES.RESEARCH
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                    : 'border-gray-300 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-700'
                }`}
              >
                <div className={`p-3 rounded-full mb-2 ${
                  formData.type === PROJECT_TYPES.RESEARCH
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}>
                  <FaFlask className="text-xl" />
                </div>
                <span className={`font-medium ${
                  formData.type === PROJECT_TYPES.RESEARCH
                    ? 'text-purple-700 dark:text-purple-300'
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  Research Project
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                  Specialized assistant for research tasks
                </span>

                {/* Features list */}
                <ul className="mt-3 text-xs text-left w-full space-y-1 text-gray-600 dark:text-gray-400">
                  <li className="flex items-center">
                    <svg className="w-3 h-3 mr-1.5 text-purple-500 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                    Research Assistant
                  </li>
                  <li className="flex items-center">
                    <svg className="w-3 h-3 mr-1.5 text-purple-500 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                    Paper Analysis
                  </li>
                  <li className="flex items-center">
                    <svg className="w-3 h-3 mr-1.5 text-purple-500 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                    Literature Review
                  </li>
                  <li className="flex items-center">
                    <svg className="w-3 h-3 mr-1.5 text-purple-500 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                    Document Upload
                  </li>
                </ul>
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all shadow-md"
            >
              {isEditing ? 'Update Project' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectModal;
