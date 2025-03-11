'use client';

import React, { createContext, useContext, useReducer, useCallback, useMemo, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '../lib/api';

// Define core types
export interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  isLoading?: boolean;
}

export interface ChatSetting {
  id: string; // Backend-generated UUID
  name: string;
  type: string;
  value: any;
  options?: Array<{ id: string; name: string }>;
}

export interface Chat {
  id: string;
  name: string;
  messages: ChatMessage[];
  config: {
    settings: ChatSetting[];
  };
  updatedAt: string;
}

export interface ChatSummary {
  id: string;
  name: string;
  updatedAt: string;
}

// Define the state shape
interface ChatStoreState {
  // Data
  chatList: ChatSummary[];
  currentChat: Chat | null;
  
  // UI states
  isLoadingList: boolean;
  isLoadingChat: boolean;
  isSaving: boolean;
  error: string | null;
}

// Define action types
type ChatStoreAction =
  | { type: 'SET_CHAT_LIST', payload: ChatSummary[] }
  | { type: 'SET_CURRENT_CHAT', payload: Chat | null }
  | { type: 'SET_LOADING_LIST', payload: boolean }
  | { type: 'SET_LOADING_CHAT', payload: boolean }
  | { type: 'SET_SAVING', payload: boolean }
  | { type: 'SET_ERROR', payload: string | null }
  | { type: 'UPDATE_CHAT_NAME', payload: { id: string, name: string } }
  | { type: 'ADD_MESSAGE', payload: { message: ChatMessage } }
  | { type: 'INSERT_MESSAGE', payload: { message: ChatMessage, position: number } }
  | { type: 'UPDATE_MESSAGE', payload: { messageId: string, content: string } }
  | { type: 'DELETE_MESSAGE', payload: { messageId: string } }
  | { type: 'REPLACE_TEMP_MESSAGE', payload: { tempId: string, message: ChatMessage } }
  | { type: 'REMOVE_TEMP_MESSAGE', payload: { tempId: string } }
  | { type: 'UPDATE_SETTING', payload: { settingId: string, value: any } }
  | { type: 'ADD_SETTING', payload: { setting: ChatSetting } }
  | { type: 'REMOVE_SETTING', payload: { settingId: string } };

// Define the context type
interface ChatStoreContextType {
  state: ChatStoreState;
  dispatch: React.Dispatch<ChatStoreAction>;
  
  // Actions
  loadChatList: () => Promise<void>;
  loadChat: (chatId: string) => Promise<void>;
  createChat: (name?: string, systemMessage?: string) => Promise<string>;
  updateChatName: (chatId: string, newName: string) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  
  // Message operations
  addMessage: (role: 'system' | 'user' | 'assistant', content: string) => Promise<string>;
  updateMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  
  // Setting operations
  updateSetting: (settingId: string, value: any) => Promise<void>;
  addSetting: (setting: ChatSetting) => Promise<void>;
  removeSetting: (settingId: string) => Promise<void>;
  
  // Navigation
  navigateToChat: (chatId: string) => void;
  navigateToHome: () => void;
  
  // Simulation
  simulateMessage: (messageId: string) => Promise<void>;
  
  // Combined operations
  createAndNavigate: (name?: string, systemMessage?: string) => Promise<void>;
  deleteAndNavigate: (chatId: string) => Promise<void>;
  forkChat: (chatId: string, newName: string) => Promise<void>;
}

