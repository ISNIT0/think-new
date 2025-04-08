const API_BASE = process.env.VITE_API_BASE || 'http://localhost:1234/api';

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
    createdAt: string;
    meta?: Record<string, any>;
    tool_calls?: ToolCall[];
    tool_call_id?: string;
}

export interface Agent {
    id: string;
    name: string;
    messages: Message[];
    systemPrompt?: string;
}

export interface CreateAgentData {
    name: string;
    systemPrompt?: string;
    tools?: any[];
    messages?: Message[];
}

export interface SendMessageData {
    message: string;
    meta?: Record<string, any>;
}

export const api = {
    async createAgent(data: CreateAgentData): Promise<{ agentId: string }> {
        const response = await fetch(`${API_BASE}/agents`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...data,
                tools: data.tools || [],
                messages: data.messages || []
            }),
        });

        if (!response.ok) {
            console.error(response);
            throw new Error('Failed to create agent');
        }

        return response.json();
    },

    async getAgent(agentId: string): Promise<Agent> {
        const response = await fetch(`${API_BASE}/agents/${agentId}`);

        if (!response.ok) {
            throw new Error('Failed to fetch agent');
        }

        return response.json();
    },

    async sendMessage(agentId: string, data: SendMessageData): Promise<void> {
        const response = await fetch(`${API_BASE}/agents/${agentId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error('Failed to send message');
        }
    }
}; 