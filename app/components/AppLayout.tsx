'use client';

import { useState, useEffect } from 'react';
import { ChatSidebar } from './ChatSidebar';
import { SettingsPanel } from './SettingsPanel';
import { useChatContext } from '../context/ChatContext';

interface AppLayoutProps {
  children: React.ReactNode;
  temperature: number;
  onTemperatureChange: (temp: number) => void;
  selectedPlugins: string[];
  onPluginsChange: (plugins: string[]) => void;
}

export function AppLayout({
  children,
  temperature,
  onTemperatureChange,
  selectedPlugins,
  onPluginsChange
}: AppLayoutProps) {
  const { createChat } = useChatContext();
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+N for new chat
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        createChat();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createChat]);
  
  return (
    <div className="min-h-screen grid grid-cols-12 gap-0">
      {/* Left sidebar - Chat list */}
      <ChatSidebar />
      
      {/* Main content area */}
      {children}
      
      {/* Right sidebar - Settings panel */}
      <SettingsPanel 
        temperature={temperature}
        onTemperatureChange={onTemperatureChange}
        selectedPlugins={selectedPlugins}
        onPluginsChange={onPluginsChange}
      />
    </div>
  );
}