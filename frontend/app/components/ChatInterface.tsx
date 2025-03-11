'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Message, MessageRole } from './Message';
import { NewMessageCell } from './NewMessageCell';
import { LoadingMessage } from './LoadingMessage';
import { AddMessageHoverUI } from './AddMessageHoverUI';
import { useChatStore, Chat, ChatMessage } from '../context/ChatStore';

// Default configuration
const DEFAULT_CONFIG = {
  temperature: 0.7,
  selectedPlugins: []
};

// No need for props anymore
export function ChatInterface() {
  const { 
    currentChat,
    updateChatName,
    deleteAndNavigate,
    forkChat,
    addMessage,
    updateMessage,
    deleteMessage,
    simulateMessage,
    temperature,
    selectedPlugins
  } = useChatStore();
  
  // Early return if no chat is loaded
  if (!currentChat) {
    return (
      <div className="col-span-7 p-4 h-screen flex items-center justify-center">
        <div className="text-gray-500">No chat selected</div>
      </div>
    );
  }
  
  // Only use local state for UI-specific elements
  const [isSimulating, setIsSimulating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingChatName, setEditingChatName] = useState<string | null>(null);
  // Track whether to allow overwriting without confirmation
  const [allowOverwrite, setAllowOverwrite] = useState(false);
  
  // This helper is no longer needed with our new architecture, as we'll use 
  // the direct CRUD operations from the hooks instead, but keeping for compatibility
  // with existing code (will remove or refactor the references soon)
  const saveChanges = async (updatedMessages: ChatMessage[]) => {
    console.warn('saveChanges is deprecated, use direct CRUD operations instead');
    
    // Will implement a pass-through to new architecture here if needed by existing code
  }
  
  // Unified message handling function to reduce duplication
  const handleAddMessage = async (options: {
    role: MessageRole,
    content?: string,
    autoEdit?: boolean,
    position?: number | null // null means add to end
  }) => {
    const { role, content = '', autoEdit = true, position = null } = options;
    
    try {
      // Add message using the global hook, passing position if specified
      const messageId = await addMessage(role, content, position !== null ? position : undefined);
      
      // Set this new message to be in edit mode if autoEdit is true
      if (autoEdit) {
        setTimeout(() => {
          setEditingId(messageId);
        }, 50);
      }
      
      return messageId;
    } catch (err) {
      console.error('Failed to add message:', err);
      return '';
    }
  }
  
  // Convenience functions that use the unified message handler
  const handleAddMessageAtPosition = useCallback((afterIndex: number, role: MessageRole, content: string = '', autoEdit: boolean = true) => {
    return handleAddMessage({ role, content, autoEdit, position: afterIndex });
  }, [handleAddMessage]);
  
  const simpleAddMessage = useCallback((role: MessageRole, content: string = '', autoEdit: boolean = false) => {
    return handleAddMessage({ role, content, autoEdit });
  }, [handleAddMessage]);
  
  useEffect(() => {
    const handleAddNextMessage = (e: Event) => {
      const { afterId, role } = (e as CustomEvent).detail;
      // Find the index of the message with the given ID
      const index = currentChat.messages.findIndex(msg => msg.id === afterId);
      if (index !== -1) {
        handleAddMessageAtPosition(index, role, '', true);
      }
    };
    
    window.addEventListener('addNextMessage', handleAddNextMessage);
    return () => window.removeEventListener('addNextMessage', handleAddNextMessage);
  }, [currentChat.messages, handleAddMessageAtPosition]);
  
  const handleUpdateMessage = async (messageId: string, content: string) => {
    try {
      // Update using the global hook
      await updateMessage(messageId, content);
      
      // Clear the editing ID
      setEditingId(null);
    } catch (err) {
      console.error('Failed to update message:', err);
    }
  }
  
  const handleDeleteMessage = async (messageId: string) => {
    try {
      // Delete using the global hook but catch and handle any errors locally
      await deleteMessage(messageId);
    } catch (err) {
      console.error('Failed to delete message:', err);
      // Don't rethrow - we want to handle errors locally
    }
  }
  
  const handleQuickAdd = useCallback((role: MessageRole) => {
    simpleAddMessage(role, '', true); // We still want editing for the quick-add buttons
  }, []);
  
  // Fork the current chat
  const handleForkChat = useCallback(async () => {
    const newName = prompt('Enter a name for this forked chat:');
    if (!newName) return;
    
    try {
      // Use the store hook for forking chats
      await forkChat(currentChat.id, newName);
    } catch (err) {
      console.error('Failed to fork chat:', err);
    }
  }, [forkChat, currentChat.id]);
  
  // Helper function to get simulated response
  const getSimulatedResponse = () => {
    // Check if plugins setting exists
    const pluginsSetting = currentChat.config.settings.find(
      setting => setting.id === 'plugins' && setting.type === 'multiselect'
    );
    
    let pluginsDescription = '';
    if (pluginsSetting) {
      // If plugins setting exists, describe it
      if (selectedPlugins.length > 0) {
        // Just use the plugin IDs directly since we don't have the mapping anymore
        // The backend has these definitions now
        pluginsDescription = `With access to the following plugins: ${selectedPlugins.join(', ')}.`;
      } else {
        pluginsDescription = 'Without access to any plugins.';
      }
    }
    
    // Find any JSON settings to include in the response
    const jsonSettings = currentChat.config.settings
      .filter(setting => {
        if (setting.type !== 'json') return false;
        if (setting.value.trim() === '{}') return false;
        
        // Only include valid JSON
        try {
          JSON.parse(setting.value);
          return true;
        } catch (e) {
          return false;
        }
      })
      .map(setting => `${setting.name}: ${setting.value}`);
    
    const jsonDescription = jsonSettings.length > 0 
      ? `\nUsing custom configuration: ${jsonSettings.join(', ')}` 
      : '';
    
    // Find any text settings to include
    const textSettings = currentChat.config.settings
      .filter(setting => setting.type === 'text' && setting.value.trim())
      .map(setting => `${setting.name}: ${setting.value}`);
    
    const textDescription = textSettings.length > 0
      ? `\nWith parameters: ${textSettings.join(', ')}`
      : '';
    
    // Find any enabled checkboxes
    const enabledFeatures = currentChat.config.settings
      .filter(setting => setting.type === 'checkbox' && (setting as any).value === true)
      .map(setting => setting.name);
      
    // Find any radio button selections
    const radioSelections = currentChat.config.settings
      .filter(setting => setting.type === 'radio' && (setting as any).value)
      .map(setting => {
        const selectedOption = (setting as any).options.find(
          (opt: any) => opt.id === (setting as any).value
        );
        return selectedOption ? `${setting.name}: ${selectedOption.name}` : null;
      })
      .filter(Boolean); // Remove null values
    
    const featuresDescription = enabledFeatures.length > 0
      ? `\nEnabled features: ${enabledFeatures.join(', ')}`
      : '';
    
    // Compile radio selections description
    const radioDescription = radioSelections.length > 0
      ? `\nSelected options: ${radioSelections.join(', ')}`
      : '';
    
    return `This is a simulated AI response (temperature: ${temperature}) based on the conversation history. ` +
      `${pluginsDescription}` +
      `${jsonDescription}` +
      `${textDescription}` +
      `${radioDescription}` +
      `${featuresDescription}` +
      `\nIn a real implementation, this would be generated by calling an AI model API with the entire message history.`;
  }
  
  // Handle re-simulation of a specific message
  const handleResimulate = (messageId: string) => {
    // Make sure there's at least one user message to respond to
    const hasUserMessage = currentChat.messages.some(msg => msg.role === 'user');
    if (!hasUserMessage) {
      alert('Please add at least one user message before simulating.');
      return;
    }
    
    handleSimulateMessage(messageId);
  }
  
  // Helper function to simulate a message
  const handleSimulateMessage = async (messageId: string) => {
    setIsSimulating(true);
    
    try {
      // Use our store's simulateMessage function
      await simulateMessage(messageId);
    } catch (error) {
      console.error('Simulation error:', error);
    } finally {
      setIsSimulating(false);
    }
  }
  
  // Main simulation function
  const handleSimulate = async () => {
    // Make sure there's at least one user message to respond to
    if (!currentChat.messages.some(msg => msg.role === 'user')) {
      alert('Please add at least one user message before simulating.');
      return;
    }
    
    // Check if the last message is an assistant message
    const lastMessage = currentChat.messages[currentChat.messages.length - 1];
    
    // If the last message is an assistant message, we should update it instead of adding a new one
    if (lastMessage && lastMessage.role === 'assistant') {
      // Only confirm if the message already has content and allowOverwrite is false
      if (lastMessage.content.trim() && !allowOverwrite) {
        if (!confirm('Replace the last assistant message with a new simulation?')) {
          return;
        }
      }
      
      // Re-simulate the last message
      await handleSimulateMessage(lastMessage.id);
      return;
    }
    
    // Add a new assistant message and simulate it
    const messageId = await addMessage('assistant', '');
    
    // Simulate the new message
    await handleSimulateMessage(messageId);
  }
  
  // Chat name handling
  const handleUpdateChatName = async (chatId: string, newName: string) => {
    if (!newName.trim()) return;
    
    try {
      // Update name using the store
      await updateChatName(chatId, newName);
      setEditingChatName(null);
    } catch (err) {
      console.error('Failed to update chat name:', err);
    }
  }
  
  // Delete chat
  const handleDeleteChat = async (chatId: string) => {
    if (!confirm('Are you sure you want to delete this chat?')) return;
    
    try {
      await deleteAndNavigate(chatId);
    } catch (err) {
      console.error('Failed to delete chat:', err);
    }
  }

  return (
    <div className="col-span-7 p-4 h-screen overflow-y-auto">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-bold">Chat Simulation</h1>
          <div className="flex gap-2 items-center">
            <button
              onClick={handleForkChat}
              className="px-2 py-1 text-sm border rounded hover:bg-gray-50 flex items-center gap-1"
            >
              <ForkIcon />
              <span>Fork</span>
            </button>
            <button
              onClick={handleSimulate}
              disabled={isSimulating}
              className="px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 flex items-center gap-1"
            >
              {isSimulating ? (
                <>
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-solid border-white border-t-transparent"></span>
                  Simulating...
                </>
              ) : (
                'Simulate Chat'
              )}
            </button>
            
            {/* Allow Overwrite Toggle with Simple Tooltip */}
            <div className="relative group">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowOverwrite}
                  onChange={() => setAllowOverwrite(prev => !prev)}
                  className="sr-only peer"
                />
                <div className={`relative w-9 h-5 ${allowOverwrite ? 'bg-green-500' : 'bg-gray-200'} peer-focus:outline-none rounded-full peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all`}></div>
                <span className="ml-1 text-xs text-gray-500">Overwrite</span>
              </label>
              
              {/* Tooltip positioned to the bottom-left to avoid settings panel */}
              <div className="absolute bottom-[-100px] left-[-100px] mb-2 w-48 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-900 text-white text-xs rounded py-1 px-2 pointer-events-none z-[100] shadow-lg">
                When enabled, allows overwriting the most recent assistant message without requesting confirmation.
              </div>
            </div>
          </div>
        </div>
        
        {/* Chat name with edit capability */}
        <div className="flex items-center">
          {editingChatName === currentChat.id ? (
            <div className="flex items-center w-full">
              <input
                type="text"
                defaultValue={currentChat.name}
                className="flex-1 p-2 border rounded text-lg font-medium"
                autoFocus
                onBlur={(e) => handleUpdateChatName(currentChat.id, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleUpdateChatName(currentChat.id, e.currentTarget.value);
                  } else if (e.key === 'Escape') {
                    setEditingChatName(null);
                  }
                }}
              />
            </div>
          ) : (
            <div className="flex items-center group">
              <h2 
                className="text-lg font-medium cursor-pointer flex-1 hover:text-blue-600"
                onClick={() => setEditingChatName(currentChat.id)}
              >
                {currentChat.name}
              </h2>
              <button
                onClick={() => setEditingChatName(currentChat.id)}
                className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
                title="Edit name"
              >
                <EditIcon />
              </button>
              <button
                onClick={() => handleDeleteChat(currentChat.id)}
                className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 text-red-500 rounded"
                title="Delete chat"
              >
                <TrashIcon />
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div>
        {currentChat.messages.map((message, index) => (
          <div key={message.id}>
            {message.isLoading ? (
              <LoadingMessage />
            ) : (
              <Message
                id={message.id}
                role={message.role}
                content={message.content}
                onUpdate={handleUpdateMessage}
                onDelete={handleDeleteMessage}
                onResimulate={message.role === 'assistant' ? handleResimulate : undefined}
                isEditingOverride={message.id === editingId}
              />
            )}
            {/* Add the hover UI after each message except the last one */}
            {index < currentChat.messages.length - 1 && (
              <AddMessageHoverUI 
                onAdd={(role) => {
                  const position = currentChat.messages.findIndex(msg => msg.id === message.id);
                  handleAddMessageAtPosition(position, role, '', true);
                }} 
              />
            )}
          </div>
        ))}
        
        {/* Add hover UI after the last message */}
        {currentChat.messages.length > 0 && (
          <AddMessageHoverUI onAdd={handleQuickAdd} />
        )}
        
        <NewMessageCell onAdd={simpleAddMessage} />
      </div>
    </div>
  );
}

function EditIcon() {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="12" 
      height="12" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
    </svg>
  );
}

function ForkIcon() {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="14" 
      height="14" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <circle cx="12" cy="18" r="3"></circle>
      <circle cx="6" cy="6" r="3"></circle>
      <circle cx="18" cy="6" r="3"></circle>
      <path d="M18 9v1a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9"></path>
      <path d="M12 12v6"></path>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="12" 
      height="12" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M3 6h18"></path>
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
    </svg>
  );
}