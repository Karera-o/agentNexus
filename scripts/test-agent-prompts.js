/**
 * Test script to verify that agent prompts can be loaded
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

// Convert exec to a Promise-based function
const execPromise = util.promisify(exec);

// Map agent IDs to their corresponding PDF files
const agentPdfMap = {
  'requirements': 'Requirements_Analyst.pdf',
  'documentor': 'Documentation_Agent.pdf',
  'system': 'System_Designer.pdf',
  'database': 'Database_Designer.pdf',
  'ui': 'UI_Advisor.pdf',
};

// Test function to extract text from a PDF file
async function testExtractPdf(pdfFileName) {
  try {
    // Path to the PDF file
    const pdfFilePath = path.join(__dirname, '..', 'Agents Config', pdfFileName);
    
    // Check if the file exists
    if (!fs.existsSync(pdfFilePath)) {
      console.error(`File not found: ${pdfFilePath}`);
      return null;
    }
    
    // Use pdftotext to extract text from the PDF
    try {
      const { stdout } = await execPromise(`pdftotext "${pdfFilePath}" - | head -n 20`);
      return stdout;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      return null;
    }
  } catch (error) {
    console.error('Error in testExtractPdf:', error);
    return null;
  }
}

// Main function
async function main() {
  console.log('Testing agent prompt extraction...');
  
  // Test each agent
  for (const [agentId, pdfFileName] of Object.entries(agentPdfMap)) {
    console.log(`\nTesting ${agentId} (${pdfFileName}):`);
    
    const text = await testExtractPdf(pdfFileName);
    if (text) {
      console.log('Successfully extracted text:');
      console.log('-----------------------------------');
      console.log(text);
      console.log('-----------------------------------');
    } else {
      console.log('Failed to extract text.');
    }
  }
  
  console.log('\nTest complete!');
}

// Run the main function
main().catch(error => {
  console.error('Error in main function:', error);
  process.exit(1);
});
