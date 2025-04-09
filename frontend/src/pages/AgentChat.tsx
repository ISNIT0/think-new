import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Think, Message, ThinkNotFoundError } from '@think-new/sdk'
import ChatHeader from '../components/ChatHeader'
import MessageContainer from '../components/MessageContainer'
import ChatInput from '../components/ChatInput'
import LoadingScreen from '../components/LoadingScreen'
import ToolDetailsSidebar from '../components/ToolDetailsSidebar'

// Define the ToolCall type
interface ToolCall {
    id: string;
    function: {
        name: string;
        arguments: string;
    };
}

interface ToolData {
    title: string;
    description: string;
    params: Record<string, any>;
    result?: string;
}

interface AgentConfig {
    systemPrompt: string;
    tools: string[];
    openaiApiKey?: string;
}

interface AgentChatProps {
    agentId?: string;
    onClose?: () => void;
}

export default function AgentChat({ agentId, onClose }: AgentChatProps) {
    const navigate = useNavigate();
    const [thinkAgent, setThinkAgent] = useState<Think | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [thinking, setThinking] = useState(false);
    const [selectedTool, setSelectedTool] = useState<ToolData | null>(null);
    const [isInitializing, setIsInitializing] = useState(false);
    const [systemPrompt, setSystemPrompt] = useState('');
    const [tools, setTools] = useState<string[]>([]);
    const [openaiApiKey, setOpenaiApiKey] = useState<string | undefined>();
    const inputRef = useRef<HTMLInputElement>(null);

    // Initialize agent if ID is provided
    useEffect(() => {
        if (!agentId) {
            setThinkAgent(null);
            setMessages([]);
            return;
        }
        initializeAgent();
    }, [agentId]);

    // Set up polling only when we have an agent
    useEffect(() => {
        if (!thinkAgent) return;

        // Poll for updates
        const interval = setInterval(fetchMessages, 500);
        return () => clearInterval(interval);
    }, [thinkAgent]);

    // Focus input on load
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const initializeAgent = async () => {
        if (!agentId || isInitializing) return;

        setIsInitializing(true);
        try {
            const agent = await Think.fromId(agentId, { baseUrl: import.meta.env.VITE_API_URL });
            setThinkAgent(agent);

            // Initial messages fetch
            const messages = await agent.getMessages();
            setMessages(messages);

            // Detect if the assistant is "thinking"
            const lastMessage = messages[messages.length - 1];
            setThinking(lastMessage?.role === 'user' && messages.length > 0);

            // Update recent agents with first message
            const stored = localStorage.getItem('recentAgents');
            if (stored) {
                const recentAgents = JSON.parse(stored);
                const firstUserMessage = messages.find(m => m.role === 'user')?.content;
                const updated = recentAgents.map((a: any) =>
                    a.id === agentId ? { 
                        ...a, 
                        timestamp: Date.now(),
                        firstMessage: firstUserMessage || a.firstMessage 
                    } : a
                );
                localStorage.setItem('recentAgents', JSON.stringify(updated));
            }
        } catch (error) {
            if (error instanceof ThinkNotFoundError) {
                onClose ? onClose() : navigate('/');
            }
            console.error('Failed to initialize agent:', error);
        } finally {
            setIsInitializing(false);
        }
    };

    const fetchMessages = async () => {
        if (!thinkAgent) return;

        try {
            const messages = await thinkAgent.getMessages();

            // Detect if the assistant is "thinking"
            const lastMessage = messages[messages.length - 1];
            setThinking(lastMessage?.role === 'user' && messages.length > 0);

            setMessages(messages);
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        }
    };

    const handleConfigChange = (config: { systemPrompt: string; tools: string[]; openaiApiKey?: string }) => {
        setSystemPrompt(config.systemPrompt);
        setTools(config.tools);
        setOpenaiApiKey(config.openaiApiKey);
    };

    const createAndSendMessage = async (message: string) => {
        setLoading(true);
        try {
            // Create a new agent with the current configuration
            const agent = new Think("New Think", { 
                systemPrompt, 
                tools,
                openaiApiKey,
                baseUrl: import.meta.env.VITE_API_URL 
            });
            const agentId = await agent.create();
            setThinkAgent(agent);

            // Send the initial message
            await agent.sendMessageAsync(message, {});
            setThinking(true);

            // Update URL without triggering a reload
            window.history.pushState({}, '', `/agent/${agentId}`);

            // Update recent agents with first message
            const stored = localStorage.getItem('recentAgents');
            const recentAgents = stored ? JSON.parse(stored) : [];
            const updated = [{ 
                id: agentId, 
                name: agent.name, 
                timestamp: Date.now(),
                firstMessage: message
            }, ...recentAgents];
            localStorage.setItem('recentAgents', JSON.stringify(updated));

        } catch (error) {
            console.error('Failed to create agent and send message:', error);
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = async (message: string) => {
        if (!message.trim() || loading) return;

        // If no agent exists, create one and send the message
        if (!thinkAgent) {
            await createAndSendMessage(message);
            return;
        }

        // Otherwise, send to existing agent
        setLoading(true);
        try {
            await thinkAgent.sendMessageAsync(message, {});
            setThinking(true);
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToolClick = (toolCall: ToolCall, result?: string) => {
        try {
            const args = JSON.parse(toolCall.function.arguments);
            setSelectedTool({
                title: toolCall.function.name,
                description: "Tool execution details",
                params: args,
                result
            });
        } catch (error) {
            console.error('Failed to parse tool arguments:', error);
        }
    };

    const findToolCall = (toolCallId: string): ToolCall | undefined => {
        return messages
            .find(m => 'tool_calls' in m && m.tool_calls)
            ?.tool_calls?.find((tc: any) => tc.id === toolCallId);
    };

    if (isInitializing) {
        return <LoadingScreen />;
    }

    const handleBack = () => {
        navigate('/');
        if (onClose) {
            onClose();
        }
        setThinkAgent(null);
        setMessages([]);
        setThinking(false);
        setSelectedTool(null);
        setSystemPrompt('');
        setTools([]);
    };

    const handleNewChat = () => {
        navigate('/');
        setThinkAgent(null);
        setMessages([]);
        setThinking(false);
        setSelectedTool(null);
        setSystemPrompt('');
        setTools([]);
    };

    const handleSelectAgent = async (agentId: string) => {
        navigate(`/agent/${agentId}`);
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Main chat area */}
            <div className={`flex-1 flex flex-col h-full ${selectedTool ? 'lg:mr-96' : ''}`}>
                <ChatHeader
                    agentName={thinkAgent?.name ?? "New Think"}
                    thinking={thinking}
                    selectedTool={selectedTool}
                    onCloseDetails={() => setSelectedTool(null)}
                    onBack={thinkAgent ? handleBack : undefined}
                    onNewChat={handleNewChat}
                    onSelectAgent={handleSelectAgent}
                    currentAgentId={thinkAgent?.agentId ?? null}
                    agentConfig={thinkAgent ? { systemPrompt, tools, openaiApiKey } : undefined}
                />

                <MessageContainer
                    messages={messages}
                    agentName={thinkAgent?.name ?? "Assistant"}
                    thinking={thinking}
                    onToolClick={handleToolClick}
                    findToolCall={findToolCall}
                    onConfigChange={handleConfigChange}
                />

                <ChatInput
                    agentName={thinkAgent?.name ?? "Assistant"}
                    loading={loading}
                    onSendMessage={sendMessage}
                />
            </div>

            {/* Tool details sidebar - only render when a tool is selected */}
            {selectedTool && (
                <div className="fixed right-0 top-0 bottom-0 w-96 z-20">
                    <ToolDetailsSidebar tool={selectedTool} onClose={() => setSelectedTool(null)} />
                </div>
            )}
        </div>
    );
} 