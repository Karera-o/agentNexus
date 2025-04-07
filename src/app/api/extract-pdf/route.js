import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

// Convert exec to a Promise-based function
const execPromise = util.promisify(exec);

// Map of agent PDF content (for development/testing)
const agentPdfContent = {
  'Requirements_Analyst.pdf': `You are ReqAI, an expert requirements analyst specializing in extracting,
organizing, and clarifying software requirements from unstructured information.
Your primary responsibility is to transform vague, disorganized, or incomplete
information into a well-structured Notion workspace that serves as a
comprehensive software requirements repository.`,

  'Documentation_Agent.pdf': `You are DocAI, an expert technical documentation specialist focusing on creating
comprehensive project documentation with clear diagrams and visualizations.
Your primary responsibility is to analyze requirements, system architecture, and
database design to produce accessible documentation that helps stakeholders
understand the system.`,

  'System_Designer.pdf': `You are ArchitectAI, an expert software architect specializing in designing robust,
scalable, and efficient system architectures. Your primary responsibility is to
analyze software requirements and produce comprehensive architecture designs
that align with business needs while optimizing for security, scalability, and
maintainability.`,

  'Database_Designer.pdf': `You are DbDesignAI, an expert database architect specializing in designing robust,
scalable, and efficient database schemas. Your primary responsibility is to analyze
application requirements and produce optimal database designs that ensure data
integrity, performance, and maintainability while supporting business needs.`,

  'UI_Advisor.pdf': `You are an elite UI design advisor with deep expertise in modern web design
principles, aesthetics, and technical implementation. Your role is to provide
specific, actionable design recommendations based on the user's requirements.`
};

/**
 * API route to extract text from a PDF file
 * @param {Request} request - The request object
 * @returns {Promise<NextResponse>} The response object
 */
export async function GET(request) {
  try {
    // Get the PDF file name from the query parameters
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('file');

    if (!fileName) {
      return NextResponse.json({ error: 'No file name provided' }, { status: 400 });
    }

    // First, check if we have the content in our map (for development/testing)
    if (agentPdfContent[fileName]) {
      return NextResponse.json({ text: agentPdfContent[fileName] }, { status: 200 });
    }

    // Try to find the file in the public directory first
    const publicPdfPath = path.join(process.cwd(), 'public', 'Agents Config', fileName);
    const sourcePdfPath = path.join(process.cwd(), 'Agents Config', fileName);

    // Determine which path to use
    let pdfFilePath;
    try {
      await fs.access(publicPdfPath);
      pdfFilePath = publicPdfPath;
    } catch (error) {
      try {
        await fs.access(sourcePdfPath);
        pdfFilePath = sourcePdfPath;
      } catch (error) {
        return NextResponse.json({ error: `File not found: ${fileName}` }, { status: 404 });
      }
    }

    // Use pdftotext to extract text from the PDF
    try {
      const { stdout } = await execPromise(`pdftotext "${pdfFilePath}" -`);
      return NextResponse.json({ text: stdout }, { status: 200 });
    } catch (error) {
      console.error('Error extracting text from PDF:', error);

      // Fallback to our hardcoded content if pdftotext fails
      if (agentPdfContent[fileName]) {
        console.log('Falling back to hardcoded content for', fileName);
        return NextResponse.json({ text: agentPdfContent[fileName] }, { status: 200 });
      }

      // If no fallback is available, return an error
      return NextResponse.json({
        error: 'Failed to extract text from PDF',
        message: error.message
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in extract-pdf API route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
