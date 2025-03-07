'use client';

import { useState } from 'react';
import { generateUUID, Setting, SettingType } from '../lib/chats';

interface SettingsPanelProps {
  settings: Setting[];
  onSettingChange: (settingId: string, value: any) => void;
  onAddSetting: (setting: Setting) => void;
  onRemoveSetting: (settingId: string) => void;
}

export function SettingsPanel({
  settings,
  onSettingChange,
  onAddSetting,
  onRemoveSetting
}: SettingsPanelProps) {
  const [isAddingNewSetting, setIsAddingNewSetting] = useState(false);
  const [newSettingType, setNewSettingType] = useState<SettingType>('text');
  const [newSettingName, setNewSettingName] = useState('');

  // Create a new setting based on the selected type
  const createNewSetting = () => {
    if (!newSettingName.trim()) return;
    
    let newSetting: Setting;
    const id = generateUUID();
    
    switch (newSettingType) {
      case 'text':
        newSetting = {
          id,
          name: newSettingName,
          type: 'text',
          value: ''
        };
        break;
      case 'checkbox':
        newSetting = {
          id,
          name: newSettingName,
          type: 'checkbox',
          value: false
        };
        break;
      case 'radio':
        newSetting = {
          id,
          name: newSettingName,
          type: 'radio',
          options: [],
          value: ''
        };
        break;
      case 'multiselect':
        newSetting = {
          id,
          name: newSettingName,
          type: 'multiselect',
          options: [],
          value: []
        };
        break;
      case 'json':
        newSetting = {
          id,
          name: newSettingName,
          type: 'json',
          value: '{}'
        };
        break;
    }
    
    onAddSetting(newSetting);
    setNewSettingName('');
    setIsAddingNewSetting(false);
  };

  // Handle adding an option to a multiselect or radio setting
  const addOptionToSetting = (settingId: string, optionName: string) => {
    const setting = settings.find(s => s.id === settingId);
    if ((setting?.type === 'multiselect' || setting?.type === 'radio') && optionName.trim()) {
      const newOption = { id: generateUUID(), name: optionName };
      const updatedOptions = [...setting.options, newOption];
      onSettingChange(settingId, { options: updatedOptions });
      
      // For radio buttons, if this is the first option, select it automatically
      if (setting.type === 'radio' && setting.options.length === 0 && setting.value === '') {
        onSettingChange(settingId, { value: newOption.id });
      }
    }
  };

  // Toggle a value in a multiselect setting
  const toggleMultiselectOption = (settingId: string, optionId: string) => {
    const setting = settings.find(s => s.id === settingId);
    if (setting?.type === 'multiselect') {
      const newValue = setting.value.includes(optionId)
        ? setting.value.filter(id => id !== optionId)
        : [...setting.value, optionId];
      onSettingChange(settingId, { value: newValue });
    }
  };
  
  // Set the value for a radio button setting
  const setRadioOption = (settingId: string, optionId: string) => {
    const setting = settings.find(s => s.id === settingId);
    if (setting?.type === 'radio') {
      onSettingChange(settingId, { value: optionId });
    }
  };

  // Handle JSON validation and updates
  const validateAndUpdateJson = (settingId: string, jsonString: string) => {
    // Always update the value to allow typing
    onSettingChange(settingId, { value: jsonString });
    
    // Try to validate for UI feedback if needed
    try {
      JSON.parse(jsonString);
      return true;
    } catch (error) {
      return false;
    }
  };

  // Render a setting based on its type
  const renderSetting = (setting: Setting) => {
    switch (setting.type) {
      case 'temperature':
        return (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-1">
              <label htmlFor={`setting-${setting.id}`} className="block text-sm font-medium">
                {setting.name}: {setting.value.toFixed(1)}
              </label>
              {/* Temperature is not removable */}
            </div>
            <input
              id={`setting-${setting.id}`}
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={setting.value}
              onChange={(e) => onSettingChange(setting.id, { value: parseFloat(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0.0</span>
              <span>0.5</span>
              <span>1.0</span>
            </div>
          </div>
        );
        
      case 'text':
        return (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <label htmlFor={`setting-${setting.id}`} className="block text-sm font-medium">
                {setting.name}
              </label>
              <button 
                onClick={() => onRemoveSetting(setting.id)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
            <input
              id={`setting-${setting.id}`}
              type="text"
              value={setting.value}
              onChange={(e) => onSettingChange(setting.id, { value: e.target.value })}
              className="w-full p-2 border rounded text-sm"
            />
          </div>
        );
        
      case 'checkbox':
        return (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center">
                <div 
                  className="relative w-9 h-5 cursor-pointer" 
                  onClick={() => onSettingChange(setting.id, { value: !setting.value })}
                >
                  {/* Background */}
                  <div className={`absolute inset-0 rounded-full transition-colors ${setting.value ? "bg-blue-500" : "bg-gray-300"}`}></div>
                  
                  {/* Toggle circle */}
                  <div className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full shadow transform transition-transform ${setting.value ? "translate-x-4" : ""}`}></div>
                </div>
                <span className="ml-3 text-sm font-medium">{setting.name}</span>
              </div>
              <button 
                onClick={() => onRemoveSetting(setting.id)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          </div>
        );
        
      case 'radio':
        return (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium">
                {setting.name}
              </label>
              <button 
                onClick={() => onRemoveSetting(setting.id)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
            <div className="space-y-2 mb-2">
              {setting.options.map(option => (
                <div key={option.id} className="flex items-center">
                  <input
                    type="radio"
                    id={`option-${setting.id}-${option.id}`}
                    name={`radio-group-${setting.id}`}
                    checked={setting.value === option.id}
                    onChange={() => setRadioOption(setting.id, option.id)}
                    className="mr-2"
                  />
                  <label 
                    htmlFor={`option-${setting.id}-${option.id}`}
                    className="text-sm cursor-pointer"
                  >
                    {option.name}
                  </label>
                </div>
              ))}
            </div>
            
            {/* Add new option form */}
            <div className="mt-2 flex items-center">
              <input
                type="text"
                placeholder="Add new option..."
                className="flex-1 p-1 border rounded text-sm mr-2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value) {
                    addOptionToSetting(setting.id, e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />
              <button
                className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                onClick={(e) => {
                  const input = e.currentTarget.previousSibling as HTMLInputElement;
                  if (input.value) {
                    addOptionToSetting(setting.id, input.value);
                    input.value = '';
                  }
                }}
              >
                Add
              </button>
            </div>
          </div>
        );
      
      case 'multiselect':
        return (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium">
                {setting.name}
              </label>
              <button 
                onClick={() => onRemoveSetting(setting.id)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
            <div className="space-y-2 mb-2">
              {setting.options.map(option => (
                <div key={option.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`option-${setting.id}-${option.id}`}
                    checked={setting.value.includes(option.id)}
                    onChange={() => toggleMultiselectOption(setting.id, option.id)}
                    className="mr-2"
                  />
                  <label 
                    htmlFor={`option-${setting.id}-${option.id}`}
                    className="text-sm cursor-pointer"
                  >
                    {option.name}
                  </label>
                </div>
              ))}
            </div>
            
            {/* Add new option form */}
            <div className="mt-2 flex items-center">
              <input
                type="text"
                placeholder="Add new option..."
                className="flex-1 p-1 border rounded text-sm mr-2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value) {
                    addOptionToSetting(setting.id, e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />
              <button
                className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                onClick={(e) => {
                  const input = e.currentTarget.previousSibling as HTMLInputElement;
                  if (input.value) {
                    addOptionToSetting(setting.id, input.value);
                    input.value = '';
                  }
                }}
              >
                Add
              </button>
            </div>
          </div>
        );
        
      case 'json':
        return (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <label htmlFor={`setting-${setting.id}`} className="block text-sm font-medium">
                {setting.name}
              </label>
              <button 
                onClick={() => onRemoveSetting(setting.id)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
            <textarea
              id={`setting-${setting.id}`}
              value={setting.value}
              onChange={(e) => {
                validateAndUpdateJson(setting.id, e.target.value);
              }}
              onKeyDown={(e) => {
                // Handle tab key to insert a tab character instead of changing focus
                if (e.key === 'Tab') {
                  e.preventDefault();
                  
                  // Get cursor position
                  const start = e.currentTarget.selectionStart;
                  const end = e.currentTarget.selectionEnd;
                  
                  // Insert tab at cursor position
                  const newValue = 
                    setting.value.substring(0, start) + 
                    '\t' + 
                    setting.value.substring(end);
                  
                  // Update the value
                  onSettingChange(setting.id, { value: newValue });
                  
                  // Set cursor position after the inserted tab
                  // Need to use setTimeout to ensure the DOM has updated
                  setTimeout(() => {
                    const textArea = document.getElementById(`setting-${setting.id}`) as HTMLTextAreaElement;
                    textArea.selectionStart = textArea.selectionEnd = start + 1;
                  }, 0);
                }
              }}
              onBlur={(e) => {
                try {
                  // Format JSON on blur only if it's valid
                  JSON.parse(e.target.value); // Test if valid
                  const formattedJson = JSON.stringify(JSON.parse(e.target.value), null, 2);
                  onSettingChange(setting.id, { value: formattedJson });
                } catch (error) {
                  // If it's not valid JSON, leave it as is
                }
              }}
              className="w-full p-2 border rounded text-sm font-mono h-32"
              placeholder="{}"
              spellCheck="false"
            />
          </div>
        );
    }
  };

  return (
    <div className="col-span-3 border-l p-4 h-screen overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4">Settings</h2>
      
      {/* Render all settings with temperature always at the top */}
      {settings
        .sort((a, b) => {
          // Temperature always comes first
          if (a.type === 'temperature') return -1;
          if (b.type === 'temperature') return 1;
          return 0;
        })
        .map(setting => (
          <div key={setting.id}>
            {renderSetting(setting)}
          </div>
        ))}
      
      {/* Add new setting form */}
      {isAddingNewSetting ? (
        <div className="mb-6 p-3 border border-dashed border-gray-300 rounded">
          <h3 className="text-sm font-medium mb-2">Add New Setting</h3>
          
          <div className="mb-3">
            <label className="block text-xs mb-1">Setting Type</label>
            <select
              value={newSettingType}
              onChange={(e) => setNewSettingType(e.target.value as SettingType)}
              className="w-full p-2 border rounded text-sm"
            >
              <option value="text">Text Input</option>
              <option value="checkbox">Toggle Switch</option>
              <option value="radio">Radio Buttons (Single Select)</option>
              <option value="multiselect">Multi-Select List</option>
              <option value="json">JSON</option>
            </select>
          </div>
          
          <div className="mb-3">
            <label className="block text-xs mb-1">Setting Name</label>
            <input
              type="text"
              value={newSettingName}
              onChange={(e) => setNewSettingName(e.target.value)}
              placeholder="Enter setting name"
              className="w-full p-2 border rounded text-sm"
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setIsAddingNewSetting(false)}
              className="text-xs bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={createNewSetting}
              disabled={!newSettingName.trim()}
              className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              Add Setting
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAddingNewSetting(true)}
          className="mb-6 text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 w-full"
        >
          + Add New Setting
        </button>
      )}
      
      {/* Keyboard shortcuts info */}
      <div className="mt-4 pt-4 border-t border-gray-200">
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