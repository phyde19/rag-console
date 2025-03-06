'use client';

import { useEffect, useRef, useState } from 'react';
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
  const [activeTab, setActiveTab] = useState('plugins');
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
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          className={`flex-1 py-2 text-sm font-medium ${activeTab === 'plugins' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('plugins')}
        >
          Plugins & Tools
        </button>
        <button
          className={`flex-1 py-2 text-sm font-medium ${activeTab === 'rag' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('rag')}
        >
          RAG Settings
        </button>
        <button
          className={`flex-1 py-2 text-sm font-medium ${activeTab === 'model' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('model')}
        >
          Model Settings
        </button>
      </div>
      
      {/* Content based on active tab */}
      <div className="h-[calc(100%-108px)] overflow-auto">
        {activeTab === 'plugins' && (
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
        )}
        
        {activeTab === 'rag' && (
          <div className="p-4">
            <h3 className="font-medium mb-2">RAG Configuration</h3>
            <p className="text-sm text-gray-500 mb-4">
              Configure retrieval-augmented generation settings
            </p>
            
            {/* Placeholder for RAG settings */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Vector Database</label>
                <select className="w-full p-2 border rounded">
                  <option>Pinecone</option>
                  <option>Weaviate</option>
                  <option>Milvus</option>
                  <option>Chroma</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Embedding Model</label>
                <select className="w-full p-2 border rounded">
                  <option>text-embedding-3-small</option>
                  <option>text-embedding-3-large</option>
                  <option>text-embedding-ada-002</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Number of Results</label>
                <input type="number" className="w-full p-2 border rounded" value="5" />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Similarity Threshold</label>
                <input type="range" className="w-full" min="0" max="1" step="0.01" />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0.0</span>
                  <span>0.5</span>
                  <span>1.0</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'model' && (
          <div className="p-4">
            <h3 className="font-medium mb-2">Model Settings</h3>
            <p className="text-sm text-gray-500 mb-4">
              Configure language model parameters
            </p>
            
            {/* Placeholder for model settings */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Model</label>
                <select className="w-full p-2 border rounded">
                  <option>gpt-4-turbo</option>
                  <option>gpt-4o</option>
                  <option>claude-3-opus</option>
                  <option>claude-3-sonnet</option>
                  <option>llama-3-70b</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Temperature</label>
                <input type="range" className="w-full" min="0" max="1" step="0.1" />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0.0</span>
                  <span>0.5</span>
                  <span>1.0</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Max Tokens</label>
                <input type="number" className="w-full p-2 border rounded" value="1024" />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">System Prompt</label>
                <textarea className="w-full p-2 border rounded h-24" 
                  placeholder="You are a helpful assistant...">
                </textarea>
              </div>
            </div>
          </div>
        )}
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