// Utility functions for converting API data
function convertApiChatToChat(apiChat: any): Chat {
  // Convert messages
  const messages: ChatMessage[] = apiChat.messages?.map((msg: any) => ({
    id: msg.id,
    role: msg.role as 'system' | 'user' | 'assistant',
    content: msg.content
  })) || [];

  // Convert settings
  const settings: ChatSetting[] = apiChat.settings?.map((setting: any) => {
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
      id: setting.id,
      name: setting.name,
      type: setting.type,
      value,
      options: setting.options?.map((opt: any) => ({
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

function convertApiChatListToSummaries(apiChats: any[]): ChatSummary[] {
  return apiChats.map(chat => ({
    id: chat.id,
    name: chat.name,
    updatedAt: chat.updated_at
  }));
}

// Create the context
const ChatStoreContext = createContext<ChatStoreContextType | undefined>(undefined);

// Initial state
const initialState: ChatStoreState = {
  chatList: [],
  currentChat: null,
  isLoadingList: false,
  isLoadingChat: false,
  isSaving: false,
  error: null
};

// Reducer function
function chatStoreReducer(state: ChatStoreState, action: ChatStoreAction): ChatStoreState {
  switch (action.type) {
    case 'SET_CHAT_LIST':
      return { ...state, chatList: action.payload };
      
    case 'SET_CURRENT_CHAT':
      return { ...state, currentChat: action.payload };
      
    case 'SET_LOADING_LIST':
      return { ...state, isLoadingList: action.payload };
      
    case 'SET_LOADING_CHAT':
      return { ...state, isLoadingChat: action.payload };
      
    case 'SET_SAVING':
      return { ...state, isSaving: action.payload };
      
    case 'SET_ERROR':
      return { ...state, error: action.payload };
      
    case 'UPDATE_CHAT_NAME':
      // Update both current chat and chat list
      return {
        ...state,
        currentChat: state.currentChat && state.currentChat.id === action.payload.id
          ? { ...state.currentChat, name: action.payload.name }
          : state.currentChat,
        chatList: state.chatList.map(chat => 
          chat.id === action.payload.id
            ? { ...chat, name: action.payload.name }
            : chat
        )
      };
      
    case 'ADD_MESSAGE':
      // Only update current chat - add message to end
      return {
        ...state,
        currentChat: state.currentChat
          ? {
              ...state.currentChat,
              messages: [...state.currentChat.messages, action.payload.message],
              updatedAt: new Date().toISOString()
            }
          : null
      };
    
    case 'INSERT_MESSAGE':
      // Insert message at specific position
      return {
        ...state,
        currentChat: state.currentChat
          ? {
              ...state.currentChat,
              messages: [
                ...state.currentChat.messages.slice(0, action.payload.position),
                action.payload.message,
                ...state.currentChat.messages.slice(action.payload.position)
              ],
              updatedAt: new Date().toISOString()
            }
          : null
      };
      
    case 'UPDATE_MESSAGE':
      // Only update current chat
      return {
        ...state,
        currentChat: state.currentChat
          ? {
              ...state.currentChat,
              messages: state.currentChat.messages.map(msg =>
                msg.id === action.payload.messageId
                  ? { ...msg, content: action.payload.content }
                  : msg
              ),
              updatedAt: new Date().toISOString()
            }
          : null
      };
      
    case 'DELETE_MESSAGE':
      // Only update current chat
      return {
        ...state,
        currentChat: state.currentChat
          ? {
              ...state.currentChat,
              messages: state.currentChat.messages.filter(
                msg => msg.id !== action.payload.messageId
              ),
              updatedAt: new Date().toISOString()
            }
          : null
      };
      
    case 'REPLACE_TEMP_MESSAGE':
      // Replace a temporary message with the real one from backend
      return {
        ...state,
        currentChat: state.currentChat
          ? {
              ...state.currentChat,
              messages: state.currentChat.messages.map(msg =>
                msg.id === action.payload.tempId
                  ? action.payload.message
                  : msg
              ),
              updatedAt: new Date().toISOString()
            }
          : null
      };
      
    case 'REMOVE_TEMP_MESSAGE':
      // Remove a temporary message (on error)
      return {
        ...state,
        currentChat: state.currentChat
          ? {
              ...state.currentChat,
              messages: state.currentChat.messages.filter(
                msg => msg.id !== action.payload.tempId
              ),
              updatedAt: new Date().toISOString()
            }
          : null
      };
      
    case 'UPDATE_SETTING':
      // Only update current chat settings
      return {
        ...state,
        currentChat: state.currentChat
          ? {
              ...state.currentChat,
              config: {
                ...state.currentChat.config,
                settings: state.currentChat.config.settings.map(setting =>
                  setting.id === action.payload.settingId
                    ? { ...setting, value: action.payload.value }
                    : setting
                )
              }
            }
          : null
      };
      
    case 'ADD_SETTING':
      // Only update current chat settings
      return {
        ...state,
        currentChat: state.currentChat
          ? {
              ...state.currentChat,
              config: {
                ...state.currentChat.config,
                settings: [
                  ...state.currentChat.config.settings,
                  action.payload.setting
                ]
              }
            }
          : null
      };
      
    case 'REMOVE_SETTING':
      // Only update current chat settings
      return {
        ...state,
        currentChat: state.currentChat
          ? {
              ...state.currentChat,
              config: {
                ...state.currentChat.config,
                settings: state.currentChat.config.settings.filter(
                  setting => setting.id !== action.payload.settingId
                )
              }
            }
          : null
      };
      
    default:
      return state;
  }
}

// Provider component
export function ChatStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(chatStoreReducer, initialState);
  const router = useRouter();
  const pathname = usePathname();
  
  // Load chat list
  const loadChatList = useCallback(async () => {
    dispatch({ type: 'SET_LOADING_LIST', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    
    try {
      const chats = await api.getChats();
      dispatch({ type: 'SET_CHAT_LIST', payload: convertApiChatListToSummaries(chats) });
    } catch (err) {
      console.error('Failed to load chat list:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load chat list' });
    } finally {
      dispatch({ type: 'SET_LOADING_LIST', payload: false });
    }
  }, []);
  
  // Load specific chat
  const loadChat = useCallback(async (chatId: string) => {
    if (!chatId) return;
    
    // Don't reload if we already have the same chat
    if (state.currentChat?.id === chatId) return;
    
    dispatch({ type: 'SET_LOADING_CHAT', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    
    try {
      const chat = await api.getChat(chatId);
      dispatch({ type: 'SET_CURRENT_CHAT', payload: convertApiChatToChat(chat) });
    } catch (err) {
      console.error('Failed to load chat:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load chat' });
      
      // If failed to load, clear current chat
      dispatch({ type: 'SET_CURRENT_CHAT', payload: null });
    } finally {
      dispatch({ type: 'SET_LOADING_CHAT', payload: false });
    }
  }, [state.currentChat?.id]);
  
  // Create new chat
  const createChat = useCallback(async (
    name?: string,
    systemMessage: string = 'You are a helpful assistant.'
  ) => {
    dispatch({ type: 'SET_SAVING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    
    try {
      const defaultName = name || `New Chat ${new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
      })}`;
      
      // Create in API
      const newChat = await api.createChat(defaultName, systemMessage);
      
      // Update chat list
      await loadChatList();
      
      return newChat.id;
    } catch (err) {
      console.error('Failed to create chat:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create chat' });
      throw err;
    } finally {
      dispatch({ type: 'SET_SAVING', payload: false });
    }
  }, [loadChatList]);
  
  // Update chat name
  const updateChatName = useCallback(async (chatId: string, newName: string) => {
    if (!newName.trim()) return;
    
    dispatch({ type: 'SET_SAVING', payload: true });
    
    try {
      // Optimistic update
      dispatch({ type: 'UPDATE_CHAT_NAME', payload: { id: chatId, name: newName.trim() } });
      
      // Update in API
      await api.updateChat(chatId, newName.trim());
    } catch (err) {
      console.error('Failed to update chat name:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update chat name' });
      
      // Refresh both chat list and current chat to restore correct state
      loadChatList();
      if (state.currentChat?.id === chatId) {
        loadChat(chatId);
      }
      
      throw err;
    } finally {
      dispatch({ type: 'SET_SAVING', payload: false });
    }
  }, [loadChatList, loadChat, state.currentChat?.id]);
  
  // Delete chat
  const deleteChat = useCallback(async (chatId: string) => {
    dispatch({ type: 'SET_SAVING', payload: true });
    
    try {
      // Delete from API
      await api.deleteChat(chatId);
      
      // Update state if current chat was deleted
      if (state.currentChat?.id === chatId) {
        dispatch({ type: 'SET_CURRENT_CHAT', payload: null });
      }
      
      // Refresh chat list
      await loadChatList();
    } catch (err) {
      console.error('Failed to delete chat:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete chat' });
      throw err;
    } finally {
      dispatch({ type: 'SET_SAVING', payload: false });
    }
  }, [loadChatList, state.currentChat?.id]);
  
  // Message operations
  
  // Add message
  const addMessage = useCallback(async (
    role: 'system' | 'user' | 'assistant', 
    content: string = '',
    position?: number // New position parameter for inserting at specific index
  ) => {
    if (!state.currentChat) throw new Error('No chat is currently loaded');
    
    // Create a temporary loading state for UI feedback
    const tempId = `temp-${crypto.randomUUID()}`;
    
    // If position is specified, we need to insert at that position
    if (position !== undefined) {
      // We need to create a custom reducer action for position-specific inserts
      dispatch({
        type: 'INSERT_MESSAGE',
        payload: {
          message: { id: tempId, role, content, isLoading: true },
          position: position + 1 // Insert after the specified position
        }
      });
    } else {
      // Default behavior: add to end
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          message: { id: tempId, role, content, isLoading: true }
        }
      });
    }
    
    try {
      // Create in API - note that the API might not support ordering
      // Let the backend generate the real UUID
      const sequence = position !== undefined ? position + 1 : undefined;
      const response = await api.createMessage(state.currentChat.id, role, content, sequence);
      
      // Replace temporary message with the real one from backend
      dispatch({
        type: 'REPLACE_TEMP_MESSAGE',
        payload: {
          tempId,
          message: {
            id: response.id,
            role: response.role as 'system' | 'user' | 'assistant',
            content: response.content
          }
        }
      });
      
      return response.id;
    } catch (err) {
      console.error('Failed to add message:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add message' });
      
      // Remove the temporary message on error
      dispatch({
        type: 'REMOVE_TEMP_MESSAGE',
        payload: { tempId }
      });
      
      // Reload chat to get correct state
      const chatId = state.currentChat.id; // Store ID before potential state changes
      loadChat(chatId);
      
      throw err;
    }
  }, [state.currentChat, loadChat]);
  
  // Update message
  const updateMessage = useCallback(async (messageId: string, content: string) => {
    if (!state.currentChat) return;
    
    // Optimistically update UI
    dispatch({
      type: 'UPDATE_MESSAGE',
      payload: { messageId, content }
    });
    
    try {
      // Update in API
      await api.updateMessage(state.currentChat.id, messageId, content);
    } catch (err) {
      console.error('Failed to update message:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update message' });
      
      // Reload chat to get correct state
      loadChat(state.currentChat.id);
      
      throw err;
    }
  }, [state.currentChat, loadChat]);
  
  // Delete message
  const deleteMessage = useCallback(async (messageId: string) => {
    if (!state.currentChat) return;
    
    // Store chat ID for error recovery
    const chatId = state.currentChat.id;
    
    // Optimistically update UI
    dispatch({
      type: 'DELETE_MESSAGE',
      payload: { messageId }
    });
    
    try {
      // Delete in API
      await api.deleteMessage(chatId, messageId);
    } catch (err) {
      console.error('Failed to delete message:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete message' });
      
      // Reload chat to get correct state, but use the stored chatId
      // as state.currentChat might have changed
      loadChat(chatId);
      
      throw err;
    }
  }, [state.currentChat, loadChat]);
  
  // Setting operations
  
  // Update setting
  const updateSetting = useCallback(async (settingId: string, value: any) => {
    if (!state.currentChat) return;
    
    // Optimistically update UI
    dispatch({
      type: 'UPDATE_SETTING',
      payload: { settingId, value }
    });
    
    try {
      // Convert value to string for API
      let valueStr = String(value);
      if (typeof value === 'object') {
        valueStr = JSON.stringify(value);
      }
      
      // Update in API - using UUID directly as parameter
      await api.updateSetting(state.currentChat.id, settingId, valueStr);
    } catch (err) {
      console.error('Failed to update setting:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update setting' });
      
      // Reload chat to get correct state
      loadChat(state.currentChat.id);
      
      throw err;
    }
  }, [state.currentChat, loadChat]);
  
  // Add setting
  const addSetting = useCallback(async (setting: ChatSetting) => {
    if (!state.currentChat) return;
    
    // We won't do optimistic update here since we need the backend-generated ID
    // First create in backend, then update UI
    
    try {
      // Convert value to string for API
      let valueStr = String(setting.value);
      if (typeof setting.value === 'object') {
        valueStr = JSON.stringify(setting.value);
      }
      
      // Create in API (backend will generate the UUID)
      const response = await api.createSetting(state.currentChat.id, {
        name: setting.name,
        type: setting.type,
        value: valueStr,
        options: setting.options?.map(opt => ({
          id: opt.id,
          name: opt.name
        }))
      });
      
      // Update UI with the backend-created setting that includes the proper UUID
      dispatch({
        type: 'ADD_SETTING',
        payload: { 
          setting: {
            id: response.id,
            name: response.name,
            type: response.type,
            value: response.type === 'checkbox' 
              ? response.value === 'true'
              : response.type === 'multiselect'
                ? JSON.parse(response.value || '[]')
                : response.value,
            options: response.options || []
          }
        }
      });
    } catch (err) {
      console.error('Failed to add setting:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add setting' });
      
      // Reload chat to get correct state
      loadChat(state.currentChat.id);
      
      throw err;
    }
  }, [state.currentChat, loadChat]);
  
  // Remove setting
  const removeSetting = useCallback(async (settingId: string) => {
    if (!state.currentChat) return;
    
    // Optimistically update UI
    dispatch({
      type: 'REMOVE_SETTING',
      payload: { settingId }
    });
    
    try {
      // Delete in API using UUID directly
      await api.deleteSetting(state.currentChat.id, settingId);
    } catch (err) {
      console.error('Failed to remove setting:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to remove setting' });
      
      // Reload chat to get correct state
      loadChat(state.currentChat.id);
      
      throw err;
    }
  }, [state.currentChat, loadChat]);
  
  // Navigation helpers
  const navigateToChat = useCallback((chatId: string) => {
    router.push(`/${chatId}`);
  }, [router]);
  
  const navigateToHome = useCallback(() => {
    router.push('/');
  }, [router]);
  
  // Simulation (for client-side demo purposes)
  const simulateMessage = useCallback(async (messageId: string) => {
    if (!state.currentChat) return;
    
    // First mark as empty/loading
    await updateMessage(messageId, '');
    
    // Simulate a delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate a simulated response
    const simulatedResponse = generateSimulatedResponse();
    
    // Update with simulated response
    await updateMessage(messageId, simulatedResponse);
  }, [state.currentChat, updateMessage]);
  
  // Helper to generate a simulated response (simplified)
  function generateSimulatedResponse() {
    const temperature = state.currentChat?.config?.settings?.find(
      s => s.type === 'temperature'
    )?.value || 0.7;
    
    return `This is a simulated AI response (temperature: ${temperature}) based on the conversation history.`;
  }
  
  // Combined operations
  
  // Create chat and navigate to it
  const createAndNavigate = useCallback(async (
    name?: string,
    systemMessage?: string
  ) => {
    // First create the chat
    const chatId = await createChat(name, systemMessage);
    
    // After chat is created, navigate to it
    // We don't need to load the chat, as the route change will trigger that
    navigateToChat(chatId);
  }, [createChat, navigateToChat]);
  
  // Delete chat and navigate elsewhere
  const deleteAndNavigate = useCallback(async (chatId: string) => {
    // First delete the chat
    await deleteChat(chatId);
    
    // Then navigate
    if (state.chatList.length > 0) {
      // Navigate to first available chat
      const firstChat = state.chatList.find(c => c.id !== chatId);
      if (firstChat) {
        navigateToChat(firstChat.id);
      } else {
        navigateToHome();
      }
    } else {
      // No chats left, go to home
      navigateToHome();
    }
  }, [deleteChat, state.chatList, navigateToChat, navigateToHome]);
  
  // Fork (duplicate) chat
  const forkChat = useCallback(async (chatId: string, newName: string) => {
    // Load source chat if not currently loaded
    if (state.currentChat?.id !== chatId) {
      await loadChat(chatId);
    }
    
    if (!state.currentChat) return;
    
    // Create new chat with same system message
    const systemMessage = state.currentChat.messages.find(
      msg => msg.role === 'system'
    )?.content || 'You are a helpful assistant.';
    
    const newChatId = await createChat(newName, systemMessage);
    
    // Navigate to new chat - load will happen due to route change
    navigateToChat(newChatId);
    
    // We'll copy messages and settings after navigation in useEffect
    // This prevents the double loading issue
    sessionStorage.setItem('pendingChatFork', JSON.stringify({
      sourceId: chatId,
      targetId: newChatId
    }));
  }, [state.currentChat, loadChat, createChat, navigateToChat]);
  
  // Load chats on mount
  useEffect(() => {
    loadChatList();
  }, [loadChatList]);
  
  // Handle URL-based chat loading
  useEffect(() => {
    if (pathname === '/') {
      // Home route, no chat to load
      dispatch({ type: 'SET_CURRENT_CHAT', payload: null });
      return;
    }
    
    // Extract chat ID from URL
    const chatId = pathname.replace('/', '');
    if (chatId) {
      loadChat(chatId);
    }
  }, [pathname, loadChat]);
  
  // Handle pending chat fork (to avoid the double loading issue)
  useEffect(() => {
    const pendingForkJson = sessionStorage.getItem('pendingChatFork');
    if (!pendingForkJson) return;
    
    const pendingFork = JSON.parse(pendingForkJson);
    if (!pendingFork.sourceId || !pendingFork.targetId) return;
    
    // Clear pending fork 
    sessionStorage.removeItem('pendingChatFork');
    
    // Make sure we're on the target chat page
    if (pathname !== `/${pendingFork.targetId}`) return;
    
    // make sure source chat exists in our list
    const sourceChat = state.chatList.find(c => c.id === pendingFork.sourceId);
    if (!sourceChat) return;
    
    // Load source chat, then copy its contents to the new chat
    const completeFork = async () => {
      try {
        // Load source chat
        const sourceApiChat = await api.getChat(pendingFork.sourceId);
        const sourceChat = convertApiChatToChat(sourceApiChat);
        
        // Make sure we have a proper target chat
        if (!state.currentChat || state.currentChat.id !== pendingFork.targetId) return;
        
        // Copy non-system messages
        const messagesToCopy = sourceChat.messages.filter(msg => msg.role !== 'system');
        for (const msg of messagesToCopy) {
          await api.createMessage(pendingFork.targetId, msg.role, msg.content);
        }
        
        // Copy settings
        for (const setting of sourceChat.config.settings) {
          // Skip default settings
          const isDefaultSetting = setting.type === 'temperature';
          if (!isDefaultSetting) {
            let valueStr = String(setting.value);
            if (typeof setting.value === 'object') {
              valueStr = JSON.stringify(setting.value);
            }
            
            await api.createSetting(pendingFork.targetId, {
              setting_id: setting.id,
              name: setting.name,
              type: setting.type,
              value: valueStr,
              options: setting.options?.map(opt => ({
                id: opt.id,
                name: opt.name
              }))
            });
          }
        }
        
        // Reload current chat to reflect changes
        await loadChat(pendingFork.targetId);
      } catch (err) {
        console.error('Failed to complete fork:', err);
      }
    };
    
    completeFork();
  }, [pathname, state.chatList, state.currentChat, loadChat]);
  
  const contextValue = {
    state,
    dispatch,
    loadChatList,
    loadChat,
    createChat,
    updateChatName,
    deleteChat,
    addMessage,
    updateMessage,
    deleteMessage,
    updateSetting,
    addSetting,
    removeSetting,
    navigateToChat,
    navigateToHome,
    simulateMessage,
    createAndNavigate,
    deleteAndNavigate,
    forkChat
  };
  
  return (
    <ChatStoreContext.Provider value={contextValue}>
      {children}
    </ChatStoreContext.Provider>
  );
}

// Custom hook for consuming the context
export function useChatStore() {
  const context = useContext(ChatStoreContext);
  if (!context) {
    throw new Error('useChatStore must be used within a ChatStoreProvider');
  }
  
  // Memoize derived data to prevent rerenders
  const derivedData = useMemo(() => {
    const { state } = context;
    
    // Sort chats by updated_at
    const sortedChats = [...state.chatList].sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    
    // Get temperature from settings
    const temperature = state.currentChat?.config?.settings?.find(
      setting => setting.type === 'temperature'
    )?.value || 0.7;
    
    // Get selected plugins
    const pluginsSetting = state.currentChat?.config?.settings?.find(
      setting => setting.id === 'plugins' && setting.type === 'multiselect'
    );
    const selectedPlugins = pluginsSetting?.value || [];
    
    return {
      sortedChats,
      currentChat: state.currentChat,
      messages: state.currentChat?.messages || [],
      settings: state.currentChat?.config?.settings || [],
      temperature,
      selectedPlugins,
      isLoading: state.isLoadingList || state.isLoadingChat || state.isSaving,
      error: state.error
    };
  }, [context.state]);
  
  return {
    ...derivedData,
    ...context
  };
}