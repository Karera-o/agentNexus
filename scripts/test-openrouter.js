// Simple script to test the OpenRouter API

require('dotenv').config();

const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
console.log(`OpenRouter API Key: ${apiKey ? 'Present (length: ' + apiKey.length + ')' : 'Not set'}`);

async function testOpenRouter() {
  try {
    console.log('Testing OpenRouter API...');
    
    // Fetch models
    console.log('Fetching models...');
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Dev Agent App Test'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenRouter API Error (${response.status}): ${errorText}`);
      return;
    }
    
    const data = await response.json();
    console.log(`Successfully fetched ${data.data?.length || 0} models`);
    
    // Print model names
    if (data.data && data.data.length > 0) {
      console.log('\nAvailable models:');
      data.data.forEach(model => {
        console.log(`- ${model.id} (${model.name || 'No name'})`);
      });
    } else {
      console.log('No models found');
    }
    
    console.log('\nTest complete.');
  } catch (error) {
    console.error('Error testing OpenRouter API:', error);
  }
}

// Run the test
testOpenRouter();
