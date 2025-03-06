'use client';

import { MessageRole } from './Message';

interface AddMessageHoverUIProps {
  onAdd: (role: MessageRole) => void;
}

export function AddMessageHoverUI({ onAdd }: AddMessageHoverUIProps) {
  return (
    <div className="group relative h-6 my-1">
      <div className="absolute left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center w-full">
        <div className="flex-grow h-px border-t border-dotted border-gray-300 mr-2"></div>
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAdd('system');
            }}
            className="px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded hover:bg-purple-200 flex items-center gap-1 transition-colors"
          >
            <PlusIcon /> System
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAdd('user');
            }}
            className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 flex items-center gap-1 transition-colors"
          >
            <PlusIcon /> User
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAdd('assistant');
            }}
            className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 flex items-center gap-1 transition-colors"
          >
            <PlusIcon /> Assistant
          </button>
        </div>
        <div className="flex-grow h-px border-t border-dotted border-gray-300 ml-2"></div>
      </div>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );
}