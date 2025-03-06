'use client';

import { useState, useEffect, useRef } from 'react';
import { Message, MessageRole } from './components/Message';
import { NewMessageCell } from './components/NewMessageCell';
import { LoadingSpinner } from './components/LoadingSpinner';
import { AddMessageHoverUI } from './components/AddMessageHoverUI';
import { LoadingMessage } from './components/LoadingMessage';

interface ChatMessage {
  role: MessageRole;
  content: string;
  id?: string; // Optional ID used for loading messages
}

interface SavedChat {
  id: string;
  name: string;
  messages: ChatMessage[];
  config: {
    temperature: number;
    selectedPlugins: string[];
  };
  updatedAt: string;
}

// Company-specific plugins
const companyPlugins = [
  { id: 'bluecard_chat', name: 'BlueCard Chat' },
  { id: 'dscoe_docs_chat', name: 'DSCOE Docs Chat' },
  { id: 'gcp_chat', name: 'GCP Chat' },
  { id: 'web_search', name: 'WebSearch' },
];

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [temperature, setTemperature] = useState(0.7);
  const [selectedPlugins, setSelectedPlugins] = useState<string[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  // Saved chats
  const [savedChats, setSavedChats] = useState<SavedChat[]>([
    {
      id: '1',
      name: 'BlueCard FAQ',
      messages: [
        { role: 'system', content: 'You are a helpful assistant for BlueCard.' },
        { role: 'user', content: 'What is BlueCard?' }
      ],
      config: { temperature: 0.7, selectedPlugins: ['bluecard_chat'] },
      updatedAt: '2025-03-05T10:30:00Z'
    },
    {
      id: '2',
      name: 'Technical Support',
      messages: [
        { role: 'system', content: 'You are a technical support agent.' },
        { role: 'user', content: 'How do I deploy to GCP?' }
      ],
      config: { temperature: 0.5, selectedPlugins: ['gcp_chat', 'dscoe_docs_chat'] },
      updatedAt: '2025-03-04T15:45:00Z'
    }
  ]);
  const [activeChat, setActiveChat] = useState<string | null>(null);

  // Add initial system message if messages is empty
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: 'system',
          content: 'You are a helpful assistant.'
        }
      ]);
    }
  }, []);
  
  // Listen for the custom event to add a new message after Shift+Enter
  useEffect(() => {
    const handleAddNextMessage = (e: Event) => {
      const { afterIndex, role } = (e as CustomEvent).detail;
      handleAddMessageAtPosition(afterIndex, role);
      
      // Focus the newly added message
      setTimeout(() => {
        const messageElements = document.querySelectorAll('[data-message-index]');
        const newMessageElement = messageElements[afterIndex + 1] as HTMLElement;
        newMessageElement?.click();
      }, 50);
    };
    
    window.addEventListener('addNextMessage', handleAddNextMessage);
    return () => window.removeEventListener('addNextMessage', handleAddNextMessage);
  }, [messages]);

  const handleAddMessage = (role: MessageRole, content: string, autoEdit: boolean = true) => {
    const newIndex = messages.length;
    setMessages([...messages, { role, content }]);
    
    // Set this new message to be in edit mode if content is empty and autoEdit is true
    if (!content && autoEdit) {
      setTimeout(() => {
        setEditingIndex(newIndex);
      }, 50);
    }
  };
  
  const handleAddMessageAtPosition = (afterIndex: number, role: MessageRole, content: string = '', autoEdit: boolean = true) => {
    const newMessages = [...messages];
    newMessages.splice(afterIndex + 1, 0, { role, content });
    setMessages(newMessages);
    
    // Set this new message to be in edit mode if autoEdit is true
    if (autoEdit) {
      setTimeout(() => {
        setEditingIndex(afterIndex + 1);
      }, 50);
    }
  };
  
  const handleQuickAdd = (role: MessageRole) => {
    // Use the handleAddMessage function with autoEdit=true
    handleAddMessage(role, '', true);
  };

  const handleUpdateMessage = (index: number, content: string) => {
    const updatedMessages = [...messages];
    updatedMessages[index] = { ...updatedMessages[index], content };
    setMessages(updatedMessages);
    
    // Clear the editing index
    setEditingIndex(null);
  };

  const handleDeleteMessage = (index: number) => {
    const updatedMessages = messages.filter((_, i) => i !== index);
    setMessages(updatedMessages);
  };

  // State for the placeholder loading message
  const [loadingMessageId, setLoadingMessageId] = useState<string | null>(null);
  
  const handleSimulate = async () => {
    // Make sure there's at least one user message to respond to
    const hasUserMessage = messages.some(msg => msg.role === 'user');
    if (!hasUserMessage) {
      alert('Please add at least one user message before simulating.');
      return;
    }
    
    setIsSimulating(true);
    
    // Generate a unique ID for the loading message
    const tempId = Date.now().toString();
    setLoadingMessageId(tempId);
    
    // Add a placeholder message immediately
    handleAddMessage('assistant', '', false);
    
    // Update the last message to have the loading ID
    setMessages(prevMessages => {
      const updated = [...prevMessages];
      updated[updated.length - 1] = {
        ...updated[updated.length - 1],
        id: tempId
      };
      return updated;
    });
    
    try {
      // Simulated response for demo purposes
      // In a real app, you would call your backend API with messages, temperature, and selectedPlugins
      setTimeout(() => {
        let pluginsDescription = '';
        if (selectedPlugins.length > 0) {
          const pluginNames = selectedPlugins.map(id => {
            // Find the plugin name by ID
            return companyPlugins.find(p => p.id === id)?.name || id;
          });
          pluginsDescription = `With access to the following plugins: ${pluginNames.join(', ')}.`;
        } else {
          pluginsDescription = 'Without access to any plugins.';
        }
        
        const simulatedResponse = 
          `This is a simulated AI response (temperature: ${temperature}) based on the conversation history. ` +
          `${pluginsDescription} ` +
          `In a real implementation, this would be generated by calling an AI model API with the entire message history.`;
        
        // Replace the placeholder with the actual response
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === tempId 
              ? { ...msg, content: simulatedResponse, id: undefined } 
              : msg
          )
        );
        
        setLoadingMessageId(null);
        setIsSimulating(false);
      }, 1500);
    } catch (error) {
      console.error('Error simulating chat:', error);
      
      // Remove the loading message if there's an error
      setMessages(prevMessages => prevMessages.filter(msg => msg.id !== tempId));
      
      setLoadingMessageId(null);
      setIsSimulating(false);
    }
  };

  const handleSaveChat = () => {
    const chatName = prompt('Enter a name for this chat:');
    if (!chatName) return;
    
    const newChat: SavedChat = {
      id: Date.now().toString(),
      name: chatName,
      messages,
      config: {
        temperature,
        selectedPlugins
      },
      updatedAt: new Date().toISOString()
    };
    
    setSavedChats([...savedChats, newChat]);
    setActiveChat(newChat.id);
  };
  
  const handleLoadChat = (chatId: string) => {
    const chat = savedChats.find(c => c.id === chatId);
    if (!chat) return;
    
    setMessages(chat.messages);
    setTemperature(chat.config.temperature);
    setSelectedPlugins(chat.config.selectedPlugins);
    setActiveChat(chatId);
  };
  
  const handleNewChat = () => {
    setMessages([
      {
        role: 'system',
        content: 'You are a helpful assistant.'
      }
    ]);
    setTemperature(0.7);
    setSelectedPlugins([]);
    setActiveChat(null);
  };
  
  const togglePlugin = (pluginId: string) => {
    setSelectedPlugins(prev => 
      prev.includes(pluginId)
        ? prev.filter(id => id !== pluginId)
        : [...prev, pluginId]
    );
  };
  
  return (
    <div className="min-h-screen grid grid-cols-12 gap-4">
      {/* Left column - Conversation Picker */}
      <div className="col-span-2 border-r p-4 h-screen overflow-y-auto">
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-3">Saved Chats</h2>
          <button 
            onClick={handleNewChat}
            className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center gap-1"
          >
            <PlusIcon />
            <span>New Chat</span>
          </button>
        </div>
        
        <div className="space-y-2">
          {savedChats.map(chat => (
            <div 
              key={chat.id} 
              className={`p-2 rounded cursor-pointer ${activeChat === chat.id ? 'bg-blue-100 border border-blue-300' : 'hover:bg-gray-100'}`}
              onClick={() => handleLoadChat(chat.id)}
            >
              <div className="font-medium truncate">{chat.name}</div>
              <div className="text-xs text-gray-500">
                {new Date(chat.updatedAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Center column - Chat Interface */}
      <div className="col-span-7 p-4 h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Chat Simulation</h1>
          <div className="flex gap-2">
            <button
              onClick={handleSaveChat}
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
          </div>
        </div>
        
        <div>
          {messages.map((message, index) => (
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
                  isEditingOverride={editingIndex === index}
                />
              )}
              {/* Add the hover UI after each message except the last one */}
              {index < messages.length - 1 && (
                <AddMessageHoverUI 
                  onAdd={(role) => handleAddMessageAtPosition(index, role)} 
                />
              )}
            </div>
          ))}
          
          {/* Add hover UI after the last message */}
          {messages.length > 0 && (
            <AddMessageHoverUI onAdd={handleQuickAdd} />
          )}
          
          <NewMessageCell onAdd={handleAddMessage} />
        </div>
      </div>
      
      {/* Right column - Settings */}
      <div className="col-span-3 border-l p-4 h-screen overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Settings</h2>
        
        {/* Temperature control */}
        <div className="mb-6">
          <label htmlFor="temperature" className="block text-sm font-medium mb-1">
            Temperature: {temperature.toFixed(1)}
          </label>
          <input
            id="temperature"
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>0.0</span>
            <span>0.5</span>
            <span>1.0</span>
          </div>
        </div>
        
        {/* Plugins */}
        <div>
          <h3 className="text-sm font-medium mb-2">Plugins</h3>
          <div className="space-y-2">
            {companyPlugins.map(plugin => (
              <div 
                key={plugin.id}
                className="flex items-center"
              >
                <input
                  type="checkbox"
                  id={`plugin-${plugin.id}`}
                  checked={selectedPlugins.includes(plugin.id)}
                  onChange={() => togglePlugin(plugin.id)}
                  className="mr-2"
                />
                <label 
                  htmlFor={`plugin-${plugin.id}`}
                  className="text-sm cursor-pointer"
                >
                  {plugin.name}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="16" 
      height="16" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
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