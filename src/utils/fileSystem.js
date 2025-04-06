"use client";

/**
 * Utility functions for file system operations
 * These functions are used to interact with the file system for project storage
 */

/**
 * Check if a directory exists
 * @param {string} path - Directory path to check
 * @returns {Promise<boolean>} - True if directory exists, false otherwise
 */
export const directoryExists = async (path) => {
  try {
    const response = await fetch('/api/filesystem', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'directoryExists',
        path,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.exists;
  } catch (error) {
    console.error('Error checking if directory exists:', error);
    return false;
  }
};

/**
 * Create a directory if it doesn't exist
 * @param {string} path - Directory path to create
 * @returns {Promise<boolean>} - True if directory was created or already exists, false otherwise
 */
export const createDirectory = async (path) => {
  try {
    const response = await fetch('/api/filesystem', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'createDirectory',
        path,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error creating directory:', error);
    return false;
  }
};

/**
 * Save a file to the specified path
 * @param {string} path - Path to save the file to
 * @param {string} filename - Name of the file
 * @param {string|Blob} content - Content to save
 * @param {boolean} forceDownload - Whether to force a download prompt
 * @returns {Promise<boolean>} - True if file was saved successfully, false otherwise
 */
export const saveFile = async (path, filename, content, forceDownload = false) => {
  try {
    // Convert Blob to string if needed
    let contentStr = content;
    if (content instanceof Blob) {
      contentStr = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsText(content);
      });
    }

    // Save to server
    const response = await fetch('/api/filesystem', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'saveFile',
        path,
        filename,
        content: contentStr,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Only trigger a download if forceDownload is true
    if (forceDownload) {
      // Create a blob from the content
      const blob = content instanceof Blob ? content : new Blob([content], { type: 'text/plain' });

      // Create a download link
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;

      // Trigger the download
      document.body.appendChild(a);
      a.click();

      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    }

    return true;
  } catch (error) {
    console.error('Error saving file:', error);
    return false;
  }
};

/**
 * Load a file from the specified path
 * @param {string} path - Path to load the file from
 * @param {string} filename - Name of the file
 * @returns {Promise<string|null>} - File content if loaded successfully, null otherwise
 */
export const loadFile = async (path, filename) => {
  try {
    const response = await fetch('/api/filesystem', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'loadFile',
        path,
        filename,
      }),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // File not found
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.content;
  } catch (error) {
    console.error('Error loading file:', error);
    return null;
  }
};

/**
 * List files in a directory
 * @param {string} path - Directory path to list files from
 * @returns {Promise<string[]|null>} - Array of filenames if successful, null otherwise
 */
export const listFiles = async (path) => {
  try {
    const response = await fetch('/api/filesystem', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'listFiles',
        path,
      }),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Directory not found
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.files;
  } catch (error) {
    console.error('Error listing files:', error);
    return null;
  }
};

/**
 * Open a folder selection dialog
 * @returns {Promise<string|null>} - Selected folder path if successful, null otherwise
 */
export const selectFolder = async () => {
  try {
    // For now, we'll use the default path structure instead of prompting the user
    // In a future version, we could implement a folder selection dialog
    return null;
  } catch (error) {
    console.error('Error selecting folder:', error);
    return null;
  }
};

/**
 * Validate a path to ensure it's a valid directory path
 * @param {string} path - Path to validate
 * @returns {boolean} - True if path is valid, false otherwise
 */
export const isValidPath = (path) => {
  // Basic path validation
  if (!path) return false;

  // Check for invalid characters in the path
  const invalidChars = /[<>:"|?*]/;
  if (invalidChars.test(path)) return false;

  return true;
};

/**
 * Get a sanitized version of a string for use in filenames
 * @param {string} str - String to sanitize
 * @returns {string} - Sanitized string
 */
export const sanitizeFilename = (str) => {
  if (!str) return '';

  // Replace invalid characters with underscores
  return str.replace(/[<>:"/\\|?*]/g, '_');
};

/**
 * Join path segments into a single path
 * @param {...string} segments - Path segments to join
 * @returns {string} - Joined path
 */
export const joinPath = (...segments) => {
  return segments.filter(Boolean).join('/');
};

/**
 * Get the default storage path for a project
 * @param {string} projectName - Name of the project
 * @param {string} projectType - Type of the project (software or research)
 * @returns {string} - Default storage path for the project
 */
export const getDefaultStoragePath = (projectName, projectType = 'software') => {
  if (!projectName) return '';

  // Sanitize the project name for use in a path
  const sanitizedName = sanitizeFilename(projectName);

  // Determine the folder based on project type
  const typeFolder = projectType.toLowerCase() === 'research' ? 'Research' : 'Software';

  // Return the full path
  return `~/Documents/Personal/Agents/${typeFolder}/${sanitizedName}`;
};


