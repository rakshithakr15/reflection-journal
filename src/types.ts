export type ReflectionMode = 'reflection' | 'summary' | 'brainstorm';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  mode?: ReflectionMode;
}

export interface JournalInteraction {
  id: string;
  userId: string;
  title: string;
  category: ReflectionMode;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  summary?: string;
}

export interface GeminiReflectRequest {
  prompt: string;
  history?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  mode?: ReflectionMode;
}

export interface GeminiReflectResponse {
  reply: string;
  modelUsed: string;
  suggestedTitle?: string;
  summary?: string;
}
