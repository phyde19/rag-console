'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { ChatInterface } from '../components/ChatInterface';
import { AppLayout } from '../components/AppLayout';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useChatStore, ChatSetting } from '../context/ChatStore';

export default function ChatPage() {
  const params = useParams();
  const chatId = params.chatId as string;
  
  // Use our consolidated store
  const { 
    currentChat, 
    isLoading,
    error
  } = useChatStore();

  // Early return if no chat is loaded
  if (!currentChat) {
    return (
      <AppLayout>
        <div className="col-span-7 p-4 h-screen flex items-center justify-center">
          <div className="text-gray-500">No chat selected</div>
        </div>
      </AppLayout>
    );
  }
  
//   // Loading state
//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center h-screen">
//         <LoadingSpinner size="lg" />
//       </div>
//     );
//   }
  
//   // Error state or chat not found
//   if (error || !currentChat) {
//     return (
//       <div className="flex items-center justify-center h-screen">
//         <div className="text-gray-500">Chat not found</div>
//       </div>
//     );
//   }
  
  return (
    <AppLayout>
      <ChatInterface />
    </AppLayout>
  );
}