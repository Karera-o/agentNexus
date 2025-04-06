// Simple script to test if environment variables are being loaded correctly
require('dotenv').config();

console.log('Testing environment variables...');

// Check if the OpenRouter API key is set
const openRouterApiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
console.log(`NEXT_PUBLIC_OPENROUTER_API_KEY: ${openRouterApiKey ? 'Present (length: ' + openRouterApiKey.length + ')' : 'Not set'}`);

// Check other API keys
const anthropicApiKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
console.log(`NEXT_PUBLIC_ANTHROPIC_API_KEY: ${anthropicApiKey ? 'Present (length: ' + anthropicApiKey.length + ')' : 'Not set'}`);

const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
console.log(`NEXT_PUBLIC_GEMINI_API_KEY: ${geminiApiKey ? 'Present (length: ' + geminiApiKey.length + ')' : 'Not set'}`);

// Check if Next.js is properly exposing the environment variables
console.log('\nChecking Next.js environment variables:');
console.log('process.env.NEXT_PUBLIC_OPENROUTER_API_KEY:', process.env.NEXT_PUBLIC_OPENROUTER_API_KEY ? 'Set' : 'Not set');

// Print all environment variables that start with NEXT_PUBLIC_
console.log('\nAll NEXT_PUBLIC_ environment variables:');
Object.keys(process.env)
  .filter(key => key.startsWith('NEXT_PUBLIC_'))
  .forEach(key => {
    console.log(`${key}: ${process.env[key] ? 'Present (length: ' + process.env[key].length + ')' : 'Not set'}`);
  });

console.log('\nTest complete.');
