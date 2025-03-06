'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { SavedChat, ChatMessage, initialChats } from '../lib/chats';

// Define context type
interface ChatContextType {
  // All chats data
  savedChats: SavedChat[];
  
  // Actions
  loadSavedChat: (chatId: string) => void;
  createChat: (name?: string, customId?: string) => void;
  updateChatName: (chatId: string, newName: string) => void;
  deleteCurrentChat: (chatId: string) => void;
  saveCurrentChat: (chat: SavedChat) => void;
  
  // Active chat management
  currentChat: SavedChat | null;
  isWelcomeTemplate: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  
  // In-memory state
  const [savedChats, setSavedChats] = useState<SavedChat[]>(initialChats);
  const [currentChat, setCurrentChat] = useState<SavedChat | null>(null);
  const [isWelcomeTemplate, setIsWelcomeTemplate] = useState(false);
  
  // Initialize state based on the current route - with deep comparison to prevent loops
  useEffect(() => {
    // If we're at the root path, set welcome template flag
    if (pathname === '/') {
      setIsWelcomeTemplate(true);
      setCurrentChat(null);
    } else {
      // For specific chat route, set the current chat
      const chatId = pathname.substring(1); // Remove leading slash safely
      const chat = savedChats.find(c => c.id === chatId);
      
      if (chat) {
        // Only update if the chat ID has changed or currentChat is null
        // This prevents re-renders when chat content changes but ID remains the same
        if (!currentChat || currentChat.id !== chat.id) {
          setCurrentChat(chat);
          setIsWelcomeTemplate(false);
        }
      }
    }
  }, [pathname, savedChats, currentChat]);
  
  // Create a new chat
  const createChat = (name?: string, customId?: string) => {
    const defaultName = name || `New Chat ${new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    })}`;
    
    const newChat: SavedChat = {
      id: customId || Date.now().toString(),
      name: defaultName,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant.'
        }
      ],
      config: {
        temperature: 0.7,
        selectedPlugins: []
      },
      updatedAt: new Date().toISOString()
    };
    
    // Update the state immediately
    setSavedChats(prev => [newChat, ...prev]);
    setCurrentChat(newChat);
  };
  
  // Load a specific chat
  const loadSavedChat = (chatId: string) => {
    const chat = savedChats.find(c => c.id === chatId);
    if (chat) {
      // Use router navigation
      router.push(`/${chatId}`);
    } else {
      console.error(`Chat with id ${chatId} not found`);
    }
  };
  
  // Update a chat's name
  const updateChatName = (chatId: string, newName: string) => {
    if (!newName.trim()) return;
    
    setSavedChats(prev => {
      return prev.map(chat => 
        chat.id === chatId 
          ? { ...chat, name: newName.trim() }
          : chat
      );
    });
    
    // If this is the current chat, update it too
    if (currentChat && currentChat.id === chatId) {
      setCurrentChat(prev => {
        if (!prev) return prev;
        return { ...prev, name: newName.trim() };
      });
    }
  };
  
  // Delete a chat
  const deleteCurrentChat = (chatId: string) => {
    const updatedChats = savedChats.filter(chat => chat.id !== chatId);
    setSavedChats(updatedChats);
    
    // Navigate to the home page or another chat
    if (updatedChats.length > 0) {
      router.push(`/${updatedChats[0].id}`);
    } else {
      router.push('/');
    }
  };
  
  // Save the current chat with deep comparison to prevent unnecessary re-renders
  const saveCurrentChat = (chat: SavedChat) => {
    setSavedChats(prevChats => {
      const existingChatIndex = prevChats.findIndex(c => c.id === chat.id);
      
      if (existingChatIndex >= 0) {
        // Compare with existing chat to only update if changed
        const existingChat = prevChats[existingChatIndex];
        const hasChanges = 
          JSON.stringify(existingChat.messages) !== JSON.stringify(chat.messages) ||
          existingChat.config.temperature !== chat.config.temperature ||
          JSON.stringify(existingChat.config.selectedPlugins) !== JSON.stringify(chat.config.selectedPlugins) ||
          existingChat.name !== chat.name;
        
        if (!hasChanges) {
          // No changes, return the same array to prevent re-render
          return prevChats;
        }
        
        // Update existing chat
        const updatedChats = [...prevChats];
        updatedChats[existingChatIndex] = chat;
        return updatedChats;
      } else {
        // Add new chat
        return [chat, ...prevChats];
      }
    });
    
    // Only update currentChat if it's different or null
    if (!currentChat || currentChat.id !== chat.id || 
        JSON.stringify(currentChat.messages) !== JSON.stringify(chat.messages) ||
        currentChat.config.temperature !== chat.config.temperature ||
        JSON.stringify(currentChat.config.selectedPlugins) !== JSON.stringify(chat.config.selectedPlugins)) {
      setCurrentChat(chat);
    }
  };
  
  return (
    <ChatContext.Provider
      value={{
        savedChats,
        loadSavedChat,
        createChat,
        updateChatName,
        deleteCurrentChat,
        saveCurrentChat,
        currentChat,
        isWelcomeTemplate
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