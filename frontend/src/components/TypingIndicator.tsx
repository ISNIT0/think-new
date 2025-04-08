import React from 'react';
import Avatar from './Avatar';

interface TypingIndicatorProps {
  agentName: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ agentName }) => {
  return (
    <div className="flex items-start space-x-2 mb-4 animate-fade-in">
      <div className="flex-shrink-0 mt-1">
        <Avatar role="assistant" name={agentName} />
      </div>
      <div className="bg-white px-4 py-3 rounded-2xl shadow-message message-hover-effect">
        <div className="flex items-center space-x-1.5">
          <div className="h-2 w-2 bg-gray-400 rounded-full typing-dot"></div>
          <div className="h-2 w-2 bg-gray-400 rounded-full typing-dot"></div>
          <div className="h-2 w-2 bg-gray-400 rounded-full typing-dot"></div>
        </div>
        <div className="text-xs text-gray-400 mt-2 opacity-60">
          {agentName} is typing...
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator; 