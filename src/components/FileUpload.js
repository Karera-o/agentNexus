"use client";

import React, { useState, useRef } from 'react';
import { FaFile, FaImage, FaFileAlt, FaFilePdf, FaFileCode, FaTimes, FaPaperclip } from 'react-icons/fa';

const FileUpload = ({ onFileSelect }) => {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();

    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files) => {
    const filesArray = Array.from(files);
    onFileSelect(filesArray);
  };

  const onButtonClick = (e) => {
    // Prevent the event from propagating to the form
    e.preventDefault();
    e.stopPropagation();
    inputRef.current.click();
  };

  return (
    <div
      className={`relative ${dragActive ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
      onDragEnter={handleDrag}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        onChange={handleChange}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.txt,.md,.csv,.json,.js,.html,.css,.py"
      />

      <button
        type="button"
        onClick={onButtonClick}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title="Upload file"
      >
        <FaPaperclip className="text-gray-600 dark:text-gray-300" />
      </button>

      {dragActive && (
        <div
          className="absolute inset-0 w-full h-full rounded-lg border-2 border-dashed border-blue-400 dark:border-blue-500 flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 z-50"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="text-center p-4">
            <p className="text-blue-600 dark:text-blue-400 font-medium">Drop your files here</p>
          </div>
        </div>
      )}
    </div>
  );
};

export const FilePreview = ({ file, onRemove }) => {
  const getFileIcon = () => {
    const extension = file.name.split('.').pop().toLowerCase();

    if (file.type.startsWith('image/')) {
      return <FaImage className="text-green-500" />;
    } else if (['pdf'].includes(extension)) {
      return <FaFilePdf className="text-red-500" />;
    } else if (['doc', 'docx', 'txt', 'md'].includes(extension)) {
      return <FaFileAlt className="text-blue-500" />;
    } else if (['js', 'html', 'css', 'py', 'json'].includes(extension)) {
      return <FaFileCode className="text-yellow-500" />;
    } else {
      return <FaFile className="text-gray-500" />;
    }
  };

  const getFilePreview = () => {
    if (file.type.startsWith('image/')) {
      return (
        <div className="relative group">
          <img
            src={URL.createObjectURL(file)}
            alt={file.name}
            className="w-full h-32 object-cover rounded-lg"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
            <button
              onClick={() => window.open(URL.createObjectURL(file), '_blank')}
              className="p-2 bg-white rounded-full mr-2"
            >
              <FaImage className="text-gray-800" />
            </button>
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex items-center p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="mr-3 text-xl">
            {getFileIcon()}
          </div>
          <div className="flex-1 truncate">
            <p className="font-medium truncate">{file.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="relative group">
      {getFilePreview()}
      {onRemove && (
        <button
          onClick={() => onRemove(file)}
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
          title="Remove file"
        >
          <FaTimes size={12} />
        </button>
      )}
    </div>
  );
};

export const FileMessage = ({ files }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
      {files.map((file, index) => (
        <FilePreview key={index} file={file} />
      ))}
    </div>
  );
};

// Add FilePreview to the FileUpload object for easier imports
FileUpload.FilePreview = FilePreview;

export default FileUpload;
