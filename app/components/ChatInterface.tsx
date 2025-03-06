'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingChatName, setEditingChatName] = useState<string | null>(null);
  const [loadingMessageId, setLoadingMessageId] = useState<string | null>(null);
  
  // Get current pathname to help with forced remounting
  const pathname = usePathname();

  // Initialize draft messages directly from props - completely stateless with respect to chat
  // The key pattern in parent components ensures this is always initialized with fresh data
  const [draftMessages, setDraftMessages] = useState<ChatMessage[]>(() => {
    return chat.messages;
  });
  
  // Helper function to save changes without using useEffect
  const saveChanges = useCallback((updatedMessages: ChatMessage[]) => {    
    const updatedChat: SavedChat = {
      ...chat,
      messages: updatedMessages,
      config: chat.config,
      updatedAt: new Date().toISOString()
    };
    
    saveCurrentChat(updatedChat);
  }, [chat, saveCurrentChat]);
  
  // Function to create a new chat from current messages - memoized to avoid dependency cycles
  const createNewChatFromMessages = useCallback((currentMessages: ChatMessage[]) => {
    const defaultName = `New Chat ${new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    })}`;
    
    const newChat: SavedChat = {
      id: generateUUID(),
      name: defaultName,
      messages: currentMessages,
      config: chat.config ?? DEFAULT_CONFIG,
      updatedAt: new Date().toISOString()
    };
    
    // First save the chat to context
    saveCurrentChat(newChat);
    
    // Navigate to the new chat URL when needed
    router.push(`/${newChat.id}`);
  }, [chat, saveCurrentChat, router]);

  // Unified message handling function to reduce duplication
  const addMessage = useCallback((options: {
    role: MessageRole,
    content?: string,
    autoEdit?: boolean,
    position?: number | null // null means add to end
  }) => {
    const { role, content = '', autoEdit = true, position = null } = options;
    
    // Create a new message object with explicitly empty content if none provided
    const newMessage: ChatMessage = { 
      role, 
      content: content || '' // Ensure content is explicitly an empty string if falsy
    };
    
    // Calculate the index of the new message
    const isAppending = position === null;
    const newIndex = isAppending ? draftMessages.length : position + 1;
    
    // Update messages array
    const updatedMessages = [...draftMessages];
    if (isAppending) {
      updatedMessages.push(newMessage);
    } else {
      updatedMessages.splice(newIndex, 0, newMessage);
    }
    
    // Update the state and save changes
    setDraftMessages(updatedMessages);
    saveChanges(updatedMessages);
    
    // Set this new message to be in edit mode if autoEdit is true
    if (autoEdit) {
      setTimeout(() => {
        setEditingIndex(newIndex);
      }, 50);
    }
    
    return newIndex;
  }, [draftMessages, saveChanges]);
  
  // Convenience functions that use the unified message handler
  const handleAddMessageAtPosition = useCallback((afterIndex: number, role: MessageRole, content: string = '', autoEdit: boolean = true) => {
    return addMessage({ role, content, autoEdit, position: afterIndex });
  }, [addMessage]);
  
  const handleAddMessage = useCallback((role: MessageRole, content: string = '', autoEdit: boolean = true) => {
    return addMessage({ role, content, autoEdit });
  }, [addMessage]);
  
  useEffect(() => {
    const handleAddNextMessage = (e: Event) => {
      const { afterIndex, role } = (e as CustomEvent).detail;
      handleAddMessageAtPosition(afterIndex, role, '', true);
    };
    
    window.addEventListener('addNextMessage', handleAddNextMessage);
    return () => window.removeEventListener('addNextMessage', handleAddNextMessage);
  }, [handleAddMessageAtPosition]);
  
  const handleUpdateMessage = useCallback((index: number, content: string) => {
    const updatedMessages = [...draftMessages];
    updatedMessages[index] = { ...updatedMessages[index], content };
    setDraftMessages(updatedMessages);
    
    // Explicitly save changes
    saveChanges(updatedMessages);
    
    // Clear the editing index
    setEditingIndex(null);
  }, [draftMessages, saveChanges]);
  
  const handleDeleteMessage = useCallback((index: number) => {
    const updatedMessages = draftMessages.filter((_, i) => i !== index);
    setDraftMessages(updatedMessages);
    
    // Explicitly save changes
    saveChanges(updatedMessages);
  }, [draftMessages, saveChanges]);
  
  const handleQuickAdd = useCallback((role: MessageRole) => {
    handleAddMessage(role, '', true);
  }, [handleAddMessage]);
  
  // Fork the current chat
  const handleForkChat = useCallback(() => {
    const newName = prompt('Enter a name for this forked chat:');
    if (!newName) return;
    
    // Get configuration from chat or use defaults
    const config = chat?.config ?? DEFAULT_CONFIG;
    
    const newChat: SavedChat = {
      id: generateUUID(),
      name: newName,
      messages: draftMessages,
      config,
      updatedAt: new Date().toISOString()
    };
    
    saveCurrentChat(newChat);
  }, [draftMessages, chat, saveCurrentChat]);
  
  
  // Helper function to get simulated response
  const getSimulatedResponse = useCallback((config: { temperature: number, selectedPlugins: string[] }) => {
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
  }, []);
  
  // Handle re-simulation of a specific message
  const handleResimulate = useCallback((index: number) => {
    // Make sure there's at least one user message to respond to
    const hasUserMessage = draftMessages.some(msg => msg.role === 'user');
    if (!hasUserMessage) {
      alert('Please add at least one user message before simulating.');
      return;
    }
    
    setIsSimulating(true);
    
    // Generate a unique ID for the loading message
    const tempId = Date.now().toString();
    setLoadingMessageId(tempId);
    
    // Update the message at the specified index to have the loading ID
    setDraftMessages(prevMessages => {
      const updated = [...prevMessages];
      updated[index] = {
        ...updated[index],
        id: tempId
      };
      return updated;
    });
    
    try {
      // Get configuration from chat or use defaults
      const config = chat?.config ?? DEFAULT_CONFIG;
      
      // Simulated response for demo purposes
      setTimeout(() => {
        const simulatedResponse = getSimulatedResponse(config);
        
        // Replace the placeholder with the actual response
        setDraftMessages(prevMessages => {
          const updatedMessages = prevMessages.map((msg, i) => 
            i === index 
              ? { ...msg, content: simulatedResponse, id: undefined } 
              : msg
          );
          
          // Save changes explicitly
          saveChanges(updatedMessages);
          
          return updatedMessages;
        });
        
        setLoadingMessageId(null);
        setIsSimulating(false);
      }, 1500);
    } catch (error) {
      console.error('Error simulating chat:', error);
      
      // Restore the original message
      setDraftMessages(prevMessages => {
        return prevMessages.map((msg, i) => 
          i === index && msg.id === tempId
            ? { ...msg, id: undefined }
            : msg
        );
      });
      
      setLoadingMessageId(null);
      setIsSimulating(false);
    }
  }, [draftMessages, chat, saveChanges, getSimulatedResponse]);
  
  // Track whether to allow overwriting without confirmation
  const [allowOverwrite, setAllowOverwrite] = useState(false);
  
  // Main simulation function
  const handleSimulate = useCallback(async () => {
    // Make sure there's at least one user message to respond to
    const hasUserMessage = draftMessages.some(msg => msg.role === 'user');
    if (!hasUserMessage) {
      alert('Please add at least one user message before simulating.');
      return;
    }
    
    // Check if the last message is an assistant message
    const lastMessageIndex = draftMessages.length - 1;
    const lastMessage = draftMessages[lastMessageIndex];
    
    if (lastMessage && lastMessage.role === 'assistant' && lastMessage.content.trim()) {
      // If last message is assistant and has content, confirm overwrite (unless allowOverwrite is true)
      if (!allowOverwrite && !confirm('Replace the last assistant message with a new simulation?')) {
        return;
      }
      
      // Re-simulate the last message
      handleResimulate(lastMessageIndex);
      return;
    }
    
    setIsSimulating(true);
    
    // Generate a unique ID for the loading message
    const tempId = Date.now().toString();
    setLoadingMessageId(tempId);
    
    // If last message is already assistant but empty, use it; otherwise add new one
    if (lastMessage && lastMessage.role === 'assistant' && !lastMessage.content.trim()) {
      // Use existing empty assistant message
      setDraftMessages(prevMessages => {
        const updated = [...prevMessages];
        updated[lastMessageIndex] = {
          ...updated[lastMessageIndex],
          id: tempId
        };
        return updated;
      });
    } else {
      // Add a new assistant message
      const newMessage: ChatMessage = { 
        role: 'assistant', 
        content: '',
        id: tempId
      };
      
      setDraftMessages(prevMessages => [...prevMessages, newMessage]);
    }
    
    try {
      // Get configuration from chat or use defaults
      const config = chat?.config ?? DEFAULT_CONFIG;
      
      // Simulated response for demo purposes
      setTimeout(() => {
        const simulatedResponse = getSimulatedResponse(config);
        
        // Find the message with the loading ID and replace it
        setDraftMessages(prevMessages => {
          const updatedMessages = prevMessages.map(msg => 
            msg.id === tempId 
              ? { ...msg, content: simulatedResponse, id: undefined } 
              : msg
          );
          
          // Save changes explicitly
          saveChanges(updatedMessages);
          
          // No longer creating chats from welcome page automatically
          // We're using an explicit New Chat button approach instead
          
          return updatedMessages;
        });
        
        setLoadingMessageId(null);
        setIsSimulating(false);
      }, 1500);
    } catch (error) {
      console.error('Error simulating chat:', error);
      
      // Remove the loading message if there's an error
      setDraftMessages(prevMessages => prevMessages.filter(msg => msg.id !== tempId));
      
      setLoadingMessageId(null);
      setIsSimulating(false);
    }
  }, [draftMessages, chat, saveChanges, handleResimulate, getSimulatedResponse, allowOverwrite]);
  
  // Chat name handling
  const handleUpdateChatName = useCallback((chatId: string, newName: string) => {
    if (!newName.trim()) return;
    
    // Update name in context
    updateChatName(chatId, newName);
    setEditingChatName(null);
  }, [updateChatName, setEditingChatName]);
  
  // Delete chat
  const handleDeleteChat = useCallback((chatId: string) => {
    if (!confirm('Are you sure you want to delete this chat?')) return;
    deleteCurrentChat(chatId);
  }, [deleteCurrentChat]);
  
  // draftMessages is the source of truth - it was initialized from chat.messages

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
        {draftMessages.map((message, index) => (
          <div key={index} data-message-index={index}>
            {message.id === loadingMessageId ? (
              <LoadingMessage />
            ) : (
              <Message
                role={message.role}
                content={message.content}
                index={index}
                onUpdate={handleUpdateMessage}
                onDelete={handleDeleteMessage}
                onResimulate={message.role === 'assistant' ? handleResimulate : undefined}
                isEditingOverride={editingIndex === index}
              />
            )}
            {/* Add the hover UI after each message except the last one */}
            {index < draftMessages.length - 1 && (
              <AddMessageHoverUI 
                onAdd={(role) => handleAddMessageAtPosition(index, role, '', true)} 
              />
            )}
          </div>
        ))}
        
        {/* Add hover UI after the last message */}
        {draftMessages.length > 0 && (
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