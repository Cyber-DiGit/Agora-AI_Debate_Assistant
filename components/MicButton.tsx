import React from 'react';
import Icon from './Icon';

interface MicButtonProps {
  isListening: boolean;
  isSpeaking: boolean;
  onToggle: () => void;
}

const MicButton: React.FC<MicButtonProps> = ({ isListening, isSpeaking, onToggle }) => {
  let icon: 'mic' | 'mic-off' | 'speaker' = 'mic';
  let colorClass = 'text-slate-400 hover:text-white';
  let pulseClass = '';

  if (isListening) {
    icon = 'mic';
    colorClass = 'text-red-500';
    pulseClass = 'animate-pulse';
  } else if (isSpeaking) {
    icon = 'speaker';
    colorClass = 'text-purple-400';
    pulseClass = 'animate-pulse';
  }
  
  return (
    <button
      onClick={onToggle}
      disabled={isSpeaking}
      className={`relative p-2 rounded-full transition-colors ${colorClass} disabled:text-slate-500 disabled:cursor-not-allowed`}
    >
      <Icon name={icon} />
      {pulseClass && <span className={`absolute inset-0 rounded-full ${colorClass} opacity-25 ${pulseClass}`}></span>}
    </button>
  );
};

export default MicButton;