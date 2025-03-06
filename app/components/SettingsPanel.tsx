'use client';

import { useState, useEffect } from 'react';
import { companyPlugins } from '../lib/chats';

interface SettingsPanelProps {
  temperature: number;
  onTemperatureChange: (value: number) => void;
  selectedPlugins: string[];
  onPluginsChange: (plugins: string[]) => void;
}

export function SettingsPanel({
  temperature,
  onTemperatureChange,
  selectedPlugins,
  onPluginsChange
}: SettingsPanelProps) {
  const togglePlugin = (pluginId: string) => {
    onPluginsChange(
      selectedPlugins.includes(pluginId)
        ? selectedPlugins.filter(id => id !== pluginId)
        : [...selectedPlugins, pluginId]
    );
  };
  
  return (
    <div className="col-span-3 border-l p-4 h-screen overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4">Settings</h2>
      
      {/* Temperature control */}
      <div className="mb-6">
        <label htmlFor="temperature" className="block text-sm font-medium mb-1">
          Temperature: {temperature.toFixed(1)}
        </label>
        <input
          id="temperature"
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={temperature}
          onChange={(e) => onTemperatureChange(parseFloat(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>0.0</span>
          <span>0.5</span>
          <span>1.0</span>
        </div>
      </div>
      
      {/* Plugins */}
      <div>
        <h3 className="text-sm font-medium mb-2">Plugins</h3>
        <div className="space-y-2">
          {companyPlugins.map(plugin => (
            <div 
              key={plugin.id}
              className="flex items-center"
            >
              <input
                type="checkbox"
                id={`plugin-${plugin.id}`}
                checked={selectedPlugins.includes(plugin.id)}
                onChange={() => togglePlugin(plugin.id)}
                className="mr-2"
              />
              <label 
                htmlFor={`plugin-${plugin.id}`}
                className="text-sm cursor-pointer"
              >
                {plugin.name}
              </label>
            </div>
          ))}
        </div>
      </div>
      
      {/* Keyboard shortcuts info */}
      <div className="mt-8 pt-4 border-t border-gray-200">
        <h3 className="text-sm font-medium mb-2">Keyboard Shortcuts</h3>
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex items-center">
            <kbd className="px-1 py-0.5 bg-gray-100 border rounded mr-2">Ctrl</kbd> + 
            <kbd className="px-1 py-0.5 bg-gray-100 border rounded mx-2">N</kbd>
            <span>New chat</span>
          </div>
          <div className="flex items-center">
            <kbd className="px-1 py-0.5 bg-gray-100 border rounded mr-2">Shift</kbd> + 
            <kbd className="px-1 py-0.5 bg-gray-100 border rounded mx-2">Enter</kbd>
            <span>Save message &amp; add next</span>
          </div>
        </div>
      </div>
    </div>
  );
}