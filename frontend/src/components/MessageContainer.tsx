import { useRef, useEffect, useState } from 'react';
import { Message } from '@think-new/sdk';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import EmptyState from './EmptyState';

interface ToolCall {
  id: string;
  function: {
    name: string;
    arguments: string;
  };
}

interface MessageContainerProps {
  messages: Message[];
  agentName: string;
  thinking: boolean;
  onToolClick: (toolCall: ToolCall, result?: string) => void;
  findToolCall: (toolCallId: string) => ToolCall | undefined;
  onConfigChange?: (config: { systemPrompt: string; tools: string[] }) => void;
}

export default function MessageContainer({ 
  messages, 
  agentName, 
  thinking, 
  onToolClick, 
  findToolCall,
  onConfigChange 
}: MessageContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const lastMessageRef = useRef<string | null>(null);

  const scrollToBottom = () => {
    if (shouldAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current!;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollTop(!isNearBottom && scrollTop > 300);
      setIsScrolled(scrollTop > 10);
      setShouldAutoScroll(isNearBottom);
    };

    const container = containerRef.current;
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!messages || messages.length === 0) return;

    // Check if there's a new message
    const lastMessage = messages[messages.length - 1];
    const isNewMessage = lastMessage?.id !== lastMessageRef.current;

    if (isNewMessage) {
      lastMessageRef.current = lastMessage?.id || null;
      if (shouldAutoScroll) {
        scrollToBottom();
      }
    }
  }, [messages]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2 bg-gray-50 relative"
    >
      {/* Scroll shadows */}
      {isScrolled && (
        <div className="absolute top-0 left-0 right-0 h-4 scroll-shadow-top z-10 pointer-events-none"></div>
      )}

      {/* Empty state */}
      {messages.length === 0 ? (
        <EmptyState 
          agentName={agentName} 
          onConfigChange={config => onConfigChange?.(config)} 
        />
      ) : (
        <>
          {/* Messages list */}
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              agentName={agentName}
              onToolClick={onToolClick}
              findToolCall={findToolCall}
            />
          ))}

          {/* Typing indicator */}
          {thinking && <TypingIndicator agentName={agentName} />}

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
  );
} 