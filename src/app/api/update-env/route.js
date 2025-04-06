import { promises as fs } from 'fs';
import path from 'path';

/**
 * API route to update the .env file with new API keys
 * This is a server-side function that can directly modify the .env file
 */
export async function POST(request) {
  try {
    // Parse the request body
    const { apiKeys } = await request.json();

    // Validate the request
    if (!apiKeys || typeof apiKeys !== 'object') {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid request: apiKeys object is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get the path to the .env file
    const envFilePath = path.join(process.cwd(), '.env');

    // Read the current .env file
    let envContent;
    try {
      envContent = await fs.readFile(envFilePath, 'utf8');
    } catch (error) {
      console.error('Error reading .env file:', error);
      return new Response(
        JSON.stringify({ success: false, message: 'Error reading .env file' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update the .env file content with new API keys
    const updatedContent = updateEnvContent(envContent, apiKeys);

    // Write the updated content back to the .env file
    try {
      await fs.writeFile(envFilePath, updatedContent, 'utf8');
    } catch (error) {
      console.error('Error writing to .env file:', error);
      return new Response(
        JSON.stringify({ success: false, message: 'Error writing to .env file' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'API keys updated successfully in .env file',
        updatedKeys: Object.keys(apiKeys)
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error updating .env file:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Server error updating .env file' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Update the .env file content with new API keys
 * @param {string} content - Current content of the .env file
 * @param {Object} apiKeys - Object containing API keys to update
 * @returns {string} - Updated content for the .env file
 */
function updateEnvContent(content, apiKeys) {
  // Split the content into lines
  const lines = content.split('\n');
  const updatedLines = [...lines];
  const updatedKeys = new Set();

  // Process each API key
  Object.entries(apiKeys).forEach(([provider, value]) => {
    // Skip empty values
    if (!value) return;

    // Special case for Ollama host
    const envKey = provider === 'ollama_host'
      ? 'NEXT_PUBLIC_OLLAMA_HOST'
      : `NEXT_PUBLIC_${provider.toUpperCase()}_API_KEY`;

    // Look for existing key in the file
    const keyIndex = lines.findIndex(line =>
      line.trim().startsWith(envKey + '=') ||
      line.trim() === envKey + '='
    );

    // If key exists, update it
    if (keyIndex !== -1) {
      updatedLines[keyIndex] = `${envKey}=${value}`;
      updatedKeys.add(provider);
    } else {
      // If key doesn't exist, add it to the end of the file
      updatedLines.push(`${envKey}=${value}`);
      updatedKeys.add(provider);
    }
  });

  // Return the updated content
  return updatedLines.join('\n');
}
