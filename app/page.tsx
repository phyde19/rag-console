'use client';

import { useState } from 'react';
import { EmbeddingModelSelect } from './components/EmbeddingModelSelect';
import { VectorIndexSelect } from './components/VectorIndexSelect';
import { PluginSelect } from './components/PluginSelect';
import { LoadingSpinner } from './components/LoadingSpinner';

export default function Home() {
  const [systemPrompt, setSystemPrompt] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Placeholder for when you integrate with your backend
    try {
      // This is where you would call your backend API
      // For now, we'll just simulate a response
      setTimeout(() => {
        setResponse('This is a simulated AI response. Replace this with actual integration to your backend.');
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error generating response:', error);
      setResponse('An error occurred while generating the response.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">RAG Playground</h1>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1">Embedding Model</label>
            <EmbeddingModelSelect />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Vector Index</label>
            <VectorIndexSelect />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Plugins</label>
            <PluginSelect />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="system-prompt" className="block text-sm font-medium mb-1">
              System Prompt
            </label>
            <textarea
              id="system-prompt"
              className="w-full h-40 p-3 border border-[var(--border-color)] bg-[var(--input-bg)] rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter system prompt here..."
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
            />
          </div>
          
          <div>
            <label htmlFor="user-prompt" className="block text-sm font-medium mb-1">
              User Prompt
            </label>
            <textarea
              id="user-prompt"
              className="w-full h-40 p-3 border border-[var(--border-color)] bg-[var(--input-bg)] rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter user prompt here..."
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              required
            />
          </div>
        </div>
        
        <div className="mb-6">
          <button 
            type="submit"
            className="px-4 py-2 bg-[var(--button-bg)] text-[var(--button-text)] rounded-md hover:bg-[var(--button-hover)] transition-colors disabled:opacity-50 flex items-center gap-2"
            disabled={loading}
          >
            {loading && <LoadingSpinner />}
            {loading ? 'Generating...' : 'Generate Response'}
          </button>
        </div>
      </form>
      
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="block text-sm font-medium">
            AI Response
          </label>
          {response && (
            <button 
              onClick={() => navigator.clipboard.writeText(response)}
              className="text-xs px-2 py-1 bg-[var(--copy-button-bg)] rounded hover:bg-[var(--copy-button-hover)]"
            >
              Copy
            </button>
          )}
        </div>
        <div className="w-full min-h-40 p-3 border border-[var(--border-color)] rounded-md bg-[var(--response-bg)]">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[var(--button-bg)] border-t-transparent"></div>
            </div>
          ) : (
            <div className="whitespace-pre-wrap">
              {response ? (
                <p>{response}</p>
              ) : (
                <p className="text-gray-400 italic">Response will appear here...</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
