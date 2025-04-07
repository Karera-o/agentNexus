/**
 * Test script to verify that model selection works correctly with project-agent combinations
 */

// Simulate the model context
const agentModels = {};

// Helper functions
function setModelForAgent(projectId, agentId, provider, model) {
  const key = projectId ? `${projectId}-${agentId}` : `default-${agentId}`;
  agentModels[key] = { provider, model };
  console.log(`Set model for ${key}: ${provider}/${model}`);
}

function getModelForAgent(projectId, agentId) {
  const key = projectId ? `${projectId}-${agentId}` : `default-${agentId}`;
  
  // Try to get the model for this specific project-agent combination
  if (agentModels[key]) {
    return agentModels[key];
  }
  
  // If not found, try to get the default model for this agent
  const defaultKey = `default-${agentId}`;
  if (agentModels[defaultKey]) {
    return agentModels[defaultKey];
  }
  
  // If still not found, return empty values
  return { provider: '', model: '' };
}

// Test scenarios
function runTests() {
  console.log('Running model selection tests...');
  console.log('--------------------------------');
  
  // Test 1: Set and get a model for a specific project-agent combination
  console.log('Test 1: Set and get a model for a specific project-agent combination');
  setModelForAgent('project1', 'requirements', 'anthropic', 'claude-3-haiku');
  console.log('Model for project1-requirements:', getModelForAgent('project1', 'requirements'));
  console.log();
  
  // Test 2: Set and get a model for a different project with the same agent
  console.log('Test 2: Set and get a model for a different project with the same agent');
  setModelForAgent('project2', 'requirements', 'openai', 'gpt-4');
  console.log('Model for project1-requirements:', getModelForAgent('project1', 'requirements'));
  console.log('Model for project2-requirements:', getModelForAgent('project2', 'requirements'));
  console.log();
  
  // Test 3: Set and get a default model for an agent
  console.log('Test 3: Set and get a default model for an agent');
  setModelForAgent(null, 'documentor', 'gemini', 'gemini-1.5-pro');
  console.log('Default model for documentor:', getModelForAgent(null, 'documentor'));
  console.log('Model for project1-documentor (should use default):', getModelForAgent('project1', 'documentor'));
  console.log();
  
  // Test 4: Override a default model for a specific project
  console.log('Test 4: Override a default model for a specific project');
  setModelForAgent('project1', 'documentor', 'ollama', 'llama3');
  console.log('Default model for documentor:', getModelForAgent(null, 'documentor'));
  console.log('Model for project1-documentor (should be overridden):', getModelForAgent('project1', 'documentor'));
  console.log('Model for project2-documentor (should use default):', getModelForAgent('project2', 'documentor'));
  console.log();
  
  // Test 5: Get a model for a non-existent project-agent combination
  console.log('Test 5: Get a model for a non-existent project-agent combination');
  console.log('Model for project3-system (should be empty):', getModelForAgent('project3', 'system'));
  console.log();
  
  // Print final state
  console.log('Final state of agentModels:');
  console.log(JSON.stringify(agentModels, null, 2));
}

// Run the tests
runTests();
