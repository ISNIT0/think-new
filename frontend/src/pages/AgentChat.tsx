import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api, Agent, Message, ToolCall } from '../api'
import Avatar from '../components/Avatar'
import ChatMessage from '../components/ChatMessage'
import TypingIndicator from '../components/TypingIndicator'
import ToolDetailsSidebar from '../components/ToolDetailsSidebar'

interface ToolData {
  title: string;
  description: string;
  params: Record<string, any>;
  result?: string;
}

export default function AgentChat() {
    const { agentId } = useParams<{ agentId: string }>();
    const navigate = useNavigate();
    const [agent, setAgent] = useState<Agent | null>(null);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [thinking, setThinking] = useState(false);
    const [selectedTool, setSelectedTool] = useState<ToolData | null>(null);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const messageContainerRef = useRef<HTMLDivElement>(null);
    const [, setMessages] = useState<Message[]>([]);
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
    const lastMessageRef = useRef<string | null>(null);

    const scrollToBottom = () => {
        if (shouldAutoScroll) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    };

    useEffect(() => {
        if (!messageContainerRef.current) return;
        
        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = messageContainerRef.current!;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
            setShowScrollTop(!isNearBottom && scrollTop > 300);
            setIsScrolled(scrollTop > 10);
            setShouldAutoScroll(isNearBottom);
        };
        
        const container = messageContainerRef.current;
        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (!agent?.messages) return;
        
        // Check if there's a new message
        const lastMessage = agent.messages[agent.messages.length - 1];
        const isNewMessage = lastMessage?.id !== lastMessageRef.current;
        
        if (isNewMessage) {
            lastMessageRef.current = lastMessage?.id || null;
            if (shouldAutoScroll) {
                scrollToBottom();
            }
        }

        setMessages(agent.messages);
    }, [agent?.messages]);

    useEffect(() => {
        if (!agentId) return;
        
        // Initial load
        fetchAgent();
        
        // Poll for updates
        const interval = setInterval(fetchAgent, 500);
        return () => clearInterval(interval);
    }, [agentId]);

    // Focus input on load
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const fetchAgent = async () => {
        if (!agentId) return;
        
        try {
            const data = await api.getAgent(agentId);
            
            // Detect if the assistant is "thinking" (last message is user)
            const lastMessage = data.messages[data.messages.length - 1];
            setThinking(lastMessage?.role === 'user' && data.messages.length > 0);
            
            setAgent(data);

            // Update recent agents
            const stored = localStorage.getItem('recentAgents');
            if (stored) {
                const recentAgents = JSON.parse(stored);
                const updated = recentAgents.map((a: any) => 
                    a.id === agentId ? { ...a, timestamp: Date.now() } : a
                );
                localStorage.setItem('recentAgents', JSON.stringify(updated));
            }
        } catch (error) {
            console.error('Failed to fetch agent:', error);
        }
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading || !agentId) return;

        setLoading(true);
        setShouldAutoScroll(true); // Always scroll on send
        try {
            await api.sendMessage(agentId, {
                message: input,
                meta: {}
            });
            setInput('');
            setThinking(true);
            scrollToBottom();
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setLoading(false);
            inputRef.current?.focus();
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
        return agent?.messages
            .find(m => 'tool_calls' in m && m.tool_calls)
            ?.tool_calls?.find((tc: any) => tc.id === toolCallId);
    };

    if (!agent) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="text-center p-8 bg-white rounded-xl shadow-lg">
                    <div className="w-16 h-16 mx-auto mb-4 relative">
                        <div className="absolute inset-0 rounded-full border-t-2 border-blue-500 animate-spin"></div>
                        <div className="absolute inset-3 rounded-full bg-blue-50 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                        </div>
                    </div>
                    <div className="text-xl font-medium text-gray-800 mb-2">Loading your agent</div>
                    <div className="text-gray-500 text-sm max-w-xs">
                        Please wait while we connect to your intelligent assistant...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Main chat area */}
            <div className={`flex-1 flex flex-col h-full ${selectedTool ? 'lg:mr-96' : ''}`}>
                {/* Header */}
                <div className={`bg-white z-10 transition-all duration-300 ${isScrolled ? 'shadow-md' : 'shadow-sm'}`}>
                    <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <button 
                                onClick={() => navigate('/')} 
                                className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
                                aria-label="Back to agents"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </button>
                            <div className="flex items-center space-x-2">
                                <Avatar role="assistant" name={agent.name} size="sm" />
                                <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                    <span>{agent.name}</span>
                                    {thinking && (
                                        <span className="flex space-x-1 ml-2">
                                            <span className="animate-bounce h-1.5 w-1.5 bg-gray-400 rounded-full delay-0"></span>
                                            <span className="animate-bounce h-1.5 w-1.5 bg-gray-400 rounded-full delay-150"></span>
                                            <span className="animate-bounce h-1.5 w-1.5 bg-gray-400 rounded-full delay-300"></span>
                                        </span>
                                    )}
                                </h1>
                            </div>
                        </div>
                        {selectedTool && (
                            <button
                                onClick={() => setSelectedTool(null)}
                                className="px-3 py-1.5 rounded-full text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                            >
                                <span className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Close Details
                                </span>
                            </button>
                        )}
                    </div>
                </div>
                
                {/* Messages */}
                <div 
                    ref={messageContainerRef}
                    className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2 bg-gray-50 relative"
                >
                    {/* Scroll shadows */}
                    {isScrolled && (
                        <div className="absolute top-0 left-0 right-0 h-4 scroll-shadow-top z-10 pointer-events-none"></div>
                    )}
                    
                    {/* Empty state */}
                    {agent.messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-10">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <div className="text-xl font-medium text-gray-800 mb-2">Start your conversation</div>
                            <div className="text-gray-500 max-w-md mb-8">
                                Type your message below to begin chatting with {agent.name}
                            </div>
                            
                            <div className="text-sm text-gray-400 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Press Enter to send your message
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Messages list */}
                            {agent.messages.map((message) => (
                                <ChatMessage 
                                    key={message.id} 
                                    message={message} 
                                    agentName={agent.name}
                                    onToolClick={handleToolClick}
                                    findToolCall={findToolCall}
                                />
                            ))}
                            
                            {/* Typing indicator */}
                            {thinking && <TypingIndicator agentName={agent.name} />}
                            
                            {/* Scroll to bottom button */}
                            {showScrollTop && (
                                <button 
                                    onClick={scrollToBottom} 
                                    className="fixed bottom-24 right-8 bg-white shadow-lg rounded-full p-3 text-gray-500 hover:bg-gray-100 transition-colors z-10 animate-fade-in"
                                    aria-label="Scroll to bottom"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                    </svg>
                                </button>
                            )}
                        </>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                
                {/* Input area */}
                <div className="border-t bg-white p-4 shadow-lg">
                    <form onSubmit={sendMessage} className="max-w-4xl mx-auto">
                        <div className="relative flex">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={`Message ${agent.name}...`}
                                className="flex-1 px-4 py-3 rounded-full border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all pr-24"
                                disabled={loading}
                            />
                            
                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center">
                                <span className="text-xs text-gray-400 mr-2">
                                    {input.length > 0 && `${input.length} chars`}
                                </span>
                                <button
                                    type="submit"
                                    disabled={loading || !input.trim()}
                                    className="premium-button p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-all shadow-sm hover:shadow-md flex items-center justify-center"
                                    aria-label="Send message"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex justify-center mt-2">
                            <div className="text-xs text-gray-400 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Press Enter to send
                            </div>
                        </div>
                    </form>
                </div>
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