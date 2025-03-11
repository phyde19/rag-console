/**
 * API client for communicating with the backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Types for API responses
export interface ChatListItem {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  role: string;
  content: string;
  sequence: number;
  created_at: string;
  updated_at: string;
}

export interface SettingOption {
  id: string;
  option_id: string;
  name: string;
}

export interface Setting {
  id: string;
  setting_id: string;
  name: string;
  type: string;
  value: string;
  required: boolean;
  options?: SettingOption[];
}

export interface Chat {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  messages?: Message[];
  settings?: Setting[];
}

// API Client
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // Helper method for making API requests
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const error = await response.json();
        return Promise.reject(new Error(error.detail || 'An error occurred'));
      }

      // For DELETE operations, return an empty object as they don't typically return content
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      return Promise.reject(error);
    }
  }

  // Chat endpoints
  async getChats(): Promise<ChatListItem[]> {
    return this.request<ChatListItem[]>('/chats');
  }

  async getChat(chatId: string): Promise<Chat> {
    return this.request<Chat>(`/chats/${chatId}`);
  }

  async createChat(name: string, systemMessage: string = 'You are a helpful assistant.'): Promise<Chat> {
    return this.request<Chat>('/chats', {
      method: 'POST',
      body: JSON.stringify({ name, system_message: systemMessage }),
    });
  }

  async updateChat(chatId: string, name: string): Promise<Chat> {
    return this.request<Chat>(`/chats/${chatId}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    });
  }

  async deleteChat(chatId: string): Promise<void> {
    return this.request<void>(`/chats/${chatId}`, {
      method: 'DELETE',
    });
  }

  // Message endpoints
  async createMessage(chatId: string, role: string, content: string, sequence?: number): Promise<Message> {
    const body: any = { role, content };
    if (sequence !== undefined) {
      body.sequence = sequence;
    }

    return this.request<Message>(`/chats/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async updateMessage(chatId: string, messageId: string, content: string): Promise<Message> {
    return this.request<Message>(`/chats/${chatId}/messages/${messageId}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
  }

  async deleteMessage(chatId: string, messageId: string): Promise<void> {
    return this.request<void>(`/chats/${chatId}/messages/${messageId}`, {
      method: 'DELETE',
    });
  }

  // Setting endpoints
  async createSetting(chatId: string, setting: {
    setting_id: string;
    name: string;
    type: string;
    value: string;
    required?: boolean;
    options?: { id: string; name: string }[];
  }): Promise<Setting> {
    return this.request<Setting>(`/chats/${chatId}/settings`, {
      method: 'POST',
      body: JSON.stringify(setting),
    });
  }

  async updateSetting(chatId: string, settingId: string, value: string): Promise<Setting> {
    return this.request<Setting>(`/chats/${chatId}/settings/${settingId}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    });
  }

  async deleteSetting(chatId: string, settingId: string): Promise<void> {
    return this.request<void>(`/chats/${chatId}/settings/${settingId}`, {
      method: 'DELETE',
    });
  }
}

// Export a singleton instance of the API client
export const api = new ApiClient();