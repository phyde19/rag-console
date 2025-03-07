'use client';

import React, { useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChatInterface } from '../components/ChatInterface';
import { AppLayout } from '../components/AppLayout';
import { useChatContext } from '../context/ChatContext';
import { SavedChat, Setting, generateUUID } from '../lib/chats';

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
  
  // Handle setting changes
  const handleSettingChange = useCallback((settingId: string, value: any) => {
    if (!chat) return;
    
    const updatedSettings = chat.config.settings.map(setting => {
      if (setting.id === settingId) {
        // Merge the new values with the existing setting
        return { ...setting, ...value };
      }
      return setting;
    });
    
    const updatedChat: SavedChat = {
      ...chat,
      config: {
        ...chat.config,
        settings: updatedSettings
      },
      updatedAt: new Date().toISOString()
    };
    
    saveCurrentChat(updatedChat);
  }, [chat, saveCurrentChat]);
  
  const handleAddSetting = useCallback((newSetting: Setting) => {
    if (!chat) return;
    
    const updatedChat: SavedChat = {
      ...chat,
      config: {
        ...chat.config,
        settings: [...chat.config.settings, newSetting]
      },
      updatedAt: new Date().toISOString()
    };
    
    saveCurrentChat(updatedChat);
  }, [chat, saveCurrentChat]);
  
  const handleRemoveSetting = useCallback((settingId: string) => {
    if (!chat) return;
    
    // Find the setting to check if it's a temperature setting
    const settingToRemove = chat.config.settings.find(setting => setting.id === settingId);
    if (!settingToRemove || settingToRemove.type === 'temperature') {
      // Don't allow removing temperature settings
      return;
    }
    
    const updatedSettings = chat.config.settings.filter(
      setting => setting.id !== settingId
    );
    
    const updatedChat: SavedChat = {
      ...chat,
      config: {
        ...chat.config,
        settings: updatedSettings
      },
      updatedAt: new Date().toISOString()
    };
    
    saveCurrentChat(updatedChat);
  }, [chat, saveCurrentChat]);
  
  // Backward compatibility: extract temperature and plugins from settings
  const getTemperature = useCallback(() => {
    if (!chat) return 0.7;
    
    const temperatureSetting = chat.config.settings.find(
      setting => setting.type === 'temperature'
    );
    
    return temperatureSetting ? (temperatureSetting as any).value : 0.7;
  }, [chat]);
  
  const getSelectedPlugins = useCallback(() => {
    if (!chat) return [];
    
    // Look for a plugins setting
    const pluginsSetting = chat.config.settings.find(
      setting => setting.id === 'plugins' && setting.type === 'multiselect'
    );
    
    // If not found, return empty array
    if (!pluginsSetting) return [];
    
    return (pluginsSetting as any).value || [];
  }, [chat]);
  
  if (!chat) {
    return null; // Will redirect in useEffect
  }
  
  return (
    <AppLayout
      settings={chat.config.settings}
      onSettingChange={handleSettingChange}
      onAddSetting={handleAddSetting}
      onRemoveSetting={handleRemoveSetting}
    >
      {/* Force complete re-mount of component with pathname+chat ID as key */}
      <ChatInterface 
        chat={chat} 
        temperature={getTemperature()}
        selectedPlugins={getSelectedPlugins()}
      />
    </AppLayout>
  );
}