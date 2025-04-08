import axios, { AxiosInstance, AxiosError } from 'axios';
import { z } from 'zod';

const DEFAULT_API_URL = 'https://api.think.new/api';
const SCP_VERSION = '1.0.0';

export class ThinkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ThinkError';
  }
}

export class ThinkAPIError extends ThinkError {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly response?: any
  ) {
    super(message);
    this.name = 'ThinkAPIError';
  }
}

export class ThinkNotFoundError extends ThinkAPIError {
  constructor(message: string = 'Agent not found') {
    super(message, 404);
    this.name = 'ThinkNotFoundError';
  }
}

export class ThinkValidationError extends ThinkAPIError {
  constructor(message: string, public readonly errors?: any[]) {
    super(message, 400);
    this.name = 'ThinkValidationError';
  }
}

// Schema for validating SCP discovery response
const scpToolSchema = z.object({
  scpVersion: z.string(),
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

export interface ThinkOptions {
  tools?: string[]; // Array of SCP URLs
  systemPrompt?: string;
  baseUrl?: string;
}

export interface Message {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  meta?: Record<string, any>;
  tool_calls?: {
    id: string;
    function: {
      name: string;
      arguments: string;
    };
  }[];
  tool_call_id?: string;
}

export interface CreateAgentResponse {
  status: string;
  agentId: string;

}

export class Think {
  private readonly api: AxiosInstance;
  private readonly name: string;
  private id: string | null = null;

  constructor(name: string, private options: ThinkOptions = {}) {
    this.name = name;
    this.api = axios.create({
      baseURL: options.baseUrl || DEFAULT_API_URL
    });
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
      const { name, tools, systemPrompt, messages } = response.data;

      // Create a new instance with the existing data
      const agent = new Think(name, {
        ...options,
        tools,
        systemPrompt
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

  /**
   * Validate an SCP endpoint
   * @throws {ThinkValidationError} When validation fails
   */
  private async validateSCPEndpoint(url: string): Promise<SCPTool> {
    try {
      const response = await axios.get(url);
      const data = response.data;

      // Validate major version (we only support 1.x.x)
      const versionMatch = data.scpVersion?.match(/^(\d+)\./);
      if (!versionMatch || versionMatch[1] !== '1') {
        throw new ThinkValidationError(
          `Unsupported SCP version: ${data.scpVersion}. Only version 1.x.x is supported.`
        );
      }

      // Validate schema
      const result = scpToolSchema.safeParse(data);
      if (!result.success) {
        throw new ThinkValidationError(
          'Invalid SCP schema',
          result.error.errors
        );
      }

      return result.data;
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
   * Create a new agent
   * @throws {ThinkValidationError} When validation fails
   * @throws {ThinkAPIError} When API request fails
   */
  private async ensureAgent(): Promise<string> {
    if (!this.id) {
      try {
        // Validate all tools first
        const validatedTools = [];
        if (this.options.tools) {
          for (const url of this.options.tools) {
            const validatedTool = await this.validateSCPEndpoint(url);
            validatedTools.push({
              url: validatedTool.url,
              title: validatedTool.title,
              description: validatedTool.description || validatedTool.title
            });
          }
        }

        const response = await this.api.post<CreateAgentResponse>('/agents', {
          name: this.name,
          systemPrompt: this.options.systemPrompt,
          tools: validatedTools.map(t => t.url),
          messages: []
        });

        this.id = response.data.agentId;
      } catch (error) {
        if (error instanceof ThinkValidationError) {
          throw error;
        }
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
    return this.id;
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
}
