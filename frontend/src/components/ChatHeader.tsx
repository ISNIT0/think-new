import Avatar from './Avatar';
import { useState, useEffect } from 'react';

interface RecentAgent {
  id: string;
  name: string;
  timestamp: number;
  firstMessage?: string;
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
}

export default function ChatHeader({ 
  agentName, 
  thinking, 
  selectedTool, 
  onCloseDetails, 
  onBack,
  onNewChat,
  onSelectAgent,
  currentAgentId 
}: ChatHeaderProps) {
  const [isLeftPaneOpen, setIsLeftPaneOpen] = useState(false);
  const [recentAgents, setRecentAgents] = useState<RecentAgent[]>([]);

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

      {/* Overlay */}
      {isLeftPaneOpen && (
        <div
          className="fixed inset-0 bg-black opacity-25 z-20"
          onClick={() => setIsLeftPaneOpen(false)}
        />
      )}
    </div>
  );
} 