/**
 * Test script to verify OpenRouter model fetching
 */

// Mock environment
const process = {
  env: {
    NEXT_PUBLIC_OPENROUTER_API_KEY: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || ''
  }
};

// Mock fetch
global.fetch = async (url, options) => {
  console.log(`Fetching ${url}...`);
  
  // Simulate a delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return a mock response
  return {
    ok: true,
    status: 200,
    json: async () => ({
      data: [
        { id: 'openai/gpt-3.5-turbo', context_length: 16385, pricing: { prompt: 0.0005, completion: 0.0015 } },
        { id: 'openai/gpt-4', context_length: 8192, pricing: { prompt: 0.01, completion: 0.03 } },
        { id: 'anthropic/claude-3-opus-20240229', context_length: 200000, pricing: { prompt: 0.015, completion: 0.075 } },
        { id: 'anthropic/claude-3-sonnet-20240229', context_length: 200000, pricing: { prompt: 0.003, completion: 0.015 } },
        { id: 'anthropic/claude-3-haiku-20240307', context_length: 200000, pricing: { prompt: 0.00025, completion: 0.00125 } },
      ]
    })
  };
};

// Mock AbortController
global.AbortController = class AbortController {
  constructor() {
    this.signal = { aborted: false };
  }
  
  abort() {
    this.signal.aborted = true;
  }
};

// Mock AbortSignal
global.AbortSignal = {
  timeout: (ms) => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms);
    return controller.signal;
  }
};

// Import the OpenRouterProvider class
const { OpenRouterProvider } = require('../src/services/providers/openrouter-provider');

// Test function
async function testOpenRouterFetch() {
  console.log('Testing OpenRouter model fetching...');
  
  // Create a provider instance
  const provider = new OpenRouterProvider({
    providers: {
      openrouter: {
        apiKey: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || 'test-key',
        baseUrl: 'https://openrouter.ai/api/v1'
      }
    }
  });
  
  // Test 1: First fetch should get models from API
  console.log('\nTest 1: First fetch');
  const models1 = await provider.listModels();
  console.log(`Fetched ${models1.length} models`);
  
  // Test 2: Second fetch should use cached models
  console.log('\nTest 2: Second fetch (should use cache)');
  const models2 = await provider.listModels();
  console.log(`Fetched ${models2.length} models`);
  
  // Test 3: Simulate multiple simultaneous fetches
  console.log('\nTest 3: Multiple simultaneous fetches');
  provider.cachedModels = null; // Clear cache
  provider.lastModelFetchTime = 0; // Reset last fetch time
  
  // Start 3 fetches at the same time
  const promises = [
    provider.listModels().then(models => console.log('Fetch 1 completed:', models.length, 'models')),
    provider.listModels().then(models => console.log('Fetch 2 completed:', models.length, 'models')),
    provider.listModels().then(models => console.log('Fetch 3 completed:', models.length, 'models'))
  ];
  
  await Promise.all(promises);
  
  console.log('\nAll tests completed!');
}

// Run the test
testOpenRouterFetch().catch(error => {
  console.error('Test failed:', error);
});
