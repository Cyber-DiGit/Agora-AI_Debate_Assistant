
import React from 'react';
import { Message } from '../types';
import Icon from './Icon';
import SourceLink from './SourceLink';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  
  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${isUser ? 'bg-indigo-600' : 'bg-gray-700'}`}>
        <Icon name={isUser ? 'user' : 'ai'} />
      </div>
      <div className="flex flex-col">
        <div
          className={`max-w-md p-3 rounded-lg ${
            isUser ? 'bg-indigo-600 rounded-br-none' : 'bg-gray-700 rounded-bl-none'
          }`}
        >
          <p className="whitespace-pre-wrap">{message.text}</p>
        </div>
        {message.sources && message.sources.length > 0 && (
          <div className="mt-2 text-xs text-gray-400">
            <h4 className="font-bold mb-1">Sources:</h4>
            <ul className="space-y-1">
              {message.sources.map((source, index) => (
                <SourceLink key={index} source={source} />
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
