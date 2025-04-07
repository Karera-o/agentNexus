"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useProject } from '../context/ProjectContext';
import { joinPath, saveFile } from '../utils/fileSystem';
import { FaPaperPlane, FaFileExport, FaFileImport, FaRobot, FaUser, FaEllipsisH, FaSpinner } from 'react-icons/fa';
import FileUpload, { FileMessage } from './FileUpload';
import ModelSelector from './ModelSelector';
import { useModelContext } from '../context/ModelContext';
import { useSettings } from '../context/SettingsContext';
import { createProvider } from '../services/providers/provider-factory';
import MarkdownRenderer from './MarkdownRenderer';
import { getCachedAgentSystemPrompt, getDefaultSystemPrompt } from '../utils/agentPrompts';
import { startGeneration, getGenerationStatus, getOngoingGenerations, hasOngoingGenerations } from '../services/chatGenerationManager';

const ChatInterface = ({ activeAgent }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState('');
  const messagesEndRef = useRef(null);

  // Get contexts
  const { isOllamaAvailable, getModelForAgent, setModelForAgent } = useModelContext();
  const { activeProject } = useProject();
  const { settings } = useSettings();

  // Get agent information - memoized to prevent unnecessary recalculations
  const getAgentInfo = useCallback((agentId) => {
    const agentInfo = {
      'requirements': {
        title: 'Requirements Analyst',
        color: 'from-blue-500 to-blue-600',
        greeting: 'Hello! I\'m your Requirements Analyst. I can help you extract, clarify, and organize software requirements. You can also upload documents for me to analyze. How can I assist you today?'
      },
      'documentor': {
        title: 'Software Documentor',
        color: 'from-green-500 to-green-600',
        greeting: 'Hi there! I\'m your Software Documentor. I can help generate technical documentation for your project. Feel free to upload any existing documents or code files. What would you like to document today?'
      },
      'system': {
        title: 'System Designer',
        color: 'from-purple-500 to-purple-600',
        greeting: 'Welcome! I\'m your System Designer. I can help create and visualize architecture diagrams for your system. You can upload existing diagrams or documentation. What are we designing today?'
      },
      'database': {
        title: 'DB Designer',
        color: 'from-yellow-500 to-yellow-600',
        greeting: 'Greetings! I\'m your Database Designer. I can help design, visualize, and export database schemas. Feel free to upload existing schema files or diagrams. What database challenge are we tackling today?'
      },
      'ui': {
        title: 'UI Architect',
        color: 'from-red-500 to-red-600',
        greeting: 'Hello! I\'m your UI Architect. I can provide expert UI design recommendations and guidance. You can upload mockups, wireframes, or screenshots for me to analyze. What UI design challenge can I help you with?'
      }
    };
    return agentInfo[agentId] || { title: 'Assistant', color: 'from-gray-500 to-gray-600', greeting: 'Hello! How can I help you today? You can upload files for me to analyze.' };
  }, []);

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
    if (activeAgent) {
      // Create a unique key for this chat history that includes the project ID
      const historyKey = activeProject ? `chatHistory-${activeProject.id}-${activeAgent}` : `chatHistory-${activeAgent}`;

      const savedMessages = localStorage.getItem(historyKey);
      if (savedMessages) {
        try {
          const parsedMessages = JSON.parse(savedMessages);
          if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
            // Migrate any string timestamps to Date objects
            const migratedMessages = migrateTimestamps(parsedMessages);
            setMessages(migratedMessages);
            return; // Don't add greeting if we loaded messages
          }
        } catch (error) {
          console.error('Error parsing saved messages:', error);
        }
      }

      // If no history or error parsing, add greeting message
      const agentInfo = getAgentInfo(activeAgent);
      setMessages([
        {
          id: 1,
          sender: 'agent',
          content: agentInfo.greeting,
          timestamp: new Date()
        }
      ]);

      // TODO: In the future, we'll load chat history from the project storage path
      // if (activeProject?.storagePath) {
      //   // Load from file system when implemented
      // }
    }
  }, [activeAgent, activeProject, getAgentInfo]);

  // Save chat history to localStorage and project storage
  useEffect(() => {
    if (activeAgent && messages.length > 0) {
      // Create a unique key for this chat history that includes the project ID
      const historyKey = activeProject ? `chatHistory-${activeProject.id}-${activeAgent}` : `chatHistory-${activeAgent}`;

      // Save to localStorage
      localStorage.setItem(historyKey, JSON.stringify(messages));

      // Save to project storage path if available
      if (activeProject?.storagePath) {
        // Create a formatted version of the chat history for saving to a file
        const agentInfo = getAgentInfo(activeAgent);
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

          const role = msg.sender === 'user' ? 'You' : agentInfo.title;
          return `[${time}] ${role}:\n${msg.content}\n\n`;
        }).join('---\n\n');

        // Save the chat history to a file in the project storage path
        // This is async but we don't need to await it
        // Pass false to avoid download prompts
        saveFile(
          activeProject.storagePath,
          `${activeAgent}-chat-history.txt`,
          formattedHistory,
          false // Don't force download
        );
      }
    }
  }, [messages, activeAgent, activeProject, getAgentInfo]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check for ongoing generations when the component mounts or when the active project/agent changes
  useEffect(() => {
    if (!activeProject || !activeAgent) return;

    // Get ongoing generations for this project-agent combination
    const generations = getOngoingGenerations(activeProject.id, activeAgent);
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
  }, [activeProject, activeAgent, messages]);

  const handleFileSelect = (files) => {
    // If we have a project storage path, save the files there
    if (activeProject?.storagePath) {
      // Save each file to the project storage path
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
          // Save the file to the project storage path
          // This is async but we don't need to await it
          // Pass false to avoid download prompts
          saveFile(
            joinPath(activeProject.storagePath, 'uploads'),
            file.name,
            new Blob([reader.result]),
            false // Don't force download
          );
        };
        reader.readAsArrayBuffer(file);
      });
    }

    setSelectedFiles([...selectedFiles, ...files]);
  };

  const handleRemoveFile = (fileToRemove) => {
    setSelectedFiles(selectedFiles.filter(file => file !== fileToRemove));
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() && selectedFiles.length === 0) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      content: inputMessage,
      files: selectedFiles.length > 0 ? [...selectedFiles] : undefined,
      timestamp: new Date()
    };

    setMessages([...messages, userMessage]);
    setInputMessage('');
    setSelectedFiles([]);
    setIsTyping(true);

    const agentInfo = getAgentInfo(activeAgent);
    const selectedModelInfo = getModelForAgent(activeProject?.id || null, activeAgent);

    // Create a placeholder for the streaming response
    const responseId = Date.now() + 1;
    let initialContent = '';

    if (userMessage.files && userMessage.files.length > 0) {
      const fileNames = userMessage.files.map(f => f.name).join(', ');
      if (inputMessage.trim()) {
        initialContent = `Analyzing your message and ${userMessage.files.length} file(s): ${fileNames}...`;
      } else {
        initialContent = `Analyzing ${userMessage.files.length} file(s): ${fileNames}...`;
      }
    } else {
      initialContent = 'Thinking...';
    }

    // Add initial response message
    const initialResponse = {
      id: responseId,
      sender: 'agent',
      content: initialContent,
      timestamp: new Date(),
      isStreaming: true
    };

    setMessages(prev => [...prev, initialResponse]);

    try {
      // Check if we have a valid model provider and model
      const providerName = selectedModelInfo.provider;
      const modelName = selectedModelInfo.model;

      if (!providerName || !modelName) {
        throw new Error('No model selected. Please select a model from the dropdown.');
      }

      // Get the provider instance
      const provider = createProvider(providerName, settings);

      // Check if provider is available
      const isAvailable = await provider.isAvailable();
      if (!isAvailable) {
        throw new Error(`The selected provider (${providerName}) is not available. Please check your settings.`);
      }

      // If we have a valid provider and model
        setIsGenerating(true);
        setStreamedResponse('');

        // Prepare the messages for Ollama API
        const promptMessages = [];

        // Get the system prompt for this agent
        let systemPrompt = getDefaultSystemPrompt(activeAgent);
        try {
          // Try to get the cached system prompt
          systemPrompt = await getCachedAgentSystemPrompt(activeAgent);
        } catch (error) {
          console.warn('Error getting system prompt, using default:', error);
        }

        // Add file analysis instruction if files are uploaded
        if (userMessage.files && userMessage.files.length > 0) {
          systemPrompt += '\n\nThe user has uploaded files that you should analyze.';
        }

        // Add system message with agent role
        promptMessages.push({
          role: 'system',
          content: systemPrompt
        });

        // Add previous messages for context (limit based on settings)
        const messageLimit = settings.messageHistory || 50;
        const contextMessages = messages.slice(-messageLimit);
        for (const msg of contextMessages) {
          if (msg.sender === 'user') {
            let content = msg.content || '';
            if (msg.files && msg.files.length > 0) {
              const fileNames = msg.files.map(f => f.name).join(', ');
              content += `\n[User has uploaded files: ${fileNames}]`;
            }
            promptMessages.push({ role: 'user', content });
          } else {
            promptMessages.push({ role: 'assistant', content: msg.content || '' });
          }
        }

        // Add the current message
        let userContent = userMessage.content || '';
        if (userMessage.files && userMessage.files.length > 0) {
          const fileNames = userMessage.files.map(f => f.name).join(', ');
          userContent += `\n[User has uploaded files: ${fileNames}]`;
        }
        promptMessages.push({ role: 'user', content: userContent });

        // Use the chat generation manager to handle the generation
        // This will continue in the background even if the user navigates away
        try {
          // Start the generation
          const generatedText = await startGeneration({
            projectId: activeProject?.id || null,
            agentId: activeAgent,
            messageId: responseId,
            modelInfo: selectedModelInfo,
            messages: promptMessages,
            settings,
            onUpdate: (fullText) => {
              // Only update the UI if this component is still mounted and focused on this chat
              setStreamedResponse(fullText);

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
          // This is important if the user navigated away and back
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
        } catch (error) {
          console.error('Error in chat generation manager:', error);
          throw error; // Re-throw to be caught by the outer try/catch
        }

        // Message is already finalized in the try/catch block
    } catch (error) {
      console.error('Error generating response:', error);

      // Update message with error
      setMessages(prev => {
        const updatedMessages = [...prev];
        const responseIndex = updatedMessages.findIndex(m => m.id === responseId);
        if (responseIndex !== -1) {
          updatedMessages[responseIndex] = {
            ...updatedMessages[responseIndex],
            content: `Sorry, I encountered an error while generating a response. Please try again.`,
            isStreaming: false,
            error: true,
          };
        }
        return updatedMessages;
      });
    } finally {
      setIsTyping(false);
      setIsGenerating(false);
      setStreamedResponse('');
    }
  };

  // Memoize the current agent info to prevent unnecessary recalculations
  const agentInfo = useMemo(() => getAgentInfo(activeAgent), [activeAgent, getAgentInfo]);

  // Memoize the model selection handler
  const handleModelSelect = useCallback((provider, model) => {
    // Pass the project ID if available, otherwise use default
    const projectId = activeProject?.id || null;
    setModelForAgent(projectId, activeAgent, provider, model);
  }, [activeAgent, activeProject, setModelForAgent]);

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Chat header */}
      <div className="bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-md shadow-sm">
            <FaRobot className="text-white text-lg" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{agentInfo.title}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">AI Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Model selector */}
          <ModelSelector
            selectedModel={getModelForAgent(activeProject?.id || null, activeAgent)}
            onModelSelect={handleModelSelect}
            agentColor={agentInfo.color}
          />

          <div className="flex gap-2">
            <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="Export conversation">
              <FaFileExport className="text-gray-600 dark:text-gray-300" />
            </button>
            <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="Import data">
              <FaFileImport className="text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50 dark:bg-gray-900">
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
            style={{animationDelay: `${index * 0.1}s`}}
          >
            {message.sender === 'agent' && (
              <div className="flex-shrink-0 mr-3">
                <div className="bg-primary p-2 rounded-md shadow-sm">
                  <FaRobot className="text-white text-sm" />
                </div>
              </div>
            )}

            <div
              className={`max-w-[70%] rounded-[var(--message-border-radius)] p-4 shadow-sm ${
                message.sender === 'user'
                  ? 'bg-primary text-white rounded-tr-none'
                  : message.error
                    ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-gray-800 dark:text-gray-100 rounded-tl-none'
                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-tl-none'
              }`}
            >
              <div className="leading-relaxed">
                {message.sender === 'agent' ? (
                  <MarkdownRenderer
                    content={message.content}
                    debug={settings.debugMode}
                  />
                ) : (
                  message.content
                )}
                {message.isStreaming && (
                  <span className="inline-block ml-1 animate-pulse">▋</span>
                )}
              </div>

              {/* Display files if present */}
              {message.files && message.files.length > 0 && (
                <div className={`mt-3 p-2 rounded-lg ${message.sender === 'user' ? 'bg-blue-400/30' : 'bg-gray-100 dark:bg-gray-700/50'}`}>
                  <FileMessage files={message.files} />
                </div>
              )}

              <div className={`text-xs mt-2 flex justify-between items-center ${
                message.sender === 'user'
                  ? 'text-blue-100'
                  : message.error
                    ? 'text-red-400 dark:text-red-300'
                    : 'text-gray-500 dark:text-gray-400'
              }`}>
                <div className="flex items-center gap-1">
                  {message.sender === 'agent' && isOllamaAvailable && (
                    <span className="text-xs">{getModelForAgent(activeProject?.id || null, activeAgent).model}</span>
                  )}
                  <span>
                    {message.timestamp instanceof Date
                      ? message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : typeof message.timestamp === 'string'
                        ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : ''
                    }
                  </span>
                </div>
                {message.error && (
                  <span className="text-red-500 dark:text-red-400">Error</span>
                )}
              </div>
            </div>

            {message.sender === 'user' && (
              <div className="flex-shrink-0 ml-3">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-2 rounded-full shadow-md">
                  <FaUser className="text-white text-sm" />
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start animate-fade-in">
            <div className="flex-shrink-0 mr-3">
              <div className={`bg-gradient-to-r ${agentInfo.color} p-2 rounded-full shadow-md`}>
                <FaRobot className="text-white text-sm" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-[var(--message-border-radius)] rounded-tl-none p-4 shadow-sm max-w-[70%]">
              <div className="flex space-x-2">
                <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse"></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse" style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>
          </div>
        )}

        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
      </div>

      {/* Selected files preview */}
      {selectedFiles.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Selected Files ({selectedFiles.length})
            </h3>
            <button
              onClick={() => setSelectedFiles([])}
              className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400"
            >
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-32 overflow-y-auto p-1">
            {selectedFiles.map((file, index) => (
              <div key={index} className="relative">
                <FileUpload.FilePreview file={file} onRemove={handleRemoveFile} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat input */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
        <div className="flex gap-3 items-center">
          {/* File upload button outside the form */}
          <FileUpload onFileSelect={handleFileSelect} />

          <form onSubmit={handleSendMessage} className="flex-1 flex gap-3 items-center">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message or upload files..."
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded-full px-6 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white shadow-sm transition-all"
            />

            <button
              type="submit"
              disabled={!inputMessage.trim() && selectedFiles.length === 0}
              className={`rounded-full p-3 shadow-md transition-all duration-200 ${
                (inputMessage.trim() || selectedFiles.length > 0)
                  ? 'bg-primary text-white hover:bg-primary-dark transition-colors'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'}`}
            >
              <FaPaperPlane className="text-lg" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
