// Chat types
import { MessageRole } from '../components/Message';

export interface ChatMessage {
  role: MessageRole;
  content: string;
  id?: string; // Optional ID used for loading messages
}

export interface SavedChat {
  id: string;
  name: string;
  messages: ChatMessage[];
  config: {
    temperature: number;
    selectedPlugins: string[];
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
];