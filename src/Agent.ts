import type OpenAI from "openai";
import axios from "axios";
import { JSONSchema } from "openai/lib/jsonschema";
import { SCPTool } from ".";

export interface IToolExecutor {
    execute: (args: any) => Promise<string>;
}

export type IChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam & {
    id: string;
    meta: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    tool_calls?: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[];
};

export type AgentEventHandler = (agent: Agent, message: IChatMessage) => void;

export interface ISerialisedAgent {
    id: string;
    name: string;
    tools: SCPTool[];
    messages: IChatMessage[];
    systemPrompt?: string;
}

export class Agent {
    id: string;
    name: string;
    tools: SCPTool[];
    messages: IChatMessage[];
    systemPrompt?: string;
    private openaiClient: OpenAI;
    private updateHandler: AgentEventHandler;

    constructor(
        serialisedAgent: ISerialisedAgent,
        openaiClient: OpenAI,
        updateHandler: AgentEventHandler
    ) {
        this.openaiClient = openaiClient;
        this.updateHandler = updateHandler;

        this.id = serialisedAgent.id;
        this.name = serialisedAgent.name;
        this.tools = serialisedAgent.tools;
        this.messages = serialisedAgent.messages;
        this.systemPrompt = serialisedAgent.systemPrompt;
    }


    private notifyUpdate(message: IChatMessage) {
        this.updateHandler(this, message);
    }

    async sendMessage(message: string, meta: Record<string, any> = {}) {
        const newMessage: IChatMessage = {
            role: "user",
            content: message,
            id: Date.now().toString(),
            createdAt: new Date(),
            updatedAt: new Date(),
            meta
        };

        this.messages.push(newMessage);
        await this.onMessage();
    }

    private async onMessage() {
        const lastMessage = this.messages[this.messages.length - 1];
        if (!lastMessage) return;

        if (lastMessage.role === "assistant" && !lastMessage.tool_calls) return;

        // If this is a user message, mark any pending tool calls as cancelled
        if (lastMessage.role === "user") {
            const pendingToolCallMessage = this.messages
                .slice(0, -1) // Exclude the current user message
                .reverse()
                .find(m => m.role === "assistant" && "tool_calls" in m && m.tool_calls);

            if (pendingToolCallMessage && pendingToolCallMessage.tool_calls) {
                // Mark the tool calls as cancelled in the message's meta
                pendingToolCallMessage.meta = pendingToolCallMessage.meta || {};
                pendingToolCallMessage.meta.cancelled = true;
            }
        }

        if ("tool_calls" in lastMessage && lastMessage.tool_calls) {
            // Only handle tool calls if they haven't been cancelled
            const messageHasBeenCancelled = lastMessage.meta?.cancelled === true;
            if (!messageHasBeenCancelled) {
                const toolCallResponses = await this.handleToolCall(lastMessage as any);
                const formattedResponses = toolCallResponses.map(t => ({
                    ...t,
                    id: Date.now().toString(),
                    meta: {},
                    createdAt: new Date(),
                    updatedAt: new Date()
                }));

                this.messages.push(...formattedResponses);
                formattedResponses.forEach(response => this.notifyUpdate(response));
                await this.onMessage();
                return;
            }
            return; // Skip cancelled tool calls
        }

        const toolsForOpenAI = this.tools.map(tool => ({
            type: 'function' as const,
            function: {
                name: normaliseToolName(tool.title),
                description: tool.description,
                parameters: tool as any
            }
        }));

        // Filter out messages from cancelled tool calls when sending to OpenAI
        const messagesToSend = this.messages.filter(m => {
            // Keep all non-cancelled messages that aren't tool responses
            if (!m.meta?.cancelled && m.role !== 'tool') {
                return true;
            }

            // For tool responses, only keep them if their corresponding tool call message exists and isn't cancelled
            if (m.role === 'tool' && m.tool_call_id) {
                const toolCallMessage = this.messages.find(msg =>
                    msg.role === 'assistant' &&
                    msg.tool_calls?.some(tc => tc.id === m.tool_call_id) &&
                    !msg.meta?.cancelled
                );
                return !!toolCallMessage;
            }

            return false;
        });

        let assistantMessage: IChatMessage;
        try {
            const ret = await this.openaiClient.chat.completions.create({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: this.systemPrompt || ""
                    },
                    ...messagesToSend
                ],
                tools: toolsForOpenAI
            });

            assistantMessage = {
                ...ret.choices[0].message,
                id: Date.now().toString(),
                meta: {},
                createdAt: new Date(),
                updatedAt: new Date()
            };
        } catch (error: any) {
            // Create an error message to show to the user
            assistantMessage = {
                role: "assistant",
                content: `I encountered an error while processing your request: ${error.message}. Please try again.`,
                id: Date.now().toString(),
                meta: { error: true },
                createdAt: new Date(),
                updatedAt: new Date()
            };
        }

        this.messages.push(assistantMessage);
        await this.onMessage();
        this.notifyUpdate(assistantMessage);
    }

    private async handleSingleToolCall(
        toolCall: OpenAI.Chat.Completions.ChatCompletionMessageToolCall
    ): Promise<OpenAI.Chat.Completions.ChatCompletionMessageParam> {
        const toolId = toolCall.function.name;
        const tool = this.tools.find(t => normaliseToolName(t.title) === toolId);

        if (!tool) throw new Error(`Tool not found: ${toolId}`);

        const toolUrl = tool.url;

        try {
            const response = await axios.post(toolUrl, (JSON.parse(toolCall.function.arguments)));
            return {
                role: "tool",
                tool_call_id: toolCall.id,
                content: JSON.stringify(response.data)
            };
        } catch (error: any) {
            return {
                role: "tool",
                tool_call_id: toolCall.id,
                content: `Error: ${error.message}`
            };
        }
    }

    private async handleToolCall(
        message: OpenAI.Chat.Completions.ChatCompletionMessage
    ): Promise<OpenAI.Chat.Completions.ChatCompletionMessageParam[]> {
        if (!message.tool_calls) throw new Error("No tool calls found in message");
        return Promise.all(
            message.tool_calls.map(toolCall => this.handleSingleToolCall(toolCall))
        );
    }
}


function normaliseToolName(name: string): string {
    return name.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase();
}