"use client";

import React, { useEffect, useState } from 'react';
import { FaSun, FaMoon, FaRegMoon, FaRegSun } from 'react-icons/fa';
import { useSettings } from '../context/SettingsContext';

const DarkModeToggle = () => {
  const { settings, updateSetting } = useSettings();
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Apply theme based on settings
    if (settings.theme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else if (settings.theme === 'light') {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else if (settings.theme === 'system') {
      // Check if user prefers dark mode
      const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDarkMode);
      if (prefersDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [settings.theme]);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);

    // Update settings
    updateSetting('theme', newDarkMode ? 'dark' : 'light');

    // Apply theme
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Prevent flash of incorrect theme
  if (!mounted) return null;

  return (
    <button
      onClick={toggleDarkMode}
      className="p-3 rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-300 text-gray-800 dark:text-gray-200 relative overflow-hidden group"
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className="relative z-10 transition-transform duration-500 ease-in-out transform group-hover:rotate-12">
        {darkMode ? (
          <div className="flex items-center">
            <FaSun className="text-yellow-500 text-lg" />
          </div>
        ) : (
          <div className="flex items-center">
            <FaMoon className="text-indigo-600 text-lg" />
          </div>
        )}
      </div>
      <div className={`absolute inset-0 bg-gradient-to-tr ${darkMode ? 'from-yellow-300 to-yellow-500' : 'from-indigo-500 to-purple-600'} opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-full`}></div>
    </button>
  );
};

export default DarkModeToggle;
