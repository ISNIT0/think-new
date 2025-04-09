import Avatar from './Avatar';
import { useState, useEffect } from 'react';

interface RecentAgent {
  id: string;
  name: string;
  timestamp: number;
  firstMessage?: string;
}

interface AgentConfig {
  systemPrompt: string;
  tools: string[];
  openaiApiKey?: string;
}

interface ChatHeaderProps {
  agentName: string;
  thinking: boolean;
  selectedTool: any | null;
  onCloseDetails: () => void;
  onBack?: () => void;
  onNewChat?: () => void;
  onSelectAgent?: (agentId: string) => void;
  currentAgentId?: string | null;
  agentConfig?: AgentConfig;
}

export default function ChatHeader({ 
  agentName, 
  thinking, 
  selectedTool, 
  onCloseDetails, 
  onBack,
  onNewChat,
  onSelectAgent,
  currentAgentId,
  agentConfig
}: ChatHeaderProps) {
  const [isLeftPaneOpen, setIsLeftPaneOpen] = useState(false);
  const [recentAgents, setRecentAgents] = useState<RecentAgent[]>([]);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('recentAgents');
    if (stored) {
      setRecentAgents(JSON.parse(stored));
    }
  }, []);

  return (
    <div className="bg-white z-10 transition-all duration-300 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsLeftPaneOpen(!isLeftPaneOpen)}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Toggle agent list"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center space-x-2">
            <Avatar role="assistant" name={agentName} size="sm" />
            <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <span>{agentName}</span>
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
        <div className="flex items-center gap-2">
          {agentConfig && (
            <button
              onClick={() => setIsConfigOpen(!isConfigOpen)}
              className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              title="View Configuration"
              aria-label="View Configuration"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          )}
          {selectedTool && (
            <button
              onClick={onCloseDetails}
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

      {/* Left Pane */}
      <div className={`fixed left-0 top-0 bottom-0 w-80 bg-white shadow-lg transform transition-transform duration-300 z-30 ${isLeftPaneOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Your Thinks</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <button
              onClick={() => {
                onNewChat?.();
                setIsLeftPaneOpen(false);
              }}
              className="w-full p-3 flex items-center gap-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Think
            </button>

            {recentAgents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => {
                  onSelectAgent?.(agent.id);
                  setIsLeftPaneOpen(false);
                }}
                className={`w-full p-4 flex flex-col gap-1 rounded-lg text-left transition-colors ${
                  currentAgentId === agent.id 
                    ? 'bg-blue-50 hover:bg-blue-100 border border-blue-200' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="font-medium text-gray-900">{agent.name}</div>
                {agent.firstMessage && (
                  <div className="text-sm text-gray-600 line-clamp-2">{agent.firstMessage}</div>
                )}
                <div className="text-sm text-gray-500">
                  {new Date(agent.timestamp).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Configuration Sidebar */}
      {isConfigOpen && agentConfig && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">System Prompt</h3>
              <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                {agentConfig.systemPrompt || <span className="text-gray-400 italic">No system prompt</span>}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Tools</h3>
              <div className="text-sm text-gray-600">
                {agentConfig.tools && agentConfig.tools.length > 0 ? (
                  <div className="space-y-1">
                    {agentConfig.tools.map((tool, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-2 break-all">
                        {tool}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-400 italic">No tools configured</div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">OpenAI API Key</h3>
              <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                {agentConfig.openaiApiKey ? (
                  <div className="flex items-center space-x-2">
                    <span>••••••••</span>
                    <span className="text-green-600 text-xs">(Custom key provided)</span>
                  </div>
                ) : (
                  <span className="text-gray-400 italic">Using default API key</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlays */}
      {isLeftPaneOpen && (
        <div
          className="fixed inset-0 bg-black opacity-25 z-20"
          onClick={() => setIsLeftPaneOpen(false)}
        />
      )}
      
      {isConfigOpen && (
        <div
          className="fixed inset-0 bg-black opacity-25 z-20"
          onClick={() => setIsConfigOpen(false)}
        />
      )}
    </div>
  );
} 