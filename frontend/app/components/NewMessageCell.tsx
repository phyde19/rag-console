'use client';

import { useState } from 'react';
import { MessageRole } from './Message';

interface NewMessageCellProps {
  onAdd: (role: MessageRole, content: string) => void;
}

export function NewMessageCell({ onAdd }: NewMessageCellProps) {
  const [role, setRole] = useState<MessageRole>('user');
  const [content, setContent] = useState('');

  const handleAdd = () => {
    if (content.trim()) {
      onAdd(role, content);
      setContent('');
    }
  };

  return (
    <div className="p-3 rounded-md border border-dashed mt-2 mb-2 bg-gray-50">
      <div className="flex gap-2 mb-2">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as MessageRole)}
          className="px-2 py-1 border rounded"
        >
          <option value="system">System</option>
          <option value="user">User</option>
          <option value="assistant">Assistant</option>
        </select>
        
        <button 
          onClick={handleAdd}
          disabled={!content.trim()}
          className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Add Message
        </button>
      </div>
      
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full p-2 border rounded min-h-[100px]"
        placeholder="Enter message content..."
        onKeyDown={(e) => {
          if (e.key === 'Enter' && e.shiftKey && content.trim()) {
            e.preventDefault();
            handleAdd();
          }
        }}
      />
      <div className="text-xs text-gray-500 mt-2 italic">Shift+Enter to add message</div>
    </div>
  );
}