'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Message, MessageRole } from './Message';
import { NewMessageCell } from './NewMessageCell';
import { LoadingMessage } from './LoadingMessage';
import { AddMessageHoverUI } from './AddMessageHoverUI';
import { useChatContext } from '../context/ChatContext';
import { SavedChat, ChatMessage, companyPlugins, generateUUID } from '../lib/chats';

// Default configuration
const DEFAULT_CONFIG = {
  temperature: 0.7,
  selectedPlugins: []
};

interface ChatInterfaceProps {
  chat: SavedChat; // Now required since this component should only be used with a chat
}

export function ChatInterface({ chat }: ChatInterfaceProps) {
  const router = useRouter();
  const { 
    createChat, 
    updateChatName, 
    deleteCurrentChat, 
    saveCurrentChat 
  } = useChatContext();
  
  // Only use local state for UI-specific elements
  const [isSimulating, setIsSimulating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingChatName, setEditingChatName] = useState<string | null>(null);
  // Track whether to allow overwriting without confirmation
  const [allowOverwrite, setAllowOverwrite] = useState(false);
  
  // Helper function to save changes to the chat context
  const saveChanges = (updatedMessages: ChatMessage[]) => {
    // Ensure all messages have IDs
    const messagesWithIds = updatedMessages.map(msg => ({
      ...msg,
      id: msg.id || generateUUID()
    }));
    
    const updatedChat: SavedChat = {
      ...chat,
      messages: messagesWithIds,
      config: chat.config,
      updatedAt: new Date().toISOString()
    };
    
    saveCurrentChat(updatedChat);
  }
  
  // Unified message handling function to reduce duplication
  const addMessage = (options: {
    role: MessageRole,
    content?: string,
    autoEdit?: boolean,
    position?: number | null // null means add to end
  }) => {
    const { role, content = '', autoEdit = true, position = null } = options;
    
    // Create a new message object with ID and explicitly empty content if none provided
    const newMessage: ChatMessage = { 
      id: generateUUID(),
      role, 
      content: content || '' // Ensure content is explicitly an empty string if falsy
    };
    
    // Create a new messages array
    const updatedMessages = [...chat.messages];
    updatedMessages.splice(position === null ? updatedMessages.length : position + 1, 0, newMessage);
    
    // Save changes to context
    saveChanges(updatedMessages);
    
    // Set this new message to be in edit mode if autoEdit is true
    if (autoEdit) {
      setTimeout(() => {
        setEditingId(newMessage.id);
      }, 50);
    }
    
    return newMessage.id;
  }
  
  // Convenience functions that use the unified message handler
  const handleAddMessageAtPosition = (afterIndex: number, role: MessageRole, content: string = '', autoEdit: boolean = true) => {
    return addMessage({ role, content, autoEdit, position: afterIndex });
  }
  
  const handleAddMessage = (role: MessageRole, content: string = '', autoEdit: boolean = false) => {
    return addMessage({ role, content, autoEdit });
  }
  
  useEffect(() => {
    const handleAddNextMessage = (e: Event) => {
      const { afterId, role } = (e as CustomEvent).detail;
      // Find the index of the message with the given ID
      const index = chat.messages.findIndex(msg => msg.id === afterId);
      if (index !== -1) {
        handleAddMessageAtPosition(index, role, '', true);
      }
    };
    
    window.addEventListener('addNextMessage', handleAddNextMessage);
    return () => window.removeEventListener('addNextMessage', handleAddNextMessage);
  }, [chat.messages, handleAddMessageAtPosition]);
  
  const handleUpdateMessage = (messageId: string, content: string) => {
    const updatedMessages = chat.messages.map(msg => 
      msg.id === messageId ? { ...msg, content } : msg
    );
    
    // Save changes to context
    saveChanges(updatedMessages);
    
    // Clear the editing ID
    setEditingId(null);
  }
  
  const handleDeleteMessage = (messageId: string) => {
    const updatedMessages = chat.messages.filter(msg => msg.id !== messageId);
    
    // Save changes to context
    saveChanges(updatedMessages);
  }
  
  const handleQuickAdd = useCallback((role: MessageRole) => {
    handleAddMessage(role, '', true); // We still want editing for the quick-add buttons
  }, [handleAddMessage]);
  
  // Fork the current chat
  const handleForkChat = useCallback(() => {
    const newName = prompt('Enter a name for this forked chat:');
    if (!newName) return;
    
    // Get configuration from chat or use defaults
    const config = chat?.config ?? DEFAULT_CONFIG;
    
    // Ensure each message has an ID
    const messagesWithIds = chat.messages.map(msg => ({
      ...msg,
      id: msg.id || generateUUID()
    }));
    
    const newChat: SavedChat = {
      id: generateUUID(),
      name: newName,
      messages: messagesWithIds,
      config,
      updatedAt: new Date().toISOString()
    };
    
    saveCurrentChat(newChat);
  }, [chat, saveCurrentChat]);
  
  // Helper function to get simulated response
  const getSimulatedResponse = (config: { temperature: number, selectedPlugins: string[] }) => {
    let pluginsDescription = '';
    if (config.selectedPlugins.length > 0) {
      const pluginNames = config.selectedPlugins.map(id => {
        // Find the plugin name by ID
        return companyPlugins.find(p => p.id === id)?.name || id;
      });
      pluginsDescription = `With access to the following plugins: ${pluginNames.join(', ')}.`;
    } else {
      pluginsDescription = 'Without access to any plugins.';
    }
    
    return `This is a simulated AI response (temperature: ${config.temperature}) based on the conversation history. ` +
      `${pluginsDescription} ` +
      `In a real implementation, this would be generated by calling an AI model API with the entire message history.`;
  }
  
  // Handle re-simulation of a specific message
  const handleResimulate = (messageId: string) => {
    // Make sure there's at least one user message to respond to
    const hasUserMessage = chat.messages.some(msg => msg.role === 'user');
    if (!hasUserMessage) {
      alert('Please add at least one user message before simulating.');
      return;
    }
    
    simulateMessage(messageId, chat.messages);
  }
  
  // Helper function to simulate a message
  const simulateMessage = async (messageId: string, messages: ChatMessage[]) => {
    setIsSimulating(true);
    
    // Mark the message as loading
    const updatedMessages = messages.map(msg => 
      msg.id === messageId ? { ...msg, isLoading: true } : msg
    );
    saveChanges(updatedMessages);
    
    try {
      // Get configuration from chat or use defaults
      const config = chat?.config ?? DEFAULT_CONFIG;
      
      // Simulated response for demo purposes
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update the message with the simulated response
      saveChanges(updatedMessages.map(msg => 
        msg.id === messageId 
          ? { ...msg, content: getSimulatedResponse(config), isLoading: false } 
          : msg
      ));
    } catch (error) {
      console.error('Simulation error:', error);
      
      // Reset loading state if there's an error
      saveChanges(updatedMessages.map(msg => 
        msg.id === messageId ? { ...msg, isLoading: false } : msg
      ));
    } finally {
      setIsSimulating(false);
    }
  }
  
  // Main simulation function
  const handleSimulate = async () => {
    // Make sure there's at least one user message to respond to
    if (!chat.messages.some(msg => msg.role === 'user')) {
      alert('Please add at least one user message before simulating.');
      return;
    }
    
    // Check if the last message is an assistant message
    const lastMessage = chat.messages[chat.messages.length - 1];
    
    // If the last message is an assistant message, we should update it instead of adding a new one
    if (lastMessage && lastMessage.role === 'assistant') {
      // Only confirm if the message already has content and allowOverwrite is false
      if (lastMessage.content.trim() && !allowOverwrite) {
        if (!confirm('Replace the last assistant message with a new simulation?')) {
          return;
        }
      }
      
      // Re-simulate the last message
      await simulateMessage(lastMessage.id, chat.messages);
      return;
    }
    
    // Add a new assistant message and simulate it
    const newMessage: ChatMessage = { 
      id: generateUUID(),
      role: 'assistant', 
      content: ''
    };
    
    const updatedMessages = [...chat.messages, newMessage];
    saveChanges(updatedMessages);
    
    await simulateMessage(newMessage.id, updatedMessages);
  }
  
  // Chat name handling
  const handleUpdateChatName = (chatId: string, newName: string) => {
    if (!newName.trim()) return;
    
    // Update name in context
    updateChatName(chatId, newName);
    setEditingChatName(null);
  }
  
  // Delete chat
  const handleDeleteChat = (chatId: string) => {
    if (!confirm('Are you sure you want to delete this chat?')) return;
    deleteCurrentChat(chatId);
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
          {editingChatName === chat.id ? (
            <div className="flex items-center w-full">
              <input
                type="text"
                defaultValue={chat.name}
                className="flex-1 p-2 border rounded text-lg font-medium"
                autoFocus
                onBlur={(e) => handleUpdateChatName(chat.id, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleUpdateChatName(chat.id, e.currentTarget.value);
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
                onClick={() => setEditingChatName(chat.id)}
              >
                {chat.name}
              </h2>
              <button
                onClick={() => setEditingChatName(chat.id)}
                className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
                title="Edit name"
              >
                <EditIcon />
              </button>
              <button
                onClick={() => handleDeleteChat(chat.id)}
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
        {chat.messages.map((message, index) => (
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
            {index < chat.messages.length - 1 && (
              <AddMessageHoverUI 
                onAdd={(role) => {
                  const position = chat.messages.findIndex(msg => msg.id === message.id);
                  handleAddMessageAtPosition(position, role, '', true);
                }} 
              />
            )}
          </div>
        ))}
        
        {/* Add hover UI after the last message */}
        {chat.messages.length > 0 && (
          <AddMessageHoverUI onAdd={handleQuickAdd} />
        )}
        
        <NewMessageCell onAdd={handleAddMessage} />
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