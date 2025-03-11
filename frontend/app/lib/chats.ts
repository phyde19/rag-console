// Chat types
import { MessageRole } from '../components/Message';

// Simple UUID v4 generator function
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, 
        v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export interface ChatMessage {
  role: MessageRole;
  content: string;
  id: string;
  isLoading?: boolean;
}

// Setting types
export type SettingType = 'text' | 'checkbox' | 'radio' | 'multiselect' | 'json' | 'temperature';

export interface BaseSetting {
  id: string;
  name: string;
  type: SettingType;
}

export interface TextSetting extends BaseSetting {
  type: 'text';
  value: string;
}

export interface CheckboxSetting extends BaseSetting {
  type: 'checkbox';
  value: boolean;
}

export interface MultiSelectSetting extends BaseSetting {
  type: 'multiselect';
  options: { id: string; name: string }[];
  value: string[];
}

export interface RadioSetting extends BaseSetting {
  type: 'radio';
  options: { id: string; name: string }[];
  value: string;
}

export interface JsonSetting extends BaseSetting {
  type: 'json';
  value: string; // JSON stored as string
}

export interface TemperatureSetting extends BaseSetting {
  type: 'temperature';
  value: number;
}

export type Setting = TextSetting | CheckboxSetting | RadioSetting | MultiSelectSetting | JsonSetting | TemperatureSetting;

export interface SavedChat {
  id: string;
  name: string;
  messages: ChatMessage[];
  config: {
    settings: Setting[];
  };
  updatedAt: string;
}

// Default company-specific plugins
export const companyPlugins = [
  { id: 'bluecard_chat', name: 'BlueCard Chat' },
  { id: 'dscoe_docs_chat', name: 'DSCOE Docs Chat' },
  { id: 'gcp_chat', name: 'GCP Chat' },
  { id: 'web_search', name: 'WebSearch' },
];

// Sample initial chats
export const initialChats: SavedChat[] = [
  {
    id: '123e4567-e89b-12d3-a456-426614174000', // Using static UUIDs for initial chats
    name: 'BlueCard FAQ',
    messages: [
      { id: generateUUID(), role: 'system', content: 'You are a helpful assistant for BlueCard.' },
      { id: generateUUID(), role: 'user', content: 'What is BlueCard?' }
    ],
    config: { 
      settings: [
        {
          id: 'temperature',
          name: 'Temperature',
          type: 'temperature',
          value: 0.7
        },
        {
          id: 'plugins',
          name: 'Plugins',
          type: 'multiselect',
          options: companyPlugins,
          value: ['bluecard_chat']
        }
      ]
    },
    updatedAt: '2025-03-05T10:30:00Z'
  },
  {
    id: '98765432-dcba-4321-abcd-987654321123',
    name: 'Technical Support',
    messages: [
      { id: generateUUID(), role: 'system', content: 'You are a technical support agent.' },
      { id: generateUUID(), role: 'user', content: 'How do I deploy to GCP?' }
    ],
    config: {
      settings: [
        {
          id: 'temperature',
          name: 'Temperature',
          type: 'temperature',
          value: 0.5
        },
        {
          id: 'plugins',
          name: 'Plugins',
          type: 'multiselect',
          options: companyPlugins,
          value: ['gcp_chat', 'dscoe_docs_chat']
        }
      ]
    },
    updatedAt: '2025-03-04T15:45:00Z'
  }
];