import React from 'react';

type AvatarProps = {
  role: 'user' | 'assistant';
  name: string;
  size?: 'sm' | 'md' | 'lg';
};

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

const Avatar: React.FC<AvatarProps> = ({ role, name, size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-8 w-8 text-sm',
    lg: 'h-10 w-10 text-base',
  };

  return (
    <div 
      className={`rounded-full flex items-center justify-center font-medium ${sizeClasses[size]} ${
        role === 'assistant' ? 'avatar-assistant' : 'avatar-user'
      }`}
    >
      {getInitials(name)}
    </div>
  );
};

export default Avatar; 