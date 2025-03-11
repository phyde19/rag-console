'use client';

import { useEffect, useRef } from 'react';
import { PluginSelect } from './PluginSelect';

interface SlidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlugins: string[];
  onPluginsChange: (plugins: string[]) => void;
}

export function SlidePanel({ 
  isOpen, 
  onClose, 
  selectedPlugins, 
  onPluginsChange 
}: SlidePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <div 
      ref={panelRef}
      className={`fixed top-0 right-0 bottom-0 bg-white border-l border-gray-200 shadow-xl z-30 transition-transform duration-200 ease-in-out overflow-hidden
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        md:w-96 w-full
      `}
    >
      {/* Panel header with close button */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <h2 className="font-bold">Configuration</h2>
        <button 
          onClick={onClose}
          className="p-1 rounded-full hover:bg-gray-100"
          aria-label="Close panel"
        >
          <CloseIcon />
        </button>
      </div>
      
      {/* Content */}
      <div className="h-[calc(100%-56px)] overflow-auto">
        <div className="p-4">
          <div className="mb-4">
            <h3 className="font-medium mb-2">Available Plugins</h3>
            <p className="text-sm text-gray-500 mb-4">
              Select which plugins will be available to the AI during simulation
            </p>
            <PluginSelect
              selectedPlugins={selectedPlugins}
              onChange={onPluginsChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}