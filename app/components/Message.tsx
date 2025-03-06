'use client';

import { useState, useRef, useEffect } from 'react';

export type MessageRole = 'system' | 'user' | 'assistant';

export interface MessageProps {
  role: MessageRole;
  content: string;
  index: number;
  onUpdate: (index: number, content: string) => void;
  onDelete: (index: number) => void;
  onResimulate?: (index: number) => void; // New function for re-simulating
  isEditingOverride?: boolean;
}

export function Message({ role, content, index, onUpdate, onDelete, onResimulate, isEditingOverride }: MessageProps) {
  const [isEditing, setIsEditing] = useState(isEditingOverride || false);
  const [editedContent, setEditedContent] = useState(content);
  
  // Update editing state and ensure content is properly initialized when editing starts
  useEffect(() => {
    if (isEditingOverride !== undefined) {
      setIsEditing(isEditingOverride);
      // Always make sure the edited content matches the actual content when edit mode changes
      setEditedContent(content);
      
      if (isEditingOverride) {
        // Focus the textarea when entering edit mode
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 10);
      }
    }
  }, [isEditingOverride, content]);
  
  // Update editedContent when content prop changes
  useEffect(() => {
    setEditedContent(content);
  }, [content]);
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
    // Only update if content has actually changed
    if (content !== editedContent) {
      onUpdate(index, editedContent);
    }
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
      
      // First save the current content
      if (content !== editedContent) {
        onUpdate(index, editedContent);
      }
      
      // Exit edit mode
      setIsEditing(false);
      
      // Determine the next role based on current role
      const nextRole: MessageRole = 
        role === 'user' ? 'assistant' : 
        role === 'assistant' ? 'user' : 
        'system';
      
      // Dispatch a custom event that the parent can listen for
      // Add a slight delay to ensure the save operation completes first
      setTimeout(() => {
        const event = new CustomEvent('addNextMessage', { 
          detail: { afterIndex: index, role: nextRole } 
        });
        window.dispatchEvent(event);
      }, 10);
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
        <div className="flex gap-3"> {/* Increased gap for better separation */}
          {/* Only show refresh button for assistant messages and when onResimulate is provided */}
          {role === 'assistant' && onResimulate && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onResimulate(index);
              }}
              className="opacity-40 hover:opacity-100 transition-opacity" /* Added padding for larger hit area */
              aria-label="Re-simulate response"
              title="Re-simulate response"
            >
              <RefreshIcon />
            </button>
          )}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(index);
            }}
            className="opacity-40 hover:opacity-100 transition-opacity p-1" /* Added padding for larger hit area */
            aria-label="Delete message"
            title="Delete message"
          >
            <TrashIcon />
          </button>
        </div>
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
              onClick={(e) => {
                e.stopPropagation();
                handleSave(); 
              }}
              className="text-xs px-2 py-1 bg-green-100 rounded hover:bg-green-200"
            >
              Save
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
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

function TrashIcon() {
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
      <path d="M3 6h18"></path>
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
    </svg>
  );
}

function RefreshIcon() {
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
      <path d="M23 4v6h-6"></path>
      <path d="M1 20v-6h6"></path>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"></path>
      <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"></path>
    </svg>
  );
}