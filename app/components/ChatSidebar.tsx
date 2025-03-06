'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useChatContext } from '../context/ChatContext';
import { generateUUID } from '../lib/chats';

export function ChatSidebar() {
  const pathname = usePathname();
  const { savedChats, createChat } = useChatContext();
  
  // The elegantly simple solution: we treat URL as the source of truth
  // The only reason to highlight a chat is if it's in the URL
  const activeChatId = pathname === '/' ? null : pathname.replace('/', '');
  
  // For new chat, we'll pre-navigate, then create the chat
  const handleNewChat = () => {
    // Generate a UUID for the new chat
    const newChatId = generateUUID();
    
    // Update URL first to avoid any flash
    window.history.pushState({}, '', `/${newChatId}`);
    
    // Then create the chat with that same ID
    createChat(undefined, newChatId);
  };
  
  return (
    <div className="col-span-2 border-r p-4 h-screen overflow-y-auto">
      <div className="mb-4">
        <button 
          onClick={handleNewChat}
          className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center gap-1"
        >
          <PlusIcon />
          <span>New Chat</span>
        </button>
      </div>
      
      <div className="mb-4">
        <Link
          href="/"
          className={`w-full py-2 px-4 ${pathname === '/' ? 'bg-blue-100 border border-blue-300' : 'hover:bg-gray-100'} flex items-center gap-2 rounded`}
        >
          <HomeIcon />
          <span>Home</span>
        </Link>
      </div>
      
      <div className="mt-4">
        {savedChats.length > 0 && (
          <div className="text-xs text-gray-500 uppercase font-semibold mb-2">Saved Chats</div>
        )}
        <div className="space-y-2">
          {savedChats.map(chat => (
            <Link
              href={`/${chat.id}`}
              key={chat.id}
              className={`p-2 rounded cursor-pointer block ${activeChatId === chat.id ? 'bg-blue-100 border border-blue-300' : 'hover:bg-gray-100'}`}
            >
              <div className="font-medium truncate">{chat.name}</div>
              <div className="text-xs text-gray-500">
                {new Date(chat.updatedAt).toLocaleDateString()}
              </div>
            </Link>
          ))}
          {savedChats.length === 0 && (
            <div className="text-sm text-gray-400 italic p-2">
              No saved chats yet
            </div>
          )}
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

function HomeIcon() {
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
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
      <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
  );
}