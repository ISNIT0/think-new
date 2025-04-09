import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Think, ThinkValidationError, ThinkAPIError } from '@think-new/sdk'
import { SAMPLE_TOOLS } from '../types/tool'

interface RecentAgent {
    id: string;
    name: string;
    timestamp: number;
}

interface SCPTool {
    url: string;
    title: string;
    description?: string;
}

export default function CreateAgent() {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [systemPrompt, setSystemPrompt] = useState('');
    const [recentAgents, setRecentAgents] = useState<RecentAgent[]>([]);
    const [selectedTools, setSelectedTools] = useState<SCPTool[]>([]);
    const [scpUrl, setScpUrl] = useState('');
    const [validating, setValidating] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem('recentAgents');
        if (stored) {
            setRecentAgents(JSON.parse(stored));
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            // Create a new Think instance
            const agent = new Think(name, {
                systemPrompt,
                tools: selectedTools.map(t => t.url),
                baseUrl: import.meta.env.VITE_API_URL
            });

            // Create the agent on the server
            const agentId = await agent.create();

            // Add to recent agents
            const newAgent = { id: agentId, name, timestamp: Date.now() };
            const updated = [newAgent, ...recentAgents].slice(0, 5); // Keep only 5 most recent
            localStorage.setItem('recentAgents', JSON.stringify(updated));

            // Navigate to chat
            navigate(`/agent/${agentId}`);
        } catch (error) {
            console.error('Failed to create agent:', error);

            if (error instanceof ThinkValidationError) {
                setError(`Validation error: ${error.message}`);
            } else if (error instanceof ThinkAPIError) {
                setError(error.message);
            } else {
                setError((error as Error).message || 'Failed to create agent');
            }
        }
    };

    const handleToolToggle = (tool: SCPTool) => {
        setSelectedTools(prev => {
            const exists = prev.find(t => t.url === tool.url);
            if (exists) {
                return prev.filter(t => t.url !== tool.url);
            } else {
                return [...prev, tool];
            }
        });
    };

    const handleValidateSCP = async (_url?: string) => {
        const url = _url || scpUrl;
        if (!url.trim()) return;

        setValidating(true);
        setValidationError(null);

        try {
            await Think.validateTool(url);

            // If validation succeeds, add the tool
            const tool: SCPTool = {
                url,
                title: url.split('/').pop() || url, // Use the last part of the URL as title if not provided
                description: 'SCP Tool' // Default description
            };

            setSelectedTools(prev => {
                // toggle
                if (prev.some(t => t.url === tool.url)) {
                    return prev.filter(t => t.url !== tool.url);
                }
                return [...prev, tool];
            });
            setScpUrl('');
        } catch (error) {
            if (error instanceof ThinkValidationError) {
                setValidationError(error.message);
            } else {
                setValidationError('Failed to validate SCP endpoint');
            }
        } finally {
            setValidating(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="max-w-2xl mx-auto p-6 w-full pt-12">
                <div className="flex items-center gap-3 mb-8">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                        Create New Agent
                    </h1>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 transform transition-all duration-200 hover:shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                                {error}
                            </div>
                        )}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                Agent Name
                            </label>
                            <input
                                type="text"
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all px-4 py-3 bg-gray-50 hover:bg-white focus:bg-white"
                                placeholder="Enter a name for your agent..."
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="systemPrompt" className="block text-sm font-medium text-gray-700 mb-1">
                                System Prompt
                            </label>
                            <div className="relative">
                                <textarea
                                    id="systemPrompt"
                                    value={systemPrompt}
                                    onChange={(e) => setSystemPrompt(e.target.value)}
                                    className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all px-4 py-3 bg-gray-50 hover:bg-white focus:bg-white resize-none"
                                    rows={6}
                                    placeholder="Describe your agent's behavior and capabilities..."
                                />
                                <div className="absolute bottom-3 right-3 text-xs text-gray-400 bg-white/80 px-2 py-1 rounded-md">
                                    {systemPrompt.length} characters
                                </div>
                            </div>
                        </div>

                        {/* Tools Section */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Tools
                            </label>
                            <div className="space-y-4">
                                {/* Sample Tools */}
                                <div className="grid grid-cols-2 gap-3">
                                    {SAMPLE_TOOLS.map((tool) => (
                                        <div
                                            key={tool.url}
                                            onClick={() => {
                                                handleValidateSCP(tool.url!)
                                            }}
                                            className={`p-4 rounded-xl cursor-pointer border transition-all duration-200 ${selectedTools.some(t => t.url === tool.url)
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className="font-medium text-gray-900">{tool.title}</div>
                                            {tool.description && (
                                                <div className="text-sm text-gray-500 mt-1">{tool.description}</div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* SCP Tool Addition */}
                                <div className="border-t pt-4">
                                    <label htmlFor="scpUrl" className="block text-sm font-medium text-gray-700 mb-2">
                                        Add SCP Endpoint
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="url"
                                            id="scpUrl"
                                            value={scpUrl}
                                            onChange={(e) => setScpUrl(e.target.value)}
                                            className="block flex-1 rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all px-4 py-2 bg-gray-50 hover:bg-white focus:bg-white text-sm"
                                            placeholder="https://api.example.com/scp/endpoint"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleValidateSCP()}
                                            disabled={validating || !scpUrl.trim()}
                                            className="px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {validating ? 'Validating...' : 'Add'}
                                        </button>
                                    </div>
                                    {validationError && (
                                        <div className="mt-2 text-sm text-red-600">
                                            {validationError}
                                        </div>
                                    )}
                                </div>

                                {/* Selected SCP Tools */}
                                {selectedTools.length > 0 && (
                                    <div className="space-y-2">
                                        {selectedTools
                                            .map((tool) => (
                                                <div
                                                    key={tool.url}
                                                    className="flex items-start justify-between p-3 rounded-xl border border-blue-200 bg-blue-50"
                                                >
                                                    <div>
                                                        <div className="font-medium text-gray-900">{tool.title}</div>
                                                        {tool.description && (
                                                            <div className="text-sm text-gray-600 mt-1">{tool.description}</div>
                                                        )}
                                                        <div className="text-xs text-gray-500 mt-1">{tool.url}</div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToolToggle(tool)}
                                                        className="text-gray-400 hover:text-red-500"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!name || selectedTools.length === 0}
                            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Create Agent
                        </button>
                    </form>
                </div>

                {recentAgents.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Recent Agents
                        </h2>
                        <div className="space-y-3">
                            {recentAgents.map((agent) => (
                                <div
                                    key={agent.id}
                                    onClick={() => navigate(`/agent/${agent.id}`)}
                                    className="p-4 rounded-xl cursor-pointer bg-gradient-to-r from-gray-50 to-white border border-gray-100 hover:border-blue-100 hover:from-blue-50 hover:to-white transform transition-all duration-200 hover:shadow-md"
                                >
                                    <div className="font-medium text-gray-900">{agent.name}</div>
                                    <div className="text-sm text-gray-500 flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        {new Date(agent.timestamp).toLocaleDateString(undefined, {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
} 