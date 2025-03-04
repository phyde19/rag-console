'use client';

import { useState } from 'react';

// Hard-coded list of plugins
const availablePlugins = [
  { id: 'web_search', name: 'Web Search' },
  { id: 'code_interpreter', name: 'Code Interpreter' },
  { id: 'image_generation', name: 'Image Generation' },
  { id: 'knowledge_graph', name: 'Knowledge Graph' },
  { id: 'calculator', name: 'Calculator' },
  { id: 'weather', name: 'Weather' },
  { id: 'calendar', name: 'Calendar' },
];

export function PluginSelect() {
  const [selectedPlugins, setSelectedPlugins] = useState<string[]>([]);

  const togglePlugin = (pluginId: string) => {
    setSelectedPlugins(prev => 
      prev.includes(pluginId) 
        ? prev.filter(id => id !== pluginId)
        : [...prev, pluginId]
    );
  };

  return (
    <div className="border border-[var(--border-color)] bg-[var(--input-bg)] rounded-md p-2 max-h-40 overflow-y-auto">
      {availablePlugins.map((plugin) => (
        <div key={plugin.id} className="flex items-center mb-1 last:mb-0">
          <input
            type="checkbox"
            id={`plugin-${plugin.id}`}
            className="mr-2"
            checked={selectedPlugins.includes(plugin.id)}
            onChange={() => togglePlugin(plugin.id)}
            name="plugins[]"
            value={plugin.id}
          />
          <label htmlFor={`plugin-${plugin.id}`} className="text-sm cursor-pointer">
            {plugin.name}
          </label>
        </div>
      ))}
    </div>
  );
}