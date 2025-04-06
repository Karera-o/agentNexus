"use client";

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

/**
 * A component that renders markdown content with proper formatting
 * @param {Object} props - Component props
 * @param {string} props.content - The markdown content to render
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.debug - Whether to show debug information
 * @returns {JSX.Element} - Rendered component
 */
const MarkdownRenderer = ({ content, className = '', debug = false }) => {
  // Preprocess content to improve formatting
  const preprocessContent = (text) => {
    if (!text) return '';

    let processed = text;

    // Add newlines before and after the content to ensure proper parsing
    processed = '\n' + processed + '\n';

    // Convert numbered lists with asterisks to proper markdown numbered lists
    // Example: "1. **Main Pages**" -> "1. **Main Pages**"
    processed = processed.replace(/^(\d+\.\s+)\*\*(.*?)\*\*/gm, '$1**$2**');

    // Keep bold formatting for section headers instead of converting to markdown headers
    // We'll only convert major section headers to h2, and keep others as bold text

    // Convert main section headers (ALL CAPS or very important sections)
    // Example: "**MAIN FEATURES**" -> "## MAIN FEATURES"
    processed = processed.replace(/^\s*\*\*([A-Z][A-Z\s]+[A-Z])\*\*\s*$/gm, '## $1');

    // Keep other bold headers as bold text (don't convert to markdown headers)
    // Example: "1. **Homepage (Landing Page)**" -> "1. **Homepage (Landing Page)**"

    // Convert numbered items with colons to bold text
    // Example: "1. Homepage:" -> "1. **Homepage:**"
    processed = processed.replace(/^(\s*\d+\.\s+)([^*\n]+):/gm, '$1**$2:**');

    // Ensure proper spacing between sections
    processed = processed.replace(/\n(#+\s)/g, '\n\n$1');

    // Convert bullet points with asterisks to proper markdown lists
    // Example: "* Hero Section" -> "- Hero Section"
    processed = processed.replace(/^\s*\*\s+(?!\*)/gm, '- ');

    // Convert ALL CAPS text to bold text instead of headers
    // Example: "MAIN FEATURES" -> "**MAIN FEATURES**"
    processed = processed.replace(/^\s*([A-Z][A-Z\s]+[A-Z])\s*$/gm, '**$1**');

    // Convert lines ending with colons followed by a list to bold text
    // Example: "Main Features:" followed by list items -> "**Main Features:**"
    processed = processed.replace(/^\s*([^\n:]+):\s*$(\n\s*[-*])/gm, '**$1:**$2');

    // Add emphasis to key terms with colons
    // Example: "Feature: Description" -> "**Feature:** Description"
    processed = processed.replace(/^\s*([^\n:]+):\s/gm, '**$1:** ');

    // Ensure lists have proper spacing
    processed = processed.replace(/(\n[\-*]\s[^\n]+)(\n[^\-*\n])/g, '$1\n$2');

    return processed;
  };

  const processedContent = preprocessContent(content);

  return (
    <div className={`markdown-renderer ${className}`}>
      {debug && (
        <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-md">
          <h3 className="text-sm font-bold mb-2">Debug: Original Content</h3>
          <pre className="text-xs overflow-auto whitespace-pre-wrap">{content}</pre>
          <h3 className="text-sm font-bold mt-4 mb-2">Debug: Processed Content</h3>
          <pre className="text-xs overflow-auto whitespace-pre-wrap">{processedContent}</pre>
        </div>
      )}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings
          h1: ({ node, ...props }) => <h1 className="text-2xl font-bold my-4" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-xl font-bold my-3" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-lg font-bold my-2" {...props} />,
          h4: ({ node, ...props }) => <h4 className="text-base font-bold my-2" {...props} />,
          h5: ({ node, ...props }) => <h5 className="text-sm font-bold my-1" {...props} />,
          h6: ({ node, ...props }) => <h6 className="text-xs font-bold my-1" {...props} />,

          // Paragraphs and text
          p: ({ node, ...props }) => <p className="my-2" {...props} />,
          strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
          em: ({ node, ...props }) => <em className="italic" {...props} />,

          // Lists
          ul: ({ node, ...props }) => <ul className="list-disc ml-6 my-2" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal ml-6 my-2" {...props} />,
          li: ({ node, ...props }) => <li className="my-1" {...props} />,

          // Links and images
          a: ({ node, ...props }) => (
            <a
              className="text-blue-500 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          img: ({ node, ...props }) => (
            <img
              className="max-w-full h-auto my-2 rounded"
              alt={props.alt || 'Image'}
              {...props}
            />
          ),

          // Code blocks
          code: ({ node, inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';

            return !inline ? (
              <div className="my-4 rounded-md overflow-hidden">
                <div className="bg-gray-800 text-gray-200 px-4 py-1 text-xs flex justify-between items-center">
                  <span>{language || 'code'}</span>
                  <button
                    className="text-gray-400 hover:text-white"
                    onClick={() => {
                      navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                    }}
                  >
                    Copy
                  </button>
                </div>
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={language}
                  PreTag="div"
                  className="rounded-b-md"
                  showLineNumbers={true}
                  wrapLines={true}
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-sm" {...props}>
                {children}
              </code>
            );
          },

          // Blockquotes
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 py-1 my-2 italic text-gray-700 dark:text-gray-300" {...props} />
          ),

          // Tables
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border border-gray-300 dark:border-gray-700" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => <thead className="bg-gray-100 dark:bg-gray-800" {...props} />,
          tbody: ({ node, ...props }) => <tbody className="divide-y divide-gray-300 dark:divide-gray-700" {...props} />,
          tr: ({ node, ...props }) => <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/50" {...props} />,
          th: ({ node, ...props }) => (
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-300" {...props} />
          ),
          td: ({ node, ...props }) => <td className="px-4 py-2 text-sm" {...props} />,

          // Horizontal rule
          hr: ({ node, ...props }) => <hr className="my-4 border-gray-300 dark:border-gray-700" {...props} />,
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
