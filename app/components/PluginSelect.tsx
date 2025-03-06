'use client';

// Hard-coded list of plugins
const availablePlugins = [
  { id: 'web_search', name: 'Web Search', description: 'Search the internet for current information' },
  { id: 'code_interpreter', name: 'Code Interpreter', description: 'Execute code and return results' },
  { id: 'image_generation', name: 'Image Generation', description: 'Create images from text descriptions' },
  { id: 'knowledge_graph', name: 'Knowledge Graph', description: 'Access structured knowledge data' },
  { id: 'calculator', name: 'Calculator', description: 'Perform mathematical calculations' },
  { id: 'weather', name: 'Weather', description: 'Get current weather and forecasts' },
  { id: 'calendar', name: 'Calendar', description: 'Access calendar events and scheduling' },
  { id: 'file_browser', name: 'File Browser', description: 'Browse and access files' },
  { id: 'data_analysis', name: 'Data Analysis', description: 'Analyze datasets and visualize results' },
  { id: 'text_extraction', name: 'Text Extraction', description: 'Extract text from documents and images' },
];

interface PluginSelectProps {
  selectedPlugins: string[];
  onChange: (plugins: string[]) => void;
}

export function PluginSelect({ selectedPlugins, onChange }: PluginSelectProps) {
  const togglePlugin = (pluginId: string) => {
    onChange(
      selectedPlugins.includes(pluginId)
        ? selectedPlugins.filter(id => id !== pluginId)
        : [...selectedPlugins, pluginId]
    );
  };

  const handleSelectAll = () => {
    onChange(availablePlugins.map(plugin => plugin.id));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  return (
    <div>
      <div className="flex justify-between mb-2">
        <div>
          <span className="text-sm text-gray-500">{selectedPlugins.length} of {availablePlugins.length} selected</span>
        </div>
        <div className="flex gap-2">
          <button 
            className="text-xs text-blue-600 hover:text-blue-800"
            onClick={handleSelectAll}
          >
            Select all
          </button>
          <button 
            className="text-xs text-blue-600 hover:text-blue-800"
            onClick={handleClearAll}
          >
            Clear all
          </button>
        </div>
      </div>
      
      <div className="border rounded-md divide-y">
        {availablePlugins.map((plugin) => (
          <div 
            key={plugin.id} 
            className="flex items-start p-3 hover:bg-gray-50 cursor-pointer"
            onClick={() => togglePlugin(plugin.id)}
          >
            <input
              type="checkbox"
              id={`plugin-${plugin.id}`}
              className="mt-1 mr-3"
              checked={selectedPlugins.includes(plugin.id)}
              onChange={() => {}}
              onClick={(e) => e.stopPropagation()}
            />
            <label 
              htmlFor={`plugin-${plugin.id}`} 
              className="cursor-pointer flex-1"
            >
              <div className="font-medium">{plugin.name}</div>
              <div className="text-sm text-gray-500">{plugin.description}</div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}