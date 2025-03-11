'use client';

import { useEffect } from 'react';
import { ChatSidebar } from './ChatSidebar';
import { SettingsPanel } from './SettingsPanel';
import { useChatStore, ChatSetting } from '../context/ChatStore';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { 
    createAndNavigate,
    settings,
    updateSetting,
    addSetting,
    removeSetting,
    currentChat
  } = useChatStore();
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+N for new chat
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        createAndNavigate();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createAndNavigate]);
  
  return (
    <div className="min-h-screen grid grid-cols-12 gap-0">
      {/* Left sidebar - Chat list */}
      <ChatSidebar />
      
      {/* Main content area */}
      {children}
      
      {/* Right sidebar - Settings panel */}
    <SettingsPanel 
        settings={currentChat?.config.settings || null}
        onSettingChange={updateSetting}
        onAddSetting={addSetting}
        onRemoveSetting={removeSetting}
    />
    </div>
  );
}