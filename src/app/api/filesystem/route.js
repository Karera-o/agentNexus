import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { homedir } from 'os';

/**
 * Get the absolute path from a path that might contain ~
 * @param {string} filePath - Path that might contain ~
 * @returns {string} - Absolute path
 */
function resolveHomePath(filePath) {
  if (filePath.startsWith('~/')) {
    return path.join(homedir(), filePath.slice(2));
  }
  return filePath;
}

/**
 * Handle POST requests for file system operations
 */
export async function POST(request) {
  try {
    const { operation, path: filePath, filename, content } = await request.json();
    const resolvedPath = resolveHomePath(filePath);

    switch (operation) {
      case 'directoryExists':
        return NextResponse.json({ 
          exists: fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory() 
        });

      case 'createDirectory':
        if (!fs.existsSync(resolvedPath)) {
          fs.mkdirSync(resolvedPath, { recursive: true });
        }
        return NextResponse.json({ success: true });

      case 'saveFile':
        const fullPath = path.join(resolvedPath, filename);
        const dirPath = path.dirname(fullPath);
        
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
        
        fs.writeFileSync(fullPath, content);
        return NextResponse.json({ success: true });

      case 'loadFile':
        const filePath = path.join(resolvedPath, filename);
        if (fs.existsSync(filePath)) {
          const data = fs.readFileSync(filePath, 'utf8');
          return NextResponse.json({ content: data });
        }
        return NextResponse.json({ error: 'File not found' }, { status: 404 });

      case 'listFiles':
        if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory()) {
          const files = fs.readdirSync(resolvedPath);
          return NextResponse.json({ files });
        }
        return NextResponse.json({ error: 'Directory not found' }, { status: 404 });

      default:
        return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in file system operation:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
