/**
 * Test script to verify automatic OpenRouter model initialization
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

// Mock settings with OpenRouter models
const mockSettings = {
  providers: {
    openrouter: {
      apiKey: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || 'test-key',
      baseUrl: 'https://openrouter.ai/api/v1',
      models: [
        { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and efficient model' },
        { id: 'openai/gpt-4', name: 'GPT-4', description: 'Powerful model for complex tasks' },
        { id: 'anthropic/claude-3-opus-20240229', name: 'Claude 3 Opus', description: 'Most powerful Claude model' },
        { id: 'anthropic/claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', description: 'Balanced Claude model' },
        { id: 'anthropic/claude-3-haiku-20240307', name: 'Claude 3 Haiku', description: 'Fast Claude model' }
      ]
    }
  }
};

// Save mock settings to localStorage
localStorage.setItem('settings', JSON.stringify(mockSettings));

// Mock React hooks
const useState = (initialValue) => {
  let value = initialValue;
  const setValue = (newValue) => {
    if (typeof newValue === 'function') {
      value = newValue(value);
    } else {
      value = newValue;
    }
    console.log('State updated:', value);
  };
  return [value, setValue];
};

const useCallback = (fn, deps) => fn;
const useRef = (initialValue) => ({ current: initialValue });
const useEffect = (fn, deps) => {
  console.log('useEffect called with dependencies:', deps);
  fn();
};

// Mock the ModelContext initialization
const initializeOpenRouterModels = () => {
  console.log('Initializing OpenRouter models from settings...');
  
  // Get settings from localStorage
  const settings = JSON.parse(localStorage.getItem('settings'));
  
  if (settings?.providers?.openrouter?.models?.length > 0) {
    console.log(`Found ${settings.providers.openrouter.models.length} OpenRouter models in settings`);
    
    // Convert models from settings format to provider format
    const openRouterModels = settings.providers.openrouter.models.map(model => ({
      name: model.id,
      displayName: model.name,
      description: model.description || ''
    }));
    
    console.log('Converted models:', openRouterModels);
    return true;
  }
  
  console.log('No OpenRouter models found in settings');
  return false;
};

// Test function
async function testOpenRouterAutoInit() {
  console.log('Testing automatic OpenRouter model initialization...');
  
  // Test 1: Initialize models from settings
  console.log('\nTest 1: Initialize models from settings');
  const initialized = initializeOpenRouterModels();
  console.log(`Initialization ${initialized ? 'successful' : 'failed'}`);
  
  // Test 2: Simulate component mount with useEffect
  console.log('\nTest 2: Simulate component mount with useEffect');
  const [availableModels, setAvailableModels] = useState({});
  
  useEffect(() => {
    // Check if we have OpenRouter models in settings but not in availableModels
    const settings = JSON.parse(localStorage.getItem('settings'));
    
    if (settings?.providers?.openrouter?.models?.length > 0 && 
        (!availableModels.openrouter || availableModels.openrouter.length === 0)) {
      console.log('OpenRouter models found in settings but not in availableModels, initializing...');
      
      // Convert models from settings format to provider format
      const openRouterModels = settings.providers.openrouter.models.map(model => ({
        name: model.id,
        displayName: model.name,
        description: model.description || ''
      }));
      
      // Update availableModels with OpenRouter models
      setAvailableModels(prev => ({
        ...prev,
        openrouter: openRouterModels
      }));
    }
  }, [availableModels]);
  
  console.log('\nAll tests completed!');
}

// Run the test
testOpenRouterAutoInit().catch(error => {
  console.error('Test failed:', error);
});
