import OpenAI from 'openai';

export interface ThinkOptions {
  tools: string[]; // Array of SCP URLs
  systemPrompt?: string;
  baseUrl?: string;
  openaiApiKey?: string;
}

export interface ToolCall {
  id: string;
  function: {
    name: string;
    arguments: string;
  };
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  meta?: Record<string, any>;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  createdAt: string;
}

export interface CreateAgentResponse {
  status: string;
  result: {
    agentId: string;
  };
} 