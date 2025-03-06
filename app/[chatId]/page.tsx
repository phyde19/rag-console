'use client';

import React, { useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChatInterface } from '../components/ChatInterface';
import { AppLayout } from '../components/AppLayout';
import { useChatContext } from '../context/ChatContext';
import { SavedChat } from '../lib/chats';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = params.chatId as string;
  const { savedChats, saveCurrentChat } = useChatContext();
  
  // Find the chat in context
  const chat = savedChats.find(c => c.id === chatId);
  
  // If the chat isn't found, redirect to home
  useEffect(() => {
    if (!chat && chatId) {
      router.push('/');
    }
  }, [chat, chatId, router]);
  
  // Handle temperature and plugin changes
  const handleTemperatureChange = useCallback((newTemperature: number) => {
    if (!chat) return;
    
    const updatedChat: SavedChat = {
      ...chat,
      config: {
        ...chat.config,
        temperature: newTemperature
      },
      updatedAt: new Date().toISOString()
    };
    
    saveCurrentChat(updatedChat);
  }, [chat, saveCurrentChat]);
  
  const handlePluginsChange = useCallback((newPlugins: string[]) => {
    if (!chat) return;
    
    const updatedChat: SavedChat = {
      ...chat,
      config: {
        ...chat.config,
        selectedPlugins: newPlugins
      },
      updatedAt: new Date().toISOString()
    };
    
    saveCurrentChat(updatedChat);
  }, [chat, saveCurrentChat]);
  
  if (!chat) {
    return null; // Will redirect in useEffect
  }
  
  return (
    <AppLayout
      temperature={chat.config.temperature}
      onTemperatureChange={handleTemperatureChange}
      selectedPlugins={chat.config.selectedPlugins}
      onPluginsChange={handlePluginsChange}
    >
      {/* Use key to force re-creation of component when chat changes */}
      <ChatInterface key={chat.id} initialChat={chat} />
    </AppLayout>
  );
}