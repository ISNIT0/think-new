import { useState } from 'react';
import { Think, SimpleSCPTool } from '@think-new/sdk';
import { SAMPLE_TOOLS } from '../types/tool';

interface EmptyStateProps {
  agentName: string;
  onConfigChange: (config: { systemPrompt: string; tools: string[] }) => void;
}

export default function EmptyState({ agentName, onConfigChange }: EmptyStateProps) {
  const [systemPrompt, setSystemPrompt] = useState('');
  const [selectedTools, setSelectedTools] = useState<SimpleSCPTool[]>([]);
  const [scpUrl, setScpUrl] = useState('');
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);

  const handleToolToggle = (tool: SimpleSCPTool) => {
    setSelectedTools(prev => {
      const exists = prev.find(t => t.url === tool.url);
      const newTools = exists
        ? prev.filter(t => t.url !== tool.url)
        : [...prev, tool];
      onConfigChange({ 
        systemPrompt, 
        tools: newTools.map(t => t.url)
      });
      return newTools;
    });
  };

  const handlePromptChange = (prompt: string) => {
    setSystemPrompt(prompt);
    onConfigChange({ 
      systemPrompt: prompt, 
      tools: selectedTools.map(t => t.url)
    });
  };

  const handleValidateSCP = async (_url?: string) => {
    const url = _url || scpUrl;
    if (!url.trim()) return;

    setValidating(true);
    setValidationError(null);

    try {
      const tool = await Think.validateTool(url);
      handleToolToggle(tool);
      setScpUrl('');
    } catch (error) {
      setValidationError((error as Error).message || 'Failed to validate SCP endpoint');
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-10">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
      <div className="text-xl font-medium text-gray-800 mb-2">Start your conversation</div>
      
      <button
        onClick={() => setShowConfig(!showConfig)}
        className="mb-4 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        {showConfig ? 'Hide Configuration' : 'Configure Agent'}
      </button>

      {showConfig ? (
        <div className="w-full max-w-lg mx-auto space-y-4 mb-8 px-4">
          <div>
            <label htmlFor="systemPrompt" className="block text-sm font-medium text-gray-700 mb-1 text-left">
              System Prompt
            </label>
            <textarea
              id="systemPrompt"
              value={systemPrompt}
              onChange={(e) => handlePromptChange(e.target.value)}
              className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all px-4 py-3 bg-gray-50 hover:bg-white focus:bg-white resize-none text-sm"
              rows={4}
              placeholder="Describe your agent's behavior and capabilities..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
              Tools
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SAMPLE_TOOLS.filter(tool => tool.url).map((tool) => (
                <div
                  key={tool.url}
                  onClick={() => handleValidateSCP(tool.url)}
                  className={`p-3 rounded-xl cursor-pointer border text-left transition-all duration-200 ${
                    selectedTools.some(t => t.url === tool.url)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium text-sm text-gray-900">{tool.title}</div>
                  {tool.description && (
                    <div className="text-xs text-gray-500 mt-1">{tool.description}</div>
                  )}
                </div>
              ))}
            </div>

            {/* Custom SCP Tool Input */}
            <div className="mt-4">
              <label htmlFor="scpUrl" className="block text-sm font-medium text-gray-700 mb-2 text-left">
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

            {/* Selected Tools List */}
            {selectedTools.length > 0 && (
              <div className="mt-4 space-y-2">
                {selectedTools.map((tool) => (
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
      ) : (
        <div className="text-gray-500 max-w-md mb-8">
          Type your message below to begin chatting with {agentName}
        </div>
      )}

      <div className="text-sm text-gray-400 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Press Enter to send your message
      </div>
    </div>
  );
} 