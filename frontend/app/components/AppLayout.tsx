'use client';

import { useEffect } from 'react';
import { ChatSidebar } from './ChatSidebar';
import { SettingsPanel } from './SettingsPanel';
import { useChatContext } from '../context/ChatContext';
import { Setting } from '../lib/chats';

interface AppLayoutProps {
  children: React.ReactNode;
  settings: Setting[];
  onSettingChange: (settingId: string, value: any) => void;
  onAddSetting: (setting: Setting) => void;
  onRemoveSetting: (settingId: string) => void;
}

export function AppLayout({
  children,
  settings,
  onSettingChange,
  onAddSetting,
  onRemoveSetting
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
        settings={settings}
        onSettingChange={onSettingChange}
        onAddSetting={onAddSetting}
        onRemoveSetting={onRemoveSetting}
      />
    </div>
  );
}