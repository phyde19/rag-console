'use client';

import React, { useEffect, useCallback, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChatInterface } from '../components/ChatInterface';
import { AppLayout } from '../components/AppLayout';
import { useChatContext, SavedChat, ChatSetting } from '../context/ChatContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { api } from '../lib/api';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = params.chatId as string;
  const { savedChats, saveCurrentChat, loading, error } = useChatContext();
  
  // Local state for the current chat
  const [currentChat, setCurrentChat] = useState<SavedChat | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load chat data directly from API for the most up-to-date info
  useEffect(() => {
    async function loadChat() {
      if (!chatId) return;
      
      setIsLoading(true);
      try {
        // Get chat from API
        const apiChat = await api.getChat(chatId);
        console.log('Loaded chat from API:', apiChat);
        
        // Convert backend model to frontend model using the context's conversion function
        const chatFromApi = {
          id: apiChat.id,
          name: apiChat.name,
          messages: apiChat.messages?.map(msg => ({
            id: msg.id,
            role: msg.role as any,
            content: msg.content
          })) || [],
          config: {
            settings: apiChat.settings?.map(setting => {
              let value: any = setting.value;
              
              // Parse values based on type
              if (setting.type === 'temperature') {
                value = parseFloat(value);
              } else if (setting.type === 'checkbox') {
                value = value === 'true';
              } else if (setting.type === 'multiselect') {
                try {
                  value = JSON.parse(value);
                } catch (e) {
                  console.error('Failed to parse multiselect value', value);
                  value = [];
                }
              }
              
              return {
                id: setting.setting_id,
                name: setting.name,
                type: setting.type,
                value,
                options: setting.options?.map(opt => ({
                  id: opt.option_id,
                  name: opt.name
                }))
              };
            }) || []
          },
          updatedAt: apiChat.updated_at
        };
        
        console.log('Converted chat to frontend model:', chatFromApi);
        setCurrentChat(chatFromApi);
      } catch (err) {
        console.error('Failed to load chat:', err);
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadChat();
  }, [chatId, router]);
  
  // Handle setting changes
  const handleSettingChange = useCallback(async (settingId: string, value: any) => {
    if (!currentChat) return;
    
    try {
      const updatedSettings = currentChat.config.settings.map(setting => {
        if (setting.id === settingId) {
          // Merge the new values with the existing setting
          return { ...setting, ...value };
        }
        return setting;
      });
      
      const updatedChat: SavedChat = {
        ...currentChat,
        config: {
          ...currentChat.config,
          settings: updatedSettings
        },
        updatedAt: new Date().toISOString()
      };
      
      // Update local state immediately for responsive UI
      setCurrentChat(updatedChat);
      
      // Save to API - for settings, we can just update that one setting directly
      const settingToUpdate = updatedSettings.find(s => s.id === settingId);
      if (settingToUpdate) {
        // Convert value to string for API
        let valueStr = String(settingToUpdate.value);
        if (typeof settingToUpdate.value === 'object') {
          valueStr = JSON.stringify(settingToUpdate.value);
        }
        
        await api.updateSetting(currentChat.id, settingId, valueStr);
      }
    } catch (err) {
      console.error('Failed to save setting change:', err);
      // Could add error state/toast notification here
    }
  }, [currentChat]);
  
  const handleAddSetting = useCallback(async (newSetting: ChatSetting) => {
    if (!currentChat) return;
    
    try {
      // Update local state first for responsive UI
      const updatedChat: SavedChat = {
        ...currentChat,
        config: {
          ...currentChat.config,
          settings: [...currentChat.config.settings, newSetting]
        },
        updatedAt: new Date().toISOString()
      };
      
      setCurrentChat(updatedChat);
      
      // Convert value to string for API
      let valueStr = String(newSetting.value);
      if (typeof newSetting.value === 'object') {
        valueStr = JSON.stringify(newSetting.value);
      }
      
      // Create setting in API
      await api.createSetting(currentChat.id, {
        setting_id: newSetting.id,
        name: newSetting.name,
        type: newSetting.type,
        value: valueStr,
        options: newSetting.options?.map(opt => ({
          id: opt.id,
          name: opt.name
        }))
      });
    } catch (err) {
      console.error('Failed to add setting:', err);
      // Revert the local state change if the API call fails
      // You could reload the chat here to ensure consistency
    }
  }, [currentChat]);
  
  const handleRemoveSetting = useCallback(async (settingId: string) => {
    if (!currentChat) return;
    
    // Find the setting to check if it's a required setting
    const settingToRemove = currentChat.config.settings.find(setting => setting.id === settingId);
    if (!settingToRemove || settingToRemove.type === 'temperature') {
      // Don't allow removing temperature settings
      return;
    }
    
    try {
      // Update local state first for responsive UI
      const updatedSettings = currentChat.config.settings.filter(
        setting => setting.id !== settingId
      );
      
      const updatedChat: SavedChat = {
        ...currentChat,
        config: {
          ...currentChat.config,
          settings: updatedSettings
        },
        updatedAt: new Date().toISOString()
      };
      
      setCurrentChat(updatedChat);
      
      // Delete setting in API
      await api.deleteSetting(currentChat.id, settingId);
    } catch (err) {
      console.error('Failed to remove setting:', err);
      // Revert the local state change if the API call fails
      // You could reload the chat here to ensure consistency
    }
  }, [currentChat]);
  
  // Get temperature and plugins from settings
  const getTemperature = useCallback(() => {
    if (!currentChat) return 0.7;
    
    const temperatureSetting = currentChat.config.settings.find(
      setting => setting.type === 'temperature'
    );
    
    return temperatureSetting ? temperatureSetting.value : 0.7;
  }, [currentChat]);
  
  const getSelectedPlugins = useCallback(() => {
    if (!currentChat) return [];
    
    // Look for a plugins setting
    const pluginsSetting = currentChat.config.settings.find(
      setting => setting.id === 'plugins' && setting.type === 'multiselect'
    );
    
    // If not found, return empty array
    if (!pluginsSetting) return [];
    
    return pluginsSetting.value || [];
  }, [currentChat]);
  
  // Loading state
  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  // Error state or chat not found
  if (error || !currentChat) {
    return null; // Will redirect in useEffect
  }
  
  return (
    <AppLayout
      settings={currentChat.config.settings}
      onSettingChange={handleSettingChange}
      onAddSetting={handleAddSetting}
      onRemoveSetting={handleRemoveSetting}
    >
      <ChatInterface 
        chat={currentChat} 
        temperature={getTemperature()}
        selectedPlugins={getSelectedPlugins()}
        onChatUpdated={setCurrentChat}
      />
    </AppLayout>
  );
}