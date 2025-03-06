'use client';

interface ConfigPanelProps {
  temperature: number;
  onTemperatureChange: (value: number) => void;
  selectedPlugins: string[];
  onPluginsChange: (plugins: string[]) => void;
  onSimulate: () => void;
  onExport: () => void;
  onImport: () => void;
  isSimulating: boolean;
  onToggleConfigPanel: () => void;
}

export function ConfigPanel({
  temperature,
  onTemperatureChange,
  selectedPlugins,
  onPluginsChange,
  onSimulate,
  onExport,
  onImport,
  isSimulating,
  onToggleConfigPanel
}: ConfigPanelProps) {
  return (
    <div className="px-4 py-3 bg-white border rounded-md shadow-sm mb-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 min-w-[180px]">
          <label htmlFor="temperature" className="text-sm font-medium whitespace-nowrap">
            Temperature:
          </label>
          <input
            id="temperature"
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={temperature}
            onChange={(e) => onTemperatureChange(parseFloat(e.target.value))}
            className="w-24 flex-grow"
          />
          <span className="text-sm w-6 text-right">{temperature.toFixed(1)}</span>
        </div>
        
        {/* Config panel toggle button */}
        <button
          onClick={onToggleConfigPanel}
          className="flex items-center gap-1 px-2 py-1 text-sm border rounded hover:bg-gray-50"
          aria-label="Toggle configuration panel"
          title="Toggle configuration panel"
        >
          <SettingsIcon />
          <span className="hidden sm:inline">Settings</span>
        </button>
        
        <div className="flex-grow"></div>
        
        <div className="flex gap-2">
          <button
            onClick={onImport}
            className="px-2 py-1 text-sm border rounded hover:bg-gray-50"
          >
            Import
          </button>
          
          <button
            onClick={onExport}
            className="px-2 py-1 text-sm border rounded hover:bg-gray-50"
          >
            Export
          </button>
          
          <button
            onClick={onSimulate}
            disabled={isSimulating}
            className="px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 flex items-center gap-1"
          >
            {isSimulating ? (
              <>
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-solid border-white border-t-transparent"></span>
                Simulating...
              </>
            ) : (
              'Simulate Chat'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingsIcon() {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="16" 
      height="16" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
  );
}