'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, Chat, ChatListItem, Message, Setting } from '../lib/api';
import { generateUUID } from '../lib/chats';

// Map from backend models to frontend models
export interface SavedChat {
  id: string;
  name: string;
  messages: ChatMessage[];
  config: {
    settings: ChatSetting[];
  };
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  isLoading?: boolean;
}

export interface ChatSetting {
  id: string;
  name: string;
  type: string;
  value: any;
  options?: Array<{ id: string; name: string; }>;
}

// Define context type
interface ChatContextType {
  // All chats data
  savedChats: SavedChat[];
  loading: boolean;
  error: string | null;
  
  // Actions
  loadSavedChat: (chatId: string) => void;
  createChat: (name?: string, systemMessage?: string, skipNavigation?: boolean) => Promise<SavedChat>;
  updateChatName: (chatId: string, newName: string) => Promise<void>;
  deleteCurrentChat: (chatId: string) => Promise<void>;
  saveCurrentChat: (chat: SavedChat) => Promise<void>;
  refreshChats: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Helper to convert backend Chat to frontend SavedChat
function convertApiChatToSavedChat(apiChat: Chat): SavedChat {
  // Convert messages
  const messages: ChatMessage[] = apiChat.messages?.map(msg => ({
    id: msg.id,
    role: msg.role as 'system' | 'user' | 'assistant',
    content: msg.content
  })) || [];

  // Convert settings
  const settings: ChatSetting[] = apiChat.settings?.map(setting => {
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
      id: setting.setting_id, // Use setting_id as frontend id
      name: setting.name,
      type: setting.type,
      value,
      options: setting.options?.map(opt => ({
        id: opt.option_id,
        name: opt.name
      }))
    };
  }) || [];

  return {
    id: apiChat.id,
    name: apiChat.name,
    messages,
    config: {
      settings
    },
    updatedAt: apiChat.updated_at
  };
}

// Helper to convert Chat items to simplified list items
function convertApiChatItemsToSavedChats(items: ChatListItem[]): SavedChat[] {
  return items.map(item => ({
    id: item.id,
    name: item.name,
    messages: [],
    config: {
      settings: []
    },
    updatedAt: item.updated_at
  }));
}

