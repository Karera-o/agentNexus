"use client";

// No need to import path in client-side code

/**
 * Get the system prompt for a specific agent
 * @param {string} agentId - The ID of the agent
 * @returns {Promise<string>} The system prompt for the agent
 */
export const getAgentSystemPrompt = async (agentId) => {
  try {
    // Map agent IDs to their corresponding PDF files
    const agentPdfMap = {
      'requirements': 'Requirements_Analyst.pdf',
      'documentor': 'Documentation_Agent.pdf',
      'system': 'System_Designer.pdf',
      'database': 'Database_Designer.pdf',
      'ui': 'UI_Advisor.pdf',
    };

    // Get the PDF file name for the agent
    const pdfFileName = agentPdfMap[agentId];
    if (!pdfFileName) {
      // Return a default prompt if no specific PDF is found
      return getDefaultSystemPrompt(agentId);
    }

    // Call the API route to extract text from the PDF
    try {
      const response = await fetch(`/api/extract-pdf?file=${encodeURIComponent(pdfFileName)}`);

      if (!response.ok) {
        console.warn(`Failed to extract text from PDF for agent ${agentId}: ${response.statusText}`);
        return getDefaultSystemPrompt(agentId);
      }

      const data = await response.json();
      if (data.text) {
        console.log(`Successfully loaded system prompt for ${agentId}`);
        return data.text;
      } else {
        console.warn(`No text content found in PDF for agent ${agentId}`);
        return getDefaultSystemPrompt(agentId);
      }
    } catch (error) {
      console.warn(`Error extracting text from PDF for agent ${agentId}:`, error);
      return getDefaultSystemPrompt(agentId);
    }
  } catch (error) {
    console.error('Error getting agent system prompt:', error);
    return getDefaultSystemPrompt(agentId);
  }
};

/**
 * Get the default system prompt for an agent
 * @param {string} agentId - The ID of the agent
 * @returns {string} The default system prompt
 */
export const getDefaultSystemPrompt = (agentId) => {
  const agentPrompts = {
    'requirements': `You are a Requirements Analyst, an AI assistant specialized in helping with software development tasks.
    Your expertise is in extracting, organizing, and clarifying software requirements from unstructured information.
    You help transform vague, disorganized, or incomplete information into well-structured requirements.`,

    'documentor': `You are a Software Documentor, an AI assistant specialized in helping with software development tasks.
    Your expertise is in creating comprehensive project documentation with clear diagrams and visualizations.
    You analyze requirements, system architecture, and database design to produce accessible documentation.`,

    'system': `You are a System Designer, an AI assistant specialized in helping with software development tasks.
    Your expertise is in designing robust, scalable, and efficient system architectures.
    You analyze software requirements and produce comprehensive architecture designs that align with business needs.`,

    'database': `You are a DB Designer, an AI assistant specialized in helping with software development tasks.
    Your expertise is in designing robust, scalable, and efficient database schemas.
    You analyze application requirements and produce optimal database designs that ensure data integrity and performance.`,

    'ui': `You are a UI Architect, an AI assistant specialized in helping with software development tasks.
    Your expertise is in providing expert UI design recommendations and guidance.
    You provide specific, actionable design recommendations based on the user's requirements.`,

    'research': `You are a Research Assistant, an AI assistant specialized in helping with research tasks.
    Your expertise is in finding, analyzing, and synthesizing information from various sources.
    You help users conduct research, analyze data, and draw conclusions.`
  };

  return agentPrompts[agentId] || `You are an AI assistant specialized in helping with software development tasks.`;
};

/**
 * Cache for agent system prompts to avoid repeated API calls
 */
const promptCache = {};

/**
 * Get the system prompt for an agent with caching
 * @param {string} agentId - The ID of the agent
 * @returns {Promise<string>} The system prompt for the agent
 */
export const getCachedAgentSystemPrompt = async (agentId) => {
  // Return from cache if available
  if (promptCache[agentId]) {
    return promptCache[agentId];
  }

  // Get the prompt and cache it
  const prompt = await getAgentSystemPrompt(agentId);
  promptCache[agentId] = prompt;
  return prompt;
};
