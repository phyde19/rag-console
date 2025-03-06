'use client';

interface ConfigPanelProps {
  temperature: number;
  onTemperatureChange: (value: number) => void;
  onSimulate: () => void;
  onExport: () => void;
  onImport: () => void;
  isSimulating: boolean;
}

export function ConfigPanel({
  temperature,
  onTemperatureChange,
  onSimulate,
  onExport,
  onImport,
  isSimulating
}: ConfigPanelProps) {
  return (
    <div className="px-4 py-3 bg-white border rounded-md shadow-sm mb-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="temperature" className="text-sm font-medium">
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
            className="w-24"
          />
          <span className="text-sm">{temperature.toFixed(1)}</span>
        </div>
        
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