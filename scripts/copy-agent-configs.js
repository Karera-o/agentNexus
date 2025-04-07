/**
 * Script to copy agent configuration files to the public directory
 * This ensures they are available to the application at runtime
 */

const fs = require('fs');
const path = require('path');

// Source and destination directories
const sourceDir = path.join(__dirname, '..', 'Agents Config');
const destDir = path.join(__dirname, '..', 'public', 'Agents Config');

// Create the destination directory if it doesn't exist
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
  console.log(`Created directory: ${destDir}`);
}

// Copy all files from the source directory to the destination directory
try {
  const files = fs.readdirSync(sourceDir);
  
  files.forEach(file => {
    const sourcePath = path.join(sourceDir, file);
    const destPath = path.join(destDir, file);
    
    // Check if the source is a file (not a directory)
    if (fs.statSync(sourcePath).isFile()) {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`Copied: ${file}`);
    }
  });
  
  console.log('All agent configuration files copied successfully!');
} catch (error) {
  console.error('Error copying agent configuration files:', error);
  process.exit(1);
}
