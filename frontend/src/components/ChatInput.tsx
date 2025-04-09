import { useState, useRef, FormEvent } from 'react';

interface ChatInputProps {
  agentName: string;
  loading: boolean;
  onSendMessage: (message: string) => Promise<void>;
}

export default function ChatInput({ agentName, loading, onSendMessage }: ChatInputProps) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    
    try {
      await onSendMessage(input);
      setInput('');
      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div className="border-t bg-white p-4 shadow-lg">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        <div className="relative flex">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message ${agentName}...`}
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
  );
} 