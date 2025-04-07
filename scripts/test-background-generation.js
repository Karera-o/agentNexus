/**
 * Test script to verify that text generation continues in the background
 */

// Simulate the chat generation manager
const ongoingGenerations = {};
const isBrowser = typeof window !== 'undefined';

// Simulate starting a generation
const startGeneration = async (params) => {
  const { projectId, agentId, messageId, onUpdate } = params;
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
  
  console.log(`Starting generation for ${key}`);
  
  // Simulate streaming updates
  let fullText = '';
  const words = [
    'This', 'is', 'a', 'test', 'of', 'background', 'generation.',
    'The', 'text', 'should', 'continue', 'to', 'be', 'generated',
    'even', 'when', 'the', 'user', 'switches', 'to', 'another',
    'project', 'or', 'chat.', 'When', 'the', 'user', 'returns',
    'to', 'this', 'chat,', 'they', 'should', 'see', 'the',
    'complete', 'text.'
  ];
  
  // Return a promise that resolves when generation is complete
  return new Promise((resolve) => {
    let wordIndex = 0;
    
    const interval = setInterval(() => {
      if (wordIndex < words.length) {
        fullText += ' ' + words[wordIndex];
        ongoingGenerations[key].content = fullText.trim();
        ongoingGenerations[key].lastUpdateTime = Date.now();
        
        // Call the update callback
        if (onUpdate) {
          onUpdate(fullText.trim());
        }
        
        wordIndex++;
      } else {
        // Generation complete
        ongoingGenerations[key].status = 'complete';
        ongoingGenerations[key].endTime = Date.now();
        clearInterval(interval);
        resolve(fullText.trim());
      }
    }, 500);
  });
};

// Simulate switching between projects
const simulateProjectSwitch = async () => {
  console.log('Test: Simulating background generation while switching projects');
  console.log('-------------------------------------------------------');
  
  // Start a generation for project1-requirements
  const project1Generation = startGeneration({
    projectId: 'project1',
    agentId: 'requirements',
    messageId: Date.now(),
    onUpdate: (text) => {
      console.log(`[Project 1] Update: ${text}`);
    }
  });
  
  // Wait 1 second
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate switching to project2
  console.log('\nSwitching to Project 2...');
  
  // Start a generation for project2-requirements
  const project2Generation = startGeneration({
    projectId: 'project2',
    agentId: 'requirements',
    messageId: Date.now(),
    onUpdate: (text) => {
      console.log(`[Project 2] Update: ${text}`);
    }
  });
  
  // Wait for both generations to complete
  const [project1Result, project2Result] = await Promise.all([
    project1Generation,
    project2Generation
  ]);
  
  console.log('\nBoth generations completed:');
  console.log(`Project 1 result: ${project1Result}`);
  console.log(`Project 2 result: ${project2Result}`);
  console.log('\nTest complete!');
};

// Run the test
simulateProjectSwitch();
