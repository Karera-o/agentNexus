"use client";

import React, { useState, useRef, useEffect } from 'react';
import { FaRobot, FaUser, FaPaperPlane, FaSpinner, FaUpload, FaTrash, FaFlask } from 'react-icons/fa';
import { useModelContext } from '../context/ModelContext';
import { useSettings } from '../context/SettingsContext';
import { useProject } from '../context/ProjectContext';
import { joinPath, saveFile } from '../utils/fileSystem';
import ModelSelector from './ModelSelector';
import { startGeneration, getGenerationStatus, getOngoingGenerations, hasOngoingGenerations } from '../services/chatGenerationManager';
import { createProvider } from '../services/providers/provider-factory';

const ResearchChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [files, setFiles] = useState([]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const { getModelForAgent, setModelForAgent } = useModelContext();
  const { settings } = useSettings();
  const { activeProject } = useProject();

  // Helper function to migrate timestamps from strings to Date objects
  const migrateTimestamps = (messages) => {
    return messages.map(msg => {
      // If timestamp is a string, convert it to a Date object
      if (typeof msg.timestamp === 'string') {
        return { ...msg, timestamp: new Date(msg.timestamp) };
      }
      return msg;
    });
  };

  // Load chat history from localStorage or project storage
  useEffect(() => {
    // Create a unique key for this chat history that includes the project ID
    const historyKey = activeProject ? `chatHistory-${activeProject.id}-research` : `chatHistory-research`;

    const savedMessages = localStorage.getItem(historyKey);
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
          // Migrate any string timestamps to Date objects
          const migratedMessages = migrateTimestamps(parsedMessages);
          setMessages(migratedMessages);
        }
      } catch (error) {
        console.error('Error parsing saved messages:', error);
      }
    }

    // TODO: In the future, we'll load chat history from the project storage path
    // if (activeProject?.storagePath) {
    //   // Load from file system when implemented
    // }
  }, [activeProject]);

  // Save chat history to localStorage and project storage
  useEffect(() => {
    if (messages.length > 0) {
      // Create a unique key for this chat history that includes the project ID
      const historyKey = activeProject ? `chatHistory-${activeProject.id}-research` : `chatHistory-research`;

      // Save to localStorage
      localStorage.setItem(historyKey, JSON.stringify(messages));

      // Save to project storage path if available
      if (activeProject?.storagePath) {
        // Create a formatted version of the chat history for saving to a file
        const formattedHistory = messages.map(msg => {
          // Handle different timestamp formats
          let time;
          if (msg.timestamp instanceof Date) {
            time = msg.timestamp.toLocaleString();
          } else if (typeof msg.timestamp === 'string') {
            time = new Date(msg.timestamp).toLocaleString();
          } else {
            time = new Date().toLocaleString(); // Fallback to current time
          }

          const role = msg.role === 'user' ? 'You' : 'Research Assistant';
          return `[${time}] ${role}:\n${msg.content}\n\n`;
        }).join('---\n\n');

        // Save the chat history to a file in the project storage path
        // This is async but we don't need to await it
        // Pass false to avoid download prompts
        saveFile(
          activeProject.storagePath,
          `research-chat-history.txt`,
          formattedHistory,
          false // Don't force download
        );
      }
    }
  }, [messages, activeProject]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check for ongoing generations when the component mounts or when the active project changes
  useEffect(() => {
    if (!activeProject) return;

    // Get ongoing generations for this project-agent combination
    const generations = getOngoingGenerations(activeProject.id, 'research');
    if (generations.length === 0) return;

    // Update messages with ongoing generations
    generations.forEach(generation => {
      if (generation.status === 'generating' || generation.status === 'complete') {
        // Check if the message already exists in our state
        const messageExists = messages.some(msg => msg.id === generation.messageId);

        if (!messageExists) {
          // This is a generation from another session, we need to load the full chat history
          // For now, we'll just update the existing message if it exists
          console.log('Found ongoing generation from another session:', generation);
        } else {
          // Update the existing message with the latest content
          setMessages(prev => {
            const updatedMessages = [...prev];
            const messageIndex = updatedMessages.findIndex(msg => msg.id === generation.messageId);

            if (messageIndex !== -1) {
              updatedMessages[messageIndex] = {
                ...updatedMessages[messageIndex],
                content: generation.content,
                isStreaming: generation.status === 'generating',
              };
            }

            return updatedMessages;
          });
        }
      }
    });
  }, [activeProject, messages]);

  // Handle file upload
  const handleFileUpload = (e) => {
    const uploadedFiles = Array.from(e.target.files);

    // If we have a project storage path, save the files there
    if (activeProject?.storagePath) {
      // Save each file to the project storage path
      uploadedFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
          // Save the file to the project storage path
          // This is async but we don't need to await it
          // Pass false to avoid download prompts
          saveFile(
            joinPath(activeProject.storagePath, 'research-uploads'),
            file.name,
            new Blob([reader.result]),
            false // Don't force download
          );
        };
        reader.readAsArrayBuffer(file);
      });
    }

    setFiles(prev => [...prev, ...uploadedFiles]);
  };

  // Remove file
  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!input.trim() && files.length === 0) return;

    // Add user message
    const userMessage = {
      role: 'user',
      content: input,
      files: files.map(file => file.name),
      timestamp: new Date() // Store as Date object for consistency
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setFiles([]);
    setIsGenerating(true);

    try {
      // Get the selected model info
      const selectedModelInfo = getModelForAgent(activeProject?.id || null, 'research');
      const providerName = selectedModelInfo.provider;
      const modelName = selectedModelInfo.model;

      if (!providerName || !modelName) {
        throw new Error('No model selected. Please select a model from the dropdown.');
      }

      // Create a response message ID
      const responseId = Date.now() + 1;

      // Add initial response message
      const initialResponse = {
        id: responseId,
        role: 'assistant',
        content: 'Thinking...',
        timestamp: new Date(),
        isStreaming: true
      };

      setMessages(prev => [...prev, initialResponse]);

      // Prepare the messages for the API
      const promptMessages = [];

      // Add system message
      promptMessages.push({
        role: 'system',
        content: `You are a Research Assistant, an AI specialized in analyzing research papers, summarizing findings, and answering questions about academic topics. ${files.length > 0 ? 'The user has uploaded files that you should analyze.' : ''}`
      });

      // Add previous messages for context
      const messageLimit = settings.messageHistory || 50;
      const contextMessages = messages.slice(-messageLimit);
      for (const msg of contextMessages) {
        if (msg.role === 'user') {
          let content = msg.content || '';
          if (msg.files && msg.files.length > 0) {
            content += `\n[User has uploaded files: ${msg.files.join(', ')}]`;
          }
          promptMessages.push({ role: 'user', content });
        } else {
          promptMessages.push({ role: 'assistant', content: msg.content || '' });
        }
      }

      // Add the current message
      let userContent = userMessage.content || '';
      if (userMessage.files && userMessage.files.length > 0) {
        userContent += `\n[User has uploaded files: ${userMessage.files.join(', ')}]`;
      }
      promptMessages.push({ role: 'user', content: userContent });

      // Use the chat generation manager to handle the generation
      const generatedText = await startGeneration({
        projectId: activeProject?.id || null,
        agentId: 'research',
        messageId: responseId,
        modelInfo: selectedModelInfo,
        messages: promptMessages,
        settings,
        onUpdate: (fullText) => {
          // Update the message in real-time
          setMessages(prev => {
            const updatedMessages = [...prev];
            const responseIndex = updatedMessages.findIndex(m => m.id === responseId);
            if (responseIndex !== -1) {
              updatedMessages[responseIndex] = {
                ...updatedMessages[responseIndex],
                content: fullText,
              };
            }
            return updatedMessages;
          });
        }
      });

      // Ensure the final message is updated with the complete text
      setMessages(prev => {
        const updatedMessages = [...prev];
        const responseIndex = updatedMessages.findIndex(m => m.id === responseId);
        if (responseIndex !== -1) {
          updatedMessages[responseIndex] = {
            ...updatedMessages[responseIndex],
            content: generatedText,
            isStreaming: false,
          };
        }
        return updatedMessages;
      });

      setIsGenerating(false);
    } catch (error) {
      console.error('Error generating response:', error);
      setIsGenerating(false);

      // Add error message
      setMessages(prev => [...prev, {
        role: 'system',
        content: 'Sorry, I encountered an error while generating a response. Please try again.',
        timestamp: new Date() // Store as Date object for consistency
      }]);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <div className="p-2 rounded-md bg-secondary text-white mr-3">
            <FaFlask />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Research Assistant</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Ask questions and analyze research materials</p>
          </div>
        </div>

        <ModelSelector
          selectedModel={getModelForAgent(activeProject?.id || null, 'research')}
          onModelSelect={(provider, model) => setModelForAgent(activeProject?.id || null, 'research', provider, model)}
          agentColor="from-purple-500 to-purple-600"
        />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="p-3 rounded-md bg-secondary/10 text-secondary dark:text-secondary-light mb-4">
              <FaFlask className="text-2xl" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Research Assistant</h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
              I can help you analyze research papers, summarize findings, and answer questions about academic topics.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg">
              <button
                className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                onClick={() => setInput("Summarize the latest research on quantum computing")}
              >
                <span className="block font-medium text-gray-800 dark:text-gray-200">Summarize research</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">Get an overview of recent findings</span>
              </button>
              <button
                className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                onClick={() => setInput("What are the key differences between supervised and unsupervised learning?")}
              >
                <span className="block font-medium text-gray-800 dark:text-gray-200">Ask a question</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">Get answers to research questions</span>
              </button>
              <button
                className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                onClick={() => fileInputRef.current?.click()}
              >
                <span className="block font-medium text-gray-800 dark:text-gray-200">Analyze a paper</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">Upload a PDF to analyze</span>
              </button>
              <button
                className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                onClick={() => setInput("Compare and contrast the methodologies used in these papers")}
              >
                <span className="block font-medium text-gray-800 dark:text-gray-200">Compare papers</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">Analyze multiple research papers</span>
              </button>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-secondary/10 text-gray-800 dark:text-gray-200'
                    : message.role === 'system'
                      ? 'bg-gray-100 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200'
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center mb-2">
                  <div className={`p-1.5 rounded-md mr-2 ${
                    message.role === 'user'
                      ? 'bg-secondary/20 text-secondary dark:text-secondary-light'
                      : message.role === 'system'
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}>
                    {message.role === 'user' ? <FaUser /> : message.role === 'system' ? <FaRobot /> : <FaFlask />}
                  </div>
                  <span className="font-medium">
                    {message.role === 'user' ? 'You' : message.role === 'system' ? 'System' : 'Research Assistant'}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                    {message.timestamp ? (
                      typeof message.timestamp === 'string'
                        ? new Date(message.timestamp).toLocaleTimeString()
                        : message.timestamp instanceof Date
                          ? message.timestamp.toLocaleTimeString()
                          : ''
                    ) : ''}
                  </span>
                </div>

                {/* Message content */}
                <div className="whitespace-pre-wrap">{message.content}</div>

                {/* Files */}
                {message.files && message.files.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Files:</p>
                    <div className="flex flex-wrap gap-2">
                      {message.files.map((file, fileIndex) => (
                        <div
                          key={fileIndex}
                          className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-md"
                        >
                          {file}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        {/* File preview */}
        {files.length > 0 && (
          <div className="mb-3 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Attached files:</p>
            <div className="flex flex-wrap gap-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-md text-sm"
                >
                  <span className="truncate max-w-[150px]">{file.name}</span>
                  <button
                    onClick={() => removeFile(index)}
                    className="ml-2 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                  >
                    <FaTrash size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input form */}
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-gray-500 hover:text-purple-500 dark:text-gray-400 dark:hover:text-purple-400 transition-colors"
            disabled={isGenerating}
          >
            <FaUpload />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              multiple
              disabled={isGenerating}
            />
          </button>

          <div className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a research question or upload a paper to analyze..."
              className="w-full p-3 bg-transparent outline-none resize-none text-gray-800 dark:text-white"
              rows={1}
              disabled={isGenerating}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              style={{ minHeight: '44px', maxHeight: '200px' }}
            />
          </div>

          <button
            type="submit"
            className={`p-3 rounded-md ${
              isGenerating
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                : 'bg-secondary text-white hover:bg-secondary-dark transition-colors'
            }`}
            disabled={isGenerating}
          >
            {isGenerating ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResearchChatInterface;
