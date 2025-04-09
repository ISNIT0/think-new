import axios, { AxiosInstance } from 'axios';
import { ThinkError, ThinkAPIError, ThinkNotFoundError, ThinkValidationError } from './errors';
import type { Message, ThinkOptions, CreateAgentResponse } from './types';
import * as z from 'zod';

const DEFAULT_API_URL = 'https://api.think.new/api';

export const scpToolSchema = z.object({
    scpVersion: z.literal('1.0.0'),
    endpointVersion: z.string().optional(),
    $schema: z.string().optional(),
    title: z.string(),
    description: z.string().optional(),
    type: z.literal('object'),
    required: z.array(z.string()).optional(),
    properties: z.record(z.any()),
    additionalProperties: z.boolean().optional(),
    responseSchema: z.object({
        $schema: z.string().optional(),
        title: z.string().optional(),
        type: z.literal('object'),
        required: z.array(z.string()),
        properties: z.record(z.any()),
        additionalProperties: z.boolean().optional(),
    }),
    url: z.string().url(),
    auth: z.object({
        type: z.string(),
        instructions: z.string(),
    }).optional(),
});

export type SCPTool = z.infer<typeof scpToolSchema>;

export interface SimpleSCPTool {
    url: string;
    title: string;
    description?: string;
}

export class Think {
    private readonly api: AxiosInstance;
    private readonly _name: string;
    private id: string | null = null;

    constructor(name: string, private options: ThinkOptions) {
        this._name = name;
        this.api = axios.create({
            baseURL: options.baseUrl || DEFAULT_API_URL
        });
    }

    public get name(): string {
        return this._name;
    }

    /**
     * Create a new agent on the server
     * @throws {ThinkValidationError} When validation fails
     * @throws {ThinkAPIError} When API request fails
     */
    public async create(): Promise<string> {
        try {
            const response = await this.api.post<CreateAgentResponse>('/agents', {
                name: this._name,
                systemPrompt: this.options.systemPrompt,
                tools: this.options.tools,
                openaiApiKey: this.options.openaiApiKey,
                messages: []
            });

            this.id = response.data.result.agentId;
            return this.id;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                // Handle RFC 7807 Problem Details format
                if (error.response?.data?.type?.includes('validation-error')) {
                    throw new ThinkValidationError(
                        error.response.data.detail,
                        error.response.data.validation_errors
                    );
                }
                throw new ThinkAPIError(
                    error.message,
                    error.response?.status,
                    error.response?.data
                );
            }
            throw new ThinkError(error instanceof Error ? error.message : 'Unknown error');
        }
    }

    /**
     * Validate an SCP endpoint and return the tool definition
     * @throws {ThinkValidationError} When validation fails
     * @throws {ThinkAPIError} When API request fails
     * @returns The validated SCP tool definition
     */
    public static async validateTool(url: string): Promise<SimpleSCPTool> {
        try {
            const response = await axios.get(url);
            const data = response.data;

            const result = scpToolSchema.safeParse(data);
            if (!result.success) {
                throw new ThinkValidationError('Invalid SCP schema', result.error.errors);
            }

            // Return a simplified version of the tool
            return {
                url: result.data.url,
                title: result.data.title,
                description: result.data.description
            };
        } catch (error) {
            if (error instanceof ThinkValidationError) {
                throw error;
            }
            if (axios.isAxiosError(error)) {
                throw new ThinkAPIError(
                    `Failed to validate SCP endpoint: ${error.message}`,
                    error.response?.status,
                    error.response?.data
                );
            }
            throw new ThinkError(`Failed to validate SCP endpoint: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Load an existing agent by ID
     * @throws {ThinkNotFoundError} When agent is not found
     * @throws {ThinkAPIError} When API request fails
     */
    public static async fromId(id: string, options: Omit<ThinkOptions, 'tools' | 'systemPrompt'> = {}): Promise<Think> {
        const api = axios.create({
            baseURL: options.baseUrl || DEFAULT_API_URL
        });

        try {
            // Fetch the existing agent's data
            const response = await api.get(`/agents/${id}`);
            const { name, tools, systemPrompt, messages, openaiApiKey } = response.data;

            // Create a new instance with the existing data
            const agent = new Think(name, {
                ...options,
                tools,
                systemPrompt,
                openaiApiKey
            });
            agent.id = id; // Set the ID immediately since we know it
            return agent;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 404) {
                    throw new ThinkNotFoundError();
                }
                throw new ThinkAPIError(
                    error.message,
                    error.response?.status,
                    error.response?.data
                );
            }
            throw new ThinkError(error instanceof Error ? error.message : 'Unknown error');
        }
    }

    public get agentId(): string | null {
        return this.id;
    }

    /**
     * Send a message to the agent and wait for the assistant's response
     * @throws {ThinkNotFoundError} When agent is not found
     * @throws {ThinkAPIError} When API request fails
     * @returns The assistant's response message
     */
    public async sendMessage(message: string, meta: Record<string, any> = {}, pollInterval = 1000): Promise<Message> {
        const id = await this.ensureAgent();

        try {
            // Send the message
            await this.api.post(`/agents/${id}`, {
                message,
                meta
            });

            // Poll for response
            while (true) {
                const messages = await this.getMessages();
                const lastMessage = messages[messages.length - 1];

                // Check if we have a complete assistant response
                if (lastMessage?.role === 'assistant' && !lastMessage.tool_calls) {
                    return lastMessage;
                }

                // Wait before polling again
                await new Promise(resolve => setTimeout(resolve, pollInterval));
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 404) {
                    throw new ThinkNotFoundError();
                }
                throw new ThinkAPIError(
                    error.message,
                    error.response?.status,
                    error.response?.data
                );
            }
            throw new ThinkError(error instanceof Error ? error.message : 'Unknown error');
        }
    }

    /**
     * Send a message to the agent without waiting for the response
     * This is useful for UIs that want to show real-time updates
     * @throws {ThinkNotFoundError} When agent is not found
     * @throws {ThinkAPIError} When API request fails
     */
    public async sendMessageAsync(message: string, meta: Record<string, any> = {}): Promise<void> {
        const id = await this.ensureAgent();

        try {
            await this.api.post(`/agents/${id}`, {
                message,
                meta
            });
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 404) {
                    throw new ThinkNotFoundError();
                }
                throw new ThinkAPIError(
                    error.message,
                    error.response?.status,
                    error.response?.data
                );
            }
            throw new ThinkError(error instanceof Error ? error.message : 'Unknown error');
        }
    }

    /**
     * Get all messages for the agent
     * @throws {ThinkNotFoundError} When agent is not found
     * @throws {ThinkAPIError} When API request fails
     */
    public async getMessages(): Promise<Message[]> {
        const id = await this.ensureAgent();

        try {
            const response = await this.api.get(`/agents/${id}`);
            return response.data.messages;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 404) {
                    throw new ThinkNotFoundError();
                }
                throw new ThinkAPIError(
                    error.message,
                    error.response?.status,
                    error.response?.data
                );
            }
            throw new ThinkError(error instanceof Error ? error.message : 'Unknown error');
        }
    }

    public async getAgentUI(): Promise<string> {
        const id = await this.ensureAgent();
        return `https://think.new/agent/${id}`;
    }

    private async ensureAgent(): Promise<string> {
        if (!this.id) {
            throw new ThinkError('Agent ID not set');
        }
        return this.id;
    }
} 