"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { FaPaperPlane, FaFileExport, FaFileImport, FaRobot, FaUser, FaEllipsisH, FaSpinner } from 'react-icons/fa';
import FileUpload, { FileMessage } from './FileUpload';
import ModelSelector from './ModelSelector';
import { useModelContext } from '../context/ModelContext';
import { useSettings } from '../context/SettingsContext';
import { createProvider } from '../services/providers/provider-factory';

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

  // Initialize with greeting message when agent changes
  useEffect(() => {
    if (activeAgent) {
      const agentInfo = getAgentInfo(activeAgent);
      setMessages([
        {
          id: 1,
          sender: 'agent',
          content: agentInfo.greeting,
          timestamp: new Date()
        }
      ]);
    }
  }, [activeAgent]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileSelect = (files) => {
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
    const selectedModelInfo = getModelForAgent(activeAgent);

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

        // Add system message with agent role
        promptMessages.push({
          role: 'system',
          content: `You are a ${agentInfo.title}, an AI assistant specialized in helping with software development tasks. ${userMessage.files ? 'The user has uploaded files that you should analyze.' : ''}`
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

        // Use streaming or non-streaming based on settings
        if (settings.streamResponses) {
          // Generate streaming response
          await provider.generateStreamingCompletion(
            modelName,
            promptMessages,
            (chunk, fullText) => {
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
            },
            { temperature: 0.7 }
          );
        } else {
          // Generate non-streaming response
          const response = await provider.generateCompletion(
            modelName,
            promptMessages,
            { temperature: 0.7 }
          );

          // Update the message with the response
          setMessages(prev => {
            const updatedMessages = [...prev];
            const responseIndex = updatedMessages.findIndex(m => m.id === responseId);
            if (responseIndex !== -1 && response.message) {
              updatedMessages[responseIndex] = {
                ...updatedMessages[responseIndex],
                content: response.message.content || 'No response content',
              };
            }
            return updatedMessages;
          });
        }

        // Finalize the message when complete
        setMessages(prev => {
          const updatedMessages = [...prev];
          const responseIndex = updatedMessages.findIndex(m => m.id === responseId);
          if (responseIndex !== -1) {
            updatedMessages[responseIndex] = {
              ...updatedMessages[responseIndex],
              isStreaming: false,
            };
          }
          return updatedMessages;
        });
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
    setModelForAgent(activeAgent, provider, model);
  }, [activeAgent, setModelForAgent]);

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Chat header */}
      <div className="bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className={`bg-gradient-to-r ${agentInfo.color} p-2 rounded-lg shadow-md`}>
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
            selectedModel={getModelForAgent(activeAgent)}
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
                <div className={`bg-gradient-to-r ${agentInfo.color} p-2 rounded-full shadow-md`}>
                  <FaRobot className="text-white text-sm" />
                </div>
              </div>
            )}

            <div
              className={`max-w-[70%] rounded-[var(--message-border-radius)] p-4 shadow-sm ${
                message.sender === 'user'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-tr-none'
                  : message.error
                    ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-gray-800 dark:text-gray-100 rounded-tl-none'
                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-tl-none'
              }`}
            >
              <div className="leading-relaxed">
                {message.content}
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
                    <span className="text-xs">{getModelForAgent(activeAgent)}</span>
                  )}
                  <span>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg transform hover:-translate-y-0.5'
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
