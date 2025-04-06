// Simple script to test how environment variables are accessed in client-side code
console.log('Testing environment variables in client-side code...');

// Check if the OpenRouter API key is set
console.log('Direct access:');
console.log(`process.env.NEXT_PUBLIC_OPENROUTER_API_KEY: ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY ? 'Present (length: ' + process.env.NEXT_PUBLIC_OPENROUTER_API_KEY.length + ')' : 'Not set'}`);

// Print all environment variables that start with NEXT_PUBLIC_
console.log('\nAll NEXT_PUBLIC_ environment variables:');
Object.keys(process.env)
  .filter(key => key.startsWith('NEXT_PUBLIC_'))
  .forEach(key => {
    console.log(`${key}: ${process.env[key] ? 'Present (length: ' + process.env[key].length + ')' : 'Not set'}`);
  });