export const ChatProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const router = useRouter();
  
  // State
  const [savedChats, setSavedChats] = useState<SavedChat[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load chats on initial render
  useEffect(() => {
    refreshChats();
  }, []);
  
  // Refresh the list of chats
  const refreshChats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const chats = await api.getChats();
      console.log('Loaded chats:', chats);
      setSavedChats(convertApiChatItemsToSavedChats(chats));
    } catch (err) {
      console.error('Failed to load chats:', err);
      setError('Failed to load chats');
    } finally {
      setLoading(false);
    }
  };
  
  // Load a specific chat
  const loadSavedChat = (chatId: string) => {
    router.push(`/${chatId}`);
  };
  
  // Create a new chat
  const createChat = async (
    name?: string, 
    systemMessage: string = 'You are a helpful assistant.',
    skipNavigation?: boolean
  ): Promise<SavedChat> => {
    const defaultName = name || `New Chat ${new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    })}`;
    
    try {
      const newChat = await api.createChat(defaultName, systemMessage);
      const savedChat = convertApiChatToSavedChat(newChat);
      
      // Add to state
      setSavedChats(prev => [savedChat, ...prev]);
      
      // Navigate if needed
      if (!skipNavigation) {
        router.push(`/${savedChat.id}`);
      }
      
      return savedChat;
    } catch (err) {
      console.error('Failed to create chat:', err);
      setError('Failed to create chat');
      throw err;
    }
  };
  
  // Update a chat's name
  const updateChatName = async (chatId: string, newName: string): Promise<void> => {
    if (!newName.trim()) return;
    
    try {
      await api.updateChat(chatId, newName.trim());
      
      // Update local state
      setSavedChats(prev => 
        prev.map(chat => 
          chat.id === chatId 
            ? { ...chat, name: newName.trim() }
            : chat
        )
      );
    } catch (err) {
      console.error('Failed to update chat name:', err);
      setError('Failed to update chat name');
      throw err;
    }
  };
  
  // Delete a chat
  const deleteCurrentChat = async (chatId: string): Promise<void> => {
    try {
      await api.deleteChat(chatId);
      
      // Update local state
      const updatedChats = savedChats.filter(chat => chat.id !== chatId);
      setSavedChats(updatedChats);
      
      // Navigate to home or another chat
      if (updatedChats.length > 0) {
        router.push(`/${updatedChats[0].id}`);
      } else {
        router.push('/');
      }
    } catch (err) {
      console.error('Failed to delete chat:', err);
      setError('Failed to delete chat');
      throw err;
    }
  };
  
  // Save changes to a chat
  const saveCurrentChat = async (chat: SavedChat): Promise<void> => {
    try {
      // Update local state first, keeping backend as source of truth but avoiding full UI refresh
      setSavedChats(prevChats => {
        return prevChats.map(prevChat => {
          if (prevChat.id === chat.id) {
            return {
              ...prevChat,
              name: chat.name,
              messages: chat.messages,
              config: chat.config,
              updatedAt: new Date().toISOString()
            };
          }
          return prevChat;
        });
      });
      
      // Get the existing chat from API to compare
      const existingChat = await api.getChat(chat.id);
      const savedExistingChat = convertApiChatToSavedChat(existingChat);
      
      // Update chat name if different
      if (chat.name !== savedExistingChat.name) {
        await api.updateChat(chat.id, chat.name);
      }
      
      // Handle message differences
      const existingMessageIds = new Set(savedExistingChat.messages.map(m => m.id));
      const newMessageIds = new Set(chat.messages.map(m => m.id));
      
      // Messages to create (in new but not in existing)
      const messagesToCreate = chat.messages.filter(m => !existingMessageIds.has(m.id));
      
      // Messages to update (in both, content changed)
      const messagesToUpdate = chat.messages.filter(m => {
        if (!existingMessageIds.has(m.id)) return false;
        const existingMessage = savedExistingChat.messages.find(em => em.id === m.id);
        return existingMessage && existingMessage.content !== m.content;
      });
      
      // Messages to delete (in existing but not in new)
      const messagesToDelete = savedExistingChat.messages.filter(m => !newMessageIds.has(m.id));
      
      // Create new messages
      for (const msg of messagesToCreate) {
        await api.createMessage(
          chat.id,
          msg.role,
          msg.content
        );
      }
      
      // Update messages
      for (const msg of messagesToUpdate) {
        await api.updateMessage(chat.id, msg.id, msg.content);
      }
      
      // Delete messages
      for (const msg of messagesToDelete) {
        await api.deleteMessage(chat.id, msg.id);
      }
      
      // Handle settings
      // For simplicity, we'll just update settings that exist, since the core settings structure
      // is created with the chat and unlikely to change significantly
      for (const setting of chat.config.settings) {
        // Convert value to string for API
        let valueStr = String(setting.value);
        if (typeof setting.value === 'object') {
          valueStr = JSON.stringify(setting.value);
        }
        
        try {
          await api.updateSetting(chat.id, setting.id, valueStr);
        } catch (err) {
          // If setting doesn't exist yet, create it
          if (err instanceof Error && err.message.includes('not found')) {
            await api.createSetting(chat.id, {
              setting_id: setting.id,
              name: setting.name,
              type: setting.type,
              value: valueStr,
              options: setting.options
            });
          } else {
            throw err;
          }
        }
      }
      
      // Note: We removed the refreshChats() call here to prevent full page refresh
      // The local state update above maintains UI consistency
    } catch (err) {
      console.error('Failed to save chat:', err);
      setError('Failed to save chat');
      throw err;
    }
  };
  
  return (
    <ChatContext.Provider
      value={{
        savedChats,
        loading,
        error,
        loadSavedChat,
        createChat,
        updateChatName,
        deleteCurrentChat,
        saveCurrentChat,
        refreshChats
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};