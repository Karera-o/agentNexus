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
 * Get the active project file path
 * @returns {string} - Path to the active project file
 */
function getActiveProjectFilePath() {
  // Store the active-project.json file in the Agents directory
  return resolveHomePath('~/Documents/Personal/Agents/active-project.json');
}

/**
 * Save active project to a JSON file
 * @param {string} filePath - Path to save the active project file
 * @param {Object} project - Active project object
 */
function saveActiveProjectToFile(filePath, project) {
  const dirPath = path.dirname(filePath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(project, null, 2));
}

/**
 * Load active project from a JSON file
 * @param {string} filePath - Path to the active project file
 * @returns {Object|null} - Active project object or null
 */
function loadActiveProjectFromFile(filePath) {
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  }
  return null;
}

/**
 * Handle GET requests to fetch active project
 */
export async function GET() {
  try {
    const filePath = getActiveProjectFilePath();
    const activeProject = loadActiveProjectFromFile(filePath);
    return NextResponse.json({ activeProject });
  } catch (error) {
    console.error('Error fetching active project:', error);
    return NextResponse.json({ error: 'Failed to fetch active project' }, { status: 500 });
  }
}

/**
 * Handle POST requests to save active project
 */
export async function POST(request) {
  try {
    const { activeProject } = await request.json();
    
    // Ensure the project storage path exists
    if (activeProject && activeProject.storagePath) {
      const storagePath = resolveHomePath(activeProject.storagePath);
      if (!fs.existsSync(storagePath)) {
        fs.mkdirSync(storagePath, { recursive: true });
      }
    }
    
    const filePath = getActiveProjectFilePath();
    saveActiveProjectToFile(filePath, activeProject);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving active project:', error);
    return NextResponse.json({ error: 'Failed to save active project' }, { status: 500 });
  }
}
