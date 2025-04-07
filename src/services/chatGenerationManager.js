"use client";

import { createProvider } from './providers/provider-factory';

// Store for ongoing generations
// Format: { [projectId-agentId-messageId]: { status, content, timestamp, etc. } }
const ongoingGenerations = {};

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Load ongoing generations from localStorage on startup
if (isBrowser) {
  try {
    const savedGenerations = localStorage.getItem('ongoingGenerations');
    if (savedGenerations) {
      Object.assign(ongoingGenerations, JSON.parse(savedGenerations));
    }
  } catch (error) {
    console.error('Error loading ongoing generations:', error);
  }
}

// Save ongoing generations to localStorage
const saveOngoingGenerations = () => {
  if (isBrowser) {
    try {
      localStorage.setItem('ongoingGenerations', JSON.stringify(ongoingGenerations));
    } catch (error) {
      console.error('Error saving ongoing generations:', error);
    }
  }
};

/**
 * Start a new text generation
 * @param {Object} params - Generation parameters
 * @param {string} params.projectId - The project ID
 * @param {string} params.agentId - The agent ID
 * @param {number} params.messageId - The message ID
 * @param {Object} params.modelInfo - The model info (provider, model)
 * @param {Array} params.messages - The messages to send to the model
 * @param {Object} params.settings - The app settings
 * @param {Function} params.onUpdate - Callback for updates (optional)
 * @returns {Promise<string>} The generated text
 */
export const startGeneration = async ({
  projectId,
  agentId,
  messageId,
  modelInfo,
  messages,
  settings,
  onUpdate = null
}) => {
  // Create a unique key for this generation
  const key = `${projectId || 'default'}-${agentId}-${messageId}`;
  
  // Initialize generation state
  ongoingGenerations[key] = {
    status: 'generating',
    content: '',
    startTime: Date.now(),
    lastUpdateTime: Date.now(),
    projectId: projectId || 'default',
    agentId,
    messageId
  };
  
  // Save to localStorage
  saveOngoingGenerations();
  
  try {
    // Get the provider instance
    const provider = createProvider(modelInfo.provider, settings);
    
    // Check if provider is available
    const isAvailable = await provider.isAvailable();
    if (!isAvailable) {
      throw new Error(`The selected provider (${modelInfo.provider}) is not available. Please check your settings.`);
    }
    
    // Use streaming for better experience
    const modelName = modelInfo.model;
    
    // Create a promise that will resolve when generation is complete
    return new Promise((resolve, reject) => {
      // Start streaming generation
      provider.generateStreamingCompletion(
        modelName,
        messages,
        (chunk, fullText) => {
          // Update the generation state
          ongoingGenerations[key] = {
            ...ongoingGenerations[key],
            content: fullText,
            lastUpdateTime: Date.now()
          };
          
          // Call the update callback if provided
          if (onUpdate) {
            onUpdate(fullText);
          }
          
          // Save to localStorage periodically (every 2 seconds)
          if (Date.now() - (ongoingGenerations[key].lastSaveTime || 0) > 2000) {
            ongoingGenerations[key].lastSaveTime = Date.now();
            saveOngoingGenerations();
          }
        },
        { temperature: 0.7 }
      ).then(() => {
        // Mark as complete
        ongoingGenerations[key] = {
          ...ongoingGenerations[key],
          status: 'complete',
          endTime: Date.now()
        };
        
        // Save to localStorage
        saveOngoingGenerations();
        
        // Resolve the promise with the final content
        resolve(ongoingGenerations[key].content);
        
        // Clean up after 5 minutes
        setTimeout(() => {
          delete ongoingGenerations[key];
          saveOngoingGenerations();
        }, 5 * 60 * 1000);
      }).catch(error => {
        // Mark as error
        ongoingGenerations[key] = {
          ...ongoingGenerations[key],
          status: 'error',
          error: error.message,
          endTime: Date.now()
        };
        
        // Save to localStorage
        saveOngoingGenerations();
        
        // Reject the promise
        reject(error);
      });
    });
  } catch (error) {
    // Handle errors
    ongoingGenerations[key] = {
      ...ongoingGenerations[key],
      status: 'error',
      error: error.message,
      endTime: Date.now()
    };
    
    // Save to localStorage
    saveOngoingGenerations();
    
    // Re-throw the error
    throw error;
  }
};

/**
 * Get the status of a generation
 * @param {string} projectId - The project ID
 * @param {string} agentId - The agent ID
 * @param {number} messageId - The message ID
 * @returns {Object|null} The generation status or null if not found
 */
export const getGenerationStatus = (projectId, agentId, messageId) => {
  const key = `${projectId || 'default'}-${agentId}-${messageId}`;
  return ongoingGenerations[key] || null;
};

/**
 * Get all ongoing generations for a project-agent combination
 * @param {string} projectId - The project ID
 * @param {string} agentId - The agent ID
 * @returns {Array} Array of generation statuses
 */
export const getOngoingGenerations = (projectId, agentId) => {
  const prefix = `${projectId || 'default'}-${agentId}-`;
  return Object.keys(ongoingGenerations)
    .filter(key => key.startsWith(prefix))
    .map(key => ongoingGenerations[key]);
};

/**
 * Check if there are any ongoing generations for a project-agent combination
 * @param {string} projectId - The project ID
 * @param {string} agentId - The agent ID
 * @returns {boolean} True if there are ongoing generations
 */
export const hasOngoingGenerations = (projectId, agentId) => {
  const generations = getOngoingGenerations(projectId, agentId);
  return generations.some(gen => gen.status === 'generating');
};

/**
 * Cancel a generation
 * @param {string} projectId - The project ID
 * @param {string} agentId - The agent ID
 * @param {number} messageId - The message ID
 * @returns {boolean} True if the generation was canceled
 */
export const cancelGeneration = (projectId, agentId, messageId) => {
  const key = `${projectId || 'default'}-${agentId}-${messageId}`;
  if (ongoingGenerations[key]) {
    ongoingGenerations[key].status = 'canceled';
    ongoingGenerations[key].endTime = Date.now();
    saveOngoingGenerations();
    return true;
  }
  return false;
};

/**
 * Clean up completed generations
 */
export const cleanupCompletedGenerations = () => {
  const now = Date.now();
  let changed = false;
  
  Object.keys(ongoingGenerations).forEach(key => {
    const generation = ongoingGenerations[key];
    
    // Remove completed generations older than 5 minutes
    if (
      (generation.status === 'complete' || generation.status === 'error' || generation.status === 'canceled') &&
      generation.endTime &&
      now - generation.endTime > 5 * 60 * 1000
    ) {
      delete ongoingGenerations[key];
      changed = true;
    }
    
    // Remove stale generating statuses (older than 30 minutes)
    if (
      generation.status === 'generating' &&
      now - generation.startTime > 30 * 60 * 1000
    ) {
      delete ongoingGenerations[key];
      changed = true;
    }
  });
  
  if (changed) {
    saveOngoingGenerations();
  }
};

// Clean up completed generations periodically
if (isBrowser) {
  setInterval(cleanupCompletedGenerations, 5 * 60 * 1000);
}
