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
 * Create a directory recursively
 * @param {string} dirPath - Directory path to create
 */
function ensureDirectoryExists(dirPath) {
  const absolutePath = resolveHomePath(dirPath);
  if (!fs.existsSync(absolutePath)) {
    fs.mkdirSync(absolutePath, { recursive: true });
  }
}

/**
 * Save projects to a JSON file in the specified directory
 * @param {string} projectsPath - Path to save the projects file
 * @param {Array} projects - Array of project objects
 */
function saveProjectsToFile(projectsPath, projects) {
  const dirPath = path.dirname(projectsPath);
  ensureDirectoryExists(dirPath);
  fs.writeFileSync(projectsPath, JSON.stringify(projects, null, 2));
}

/**
 * Load projects from a JSON file
 * @param {string} projectsPath - Path to the projects file
 * @returns {Array} - Array of project objects
 */
function loadProjectsFromFile(projectsPath) {
  if (fs.existsSync(projectsPath)) {
    const data = fs.readFileSync(projectsPath, 'utf8');
    return JSON.parse(data);
  }
  return [];
}

/**
 * Get the projects file path
 * @returns {string} - Path to the projects file
 */
function getProjectsFilePath() {
  // Store the projects.json file in the Agents directory
  return resolveHomePath('~/Documents/Personal/Agents/projects.json');
}

/**
 * Handle GET requests to fetch projects
 */
export async function GET() {
  try {
    const projectsPath = getProjectsFilePath();
    const projects = loadProjectsFromFile(projectsPath);
    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

/**
 * Handle POST requests to save projects
 */
export async function POST(request) {
  try {
    const { projects } = await request.json();
    
    // Ensure each project has a valid storage path
    projects.forEach(project => {
      if (project.storagePath) {
        ensureDirectoryExists(project.storagePath);
      }
    });
    
    const projectsPath = getProjectsFilePath();
    saveProjectsToFile(projectsPath, projects);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving projects:', error);
    return NextResponse.json({ error: 'Failed to save projects' }, { status: 500 });
  }
}
