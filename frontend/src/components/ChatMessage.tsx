import React from 'react';
import { Message, ToolCall } from '../api';
import Avatar from './Avatar';

interface ChatMessageProps {
  message: Message;
  agentName: string;
  onToolClick: (toolCall: ToolCall, result?: string) => void;
  findToolCall: (toolCallId: string) => ToolCall | undefined;
}

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  agentName,
  onToolClick,
  findToolCall
}) => {
  const isUser = message.role === 'user';
  const createdAt = message.createdAt
    ? new Date(message.createdAt)
    : new Date();

  // User message
  if (isUser) {
    return (
      <div className="flex flex-col items-end group mb-4">
        <div className="flex items-start space-x-2">
          <div className="message-user px-4 py-3 rounded-2xl shadow-message message-hover-effect max-w-md">
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
          <div className="flex-shrink-0 mt-1">
            <Avatar role="user" name="You" />
          </div>
        </div>
        <div className="message-timestamp mr-12 mt-1">
          {formatTime(createdAt)}
        </div>
      </div>
    );
  }

  // Assistant text message
  if (message.role === 'assistant' && message.content) {
    return (
      <div className="flex flex-col items-start group mb-4">
        <div className="flex items-start space-x-2">
          <div className="flex-shrink-0 mt-1">
            <Avatar role="assistant" name={agentName} />
          </div>
          <div className="message-assistant px-4 py-3 rounded-2xl shadow-message message-hover-effect max-w-md">
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        </div>
        <div className="message-timestamp ml-12 mt-1">
          {formatTime(createdAt)}
        </div>
      </div>
    );
  }

  // Tool calls
  if (message.role === 'assistant' && message.tool_calls && message.tool_calls.length > 0) {
    const isCancelled = message.meta?.cancelled === true;
    return (
      <div className="flex flex-col items-start group mb-4">
        <div className="flex items-start space-x-2">
          <div className="flex-shrink-0 mt-1">
            <Avatar role="assistant" name={agentName} />
          </div>
          <div className={`message-tool-call px-4 py-3 rounded-2xl shadow-message max-w-md ${isCancelled ? 'opacity-50' : ''}`}>
            <div className="font-medium text-blue-600 mb-2 flex items-center justify-between">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Using Tools
              </div>
              {isCancelled && (
                <div className="text-xs text-red-500 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancelled
                </div>
              )}
            </div>
            <div className="space-y-2">
              {message.tool_calls.map((toolCall) => (
                <div
                  key={toolCall.id}
                  className={`cursor-pointer bg-white p-3 rounded-lg hover:bg-blue-50 transition-colors border border-gray-100 ${isCancelled ? 'cursor-not-allowed' : ''}`}
                  onClick={() => !isCancelled && onToolClick(toolCall)}
                >
                  <div className="font-medium text-sm">{toolCall.function.name}</div>
                  <div className="text-xs text-gray-500 flex items-center mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {isCancelled ? 'Tool execution cancelled' : 'Click to view details'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="message-timestamp ml-12 mt-1">
          {formatTime(createdAt)}
        </div>
      </div>
    );
  }

  // Tool results
  if (message.role === 'tool') {
    const toolCallId = message.tool_call_id || '';
    const toolCall = findToolCall(toolCallId);
    
    return (
      <div className="flex flex-col items-start group mb-4">
        <div className="flex items-start space-x-2">
          <div className="flex-shrink-0 mt-1">
            <Avatar role="assistant" name={agentName} />
          </div>
          <div 
            className="message-tool-result px-4 py-3 rounded-2xl shadow-message message-hover-effect max-w-md cursor-pointer"
            onClick={() => toolCall && onToolClick(toolCall, message.content)}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <div className="font-medium text-green-700 text-sm flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Tool Result
              </div>
            </div>
            <div className="text-sm text-gray-500 overflow-hidden">
              <p className="text-sm whitespace-nowrap overflow-hidden text-ellipsis opacity-60">{message.content}</p>
              <div className="text-xs mt-1 text-gray-400">Click to view full result</div>
            </div>
          </div>
        </div>
        <div className="message-timestamp ml-12 mt-1">
          {formatTime(createdAt)}
        </div>
      </div>
    );
  }

  // System message
  if (message.role === 'system') {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-gray-100 text-gray-500 px-4 py-2 rounded-full text-xs max-w-md text-center">
          {message.content}
        </div>
      </div>
    );
  }

  return null;
};

export default ChatMessage; 