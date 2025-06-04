"use client";

import React, { useState, useEffect } from 'react';
import { FaTimes, FaCode, FaFlask, FaFolder, FaFolderOpen, FaBrain, FaCheckCircle } from 'react-icons/fa';
import { useProject, PROJECT_TYPES } from '../context/ProjectContext';
import { isValidPath, getDefaultStoragePath, selectFolder } from '../utils/fileSystem';

const ProjectModal = () => {
  const { isProjectModalOpen, toggleProjectModal, createProject, updateProject, projectToEdit } = useProject();

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
    if (isProjectModalOpen && projectToEdit) {
      // Editing existing project
      setFormData({
        name: projectToEdit.name || '',
        description: projectToEdit.description || '',
        type: projectToEdit.type || PROJECT_TYPES.SOFTWARE,
        storagePath: projectToEdit.storagePath || ''
      });
      setIsEditing(true);
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
  }, [isProjectModalOpen, projectToEdit]);

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
    if (isEditing && projectToEdit) {
      updateProject(projectToEdit.id, formData);
    } else {
      createProject(formData);
    }

    toggleProjectModal();
  };

  if (!isProjectModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Improved backdrop with blur effect */}
      <div 
        className="absolute inset-0 bg-gray-900/50 dark:bg-gray-900/70 backdrop-blur-sm animate-fade-in"
        onClick={toggleProjectModal}
      />
      
      {/* Modal container with enhanced styling */}
      <div className="relative w-full max-w-2xl mx-auto animate-fade-in-up">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          
          {/* Header with app branding */}
          <div className="relative bg-gradient-to-r from-primary to-primary-dark p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <FaBrain className="text-white text-xl" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    {isEditing ? 'Edit Project' : 'Create New Project'}
                  </h2>
                  <p className="text-white/80 text-sm">
                    {isEditing ? 'Update your project settings' : 'Set up your AI-powered workspace'}
                  </p>
                </div>
              </div>
              <button
                onClick={toggleProjectModal}
                className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all duration-200"
              >
                <FaTimes className="text-lg" />
              </button>
            </div>
          </div>

          {/* Form content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {/* Project Name */}
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Project Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your project name"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary/20 focus:border-primary dark:focus:border-primary transition-all duration-200"
                required
              />
            </div>

            {/* Project Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your project goals and objectives"
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary/20 focus:border-primary dark:focus:border-primary transition-all duration-200 resize-none"
              />
            </div>

            {/* Storage Location */}
            <div className="space-y-2">
              <label htmlFor="storagePath" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Storage Location
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="storagePath"
                  name="storagePath"
                  value={formData.storagePath}
                  readOnly
                  className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <FaFolder className="text-gray-400 text-sm" />
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                All project files and chat history will be automatically organized here
              </p>
            </div>

            {/* Project Type Selection */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Choose Project Type
              </label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Software Project Card */}
                <button
                  type="button"
                  onClick={() => handleTypeSelect(PROJECT_TYPES.SOFTWARE)}
                  className={`relative group p-6 rounded-xl border-2 transition-all duration-300 text-left ${
                    formData.type === PROJECT_TYPES.SOFTWARE
                      ? 'border-primary bg-primary/5 dark:bg-primary/10 ring-2 ring-primary/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary/30 dark:hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  {/* Selection indicator */}
                  {formData.type === PROJECT_TYPES.SOFTWARE && (
                    <div className="absolute top-4 right-4">
                      <FaCheckCircle className="text-primary text-lg" />
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`p-3 rounded-lg transition-all duration-300 ${
                      formData.type === PROJECT_TYPES.SOFTWARE
                        ? 'bg-primary text-white shadow-lg'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 group-hover:bg-primary/10 group-hover:text-primary'
                    }`}>
                      <FaCode className="text-xl" />
                    </div>
                    <div>
                      <h3 className={`font-semibold ${
                        formData.type === PROJECT_TYPES.SOFTWARE
                          ? 'text-primary dark:text-primary-light'
                          : 'text-gray-800 dark:text-gray-200'
                      }`}>
                        Software Project
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Full development suite
                      </p>
                    </div>
                  </div>

                  {/* Agent list */}
                  <div className="space-y-2">
                    {[
                      'Requirements Analyst',
                      'Software Documentor', 
                      'System Designer',
                      'DB Designer',
                      'UI Architect'
                    ].map((agent, index) => (
                      <div key={agent} className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          formData.type === PROJECT_TYPES.SOFTWARE ? 'bg-primary' : 'bg-gray-400'
                        }`} />
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {agent}
                        </span>
                      </div>
                    ))}
                  </div>
                </button>

                {/* Research Project Card */}
                <button
                  type="button"
                  onClick={() => handleTypeSelect(PROJECT_TYPES.RESEARCH)}
                  className={`relative group p-6 rounded-xl border-2 transition-all duration-300 text-left ${
                    formData.type === PROJECT_TYPES.RESEARCH
                      ? 'border-secondary bg-secondary/5 dark:bg-secondary/10 ring-2 ring-secondary/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-secondary/30 dark:hover:border-secondary/50 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  {/* Selection indicator */}
                  {formData.type === PROJECT_TYPES.RESEARCH && (
                    <div className="absolute top-4 right-4">
                      <FaCheckCircle className="text-secondary text-lg" />
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`p-3 rounded-lg transition-all duration-300 ${
                      formData.type === PROJECT_TYPES.RESEARCH
                        ? 'bg-secondary text-white shadow-lg'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 group-hover:bg-secondary/10 group-hover:text-secondary'
                    }`}>
                      <FaFlask className="text-xl" />
                    </div>
                    <div>
                      <h3 className={`font-semibold ${
                        formData.type === PROJECT_TYPES.RESEARCH
                          ? 'text-secondary dark:text-secondary-light'
                          : 'text-gray-800 dark:text-gray-200'
                      }`}>
                        Research Project
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Academic & research focus
                      </p>
                    </div>
                  </div>

                  {/* Features list */}
                  <div className="space-y-2">
                    {[
                      'Research Assistant',
                      'Paper Analysis',
                      'Literature Review', 
                      'Document Upload'
                    ].map((feature, index) => (
                      <div key={feature} className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          formData.type === PROJECT_TYPES.RESEARCH ? 'bg-secondary' : 'bg-gray-400'
                        }`} />
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={toggleProjectModal}
                className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-lg hover:from-primary-dark hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
              >
                {isEditing ? 'Update Project' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProjectModal;
