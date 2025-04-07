/**
 * Test script to verify OpenRouter integration
 */

// Mock environment
const process = {
  env: {
    NEXT_PUBLIC_OPENROUTER_API_KEY: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || ''
  }
};

// Mock localStorage
const localStorage = {
  _data: {},
  getItem: function(key) {
    return this._data[key] || null;
  },
  setItem: function(key, value) {
    this._data[key] = value;
    console.log(`localStorage.setItem('${key}', ${value.length > 100 ? value.substring(0, 100) + '...' : value})`);
  },
  removeItem: function(key) {
    delete this._data[key];
  },
  clear: function() {
    this._data = {};
  }
};

// Mock settings
const settings = {
  providers: {
    openrouter: {
      apiKey: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || 'test-key',
      baseUrl: 'https://openrouter.ai/api/v1',
      models: []
    }
  }
};

// Mock fetch
global.fetch = async (url, options) => {
  console.log(`Fetching ${url}...`);
  
  // Simulate a delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
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
async function testOpenRouterIntegration() {
  console.log('Testing OpenRouter integration...');
  
  // Create a provider instance
  const provider = new OpenRouterProvider(settings);
  
  // Test 1: Fetch models from API
  console.log('\nTest 1: Fetch models from API');
  const models = await provider.listModels();
  console.log(`Fetched ${models.length} models from API`);
  
  // Test 2: Convert models to settings format
  console.log('\nTest 2: Convert models to settings format');
  const settingsModels = models.map(model => ({
    id: model.name,
    name: model.displayName || model.name,
    description: model.description || ''
  }));
  console.log(`Converted ${settingsModels.length} models to settings format`);
  
  // Test 3: Update settings with models
  console.log('\nTest 3: Update settings with models');
  settings.providers.openrouter.models = settingsModels;
  console.log(`Updated settings with ${settings.providers.openrouter.models.length} models`);
  
  // Test 4: Save settings to localStorage
  console.log('\nTest 4: Save settings to localStorage');
  localStorage.setItem('settings', JSON.stringify(settings));
  
  // Test 5: Load settings from localStorage
  console.log('\nTest 5: Load settings from localStorage');
  const loadedSettings = JSON.parse(localStorage.getItem('settings'));
  console.log(`Loaded ${loadedSettings.providers.openrouter.models.length} models from localStorage`);
  
  // Test 6: Convert settings models back to provider format
  console.log('\nTest 6: Convert settings models back to provider format');
  const providerModels = loadedSettings.providers.openrouter.models.map(model => ({
    name: model.id,
    displayName: model.name,
    description: model.description || ''
  }));
  console.log(`Converted ${providerModels.length} models back to provider format`);
  
  console.log('\nAll tests completed!');
}

// Run the test
testOpenRouterIntegration().catch(error => {
  console.error('Test failed:', error);
});
