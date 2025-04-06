"use client";

import React from 'react';
import { FaCog } from 'react-icons/fa';
import { useSettings } from '../context/SettingsContext';

const SettingsButton = () => {
  const { toggleSettings } = useSettings();

  return (
    <button
      onClick={toggleSettings}
      className="p-3 rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-300 text-gray-800 dark:text-gray-200 relative overflow-hidden group"
      aria-label="Settings"
    >
      <div className="relative z-10 transition-transform duration-500 ease-in-out transform group-hover:rotate-45">
        <FaCog className="text-gray-600 dark:text-gray-300 text-lg" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-tr from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-full"></div>
    </button>
  );
};

export default SettingsButton;
