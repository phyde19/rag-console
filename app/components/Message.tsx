'use client';

import { useState, useRef, useEffect } from 'react';

export type MessageRole = 'system' | 'user' | 'assistant';

export interface MessageProps {
  role: MessageRole;
  content: string;
  index: number;
  onUpdate: (index: number, content: string) => void;
  onDelete: (index: number) => void;
  isEditingOverride?: boolean;
}

export function Message({ role, content, index, onUpdate, onDelete, isEditingOverride }: MessageProps) {
  const [isEditing, setIsEditing] = useState(isEditingOverride || false);
  const [editedContent, setEditedContent] = useState(content);
  
  // Update editing state if the override prop changes
  useEffect(() => {
    if (isEditingOverride !== undefined) {
      setIsEditing(isEditingOverride);
      if (isEditingOverride) {
        // Focus the textarea when entering edit mode
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 10);
      }
    }
  }, [isEditingOverride]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const roleColors = {
    system: 'bg-purple-50 border-purple-200',
    user: 'bg-blue-50 border-blue-200',
    assistant: 'bg-green-50 border-green-200'
  };

  const roleLabels = {
    system: 'System',
    user: 'User',
    assistant: 'Assistant'
  };

  const handleSave = () => {
    onUpdate(index, editedContent);
    setIsEditing(false);
  };

  const handleClick = () => {
    if (!isEditing) {
      setIsEditing(true);
      // Focus the textarea after a short delay to allow rendering
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 10);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      handleSave();
      
      // Determine the next role based on current role
      const nextRole: MessageRole = 
        role === 'user' ? 'assistant' : 
        role === 'assistant' ? 'user' : 
        'system';
      
      // Dispatch a custom event that the parent can listen for
      const event = new CustomEvent('addNextMessage', { 
        detail: { afterIndex: index, role: nextRole } 
      });
      window.dispatchEvent(event);
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditedContent(content); // Reset to original content
    }
  };

  return (
    <div 
      className={`p-3 rounded-md border mb-2 ${roleColors[role]} ${!isEditing ? 'cursor-pointer' : ''}`}
      onClick={!isEditing ? handleClick : undefined}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="font-medium">{roleLabels[role]}</div>
        {!isEditing && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(index);
            }}
            className="text-xs px-2 py-1 bg-red-100 rounded hover:bg-red-200"
          >
            Delete
          </button>
        )}
      </div>
      
      {isEditing ? (
        <div onClick={(e) => e.stopPropagation()}>
          <textarea
            ref={textareaRef}
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full p-2 border rounded min-h-[100px]"
            placeholder={`Enter ${roleLabels[role].toLowerCase()} message...`}
          />
          <div className="flex gap-2 mt-2">
            <button 
              onClick={handleSave}
              className="text-xs px-2 py-1 bg-green-100 rounded hover:bg-green-200"
            >
              Save
            </button>
            <button 
              onClick={() => {
                setIsEditing(false);
                setEditedContent(content);
              }}
              className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
            >
              Cancel
            </button>
            <div className="flex-grow"></div>
            <div className="text-xs text-gray-500 italic">Shift+Enter to save and add next message, Esc to cancel</div>
          </div>
        </div>
      ) : (
        <div className="whitespace-pre-wrap">{content}</div>
      )}
    </div>
  );
}