import React from 'react';
import { DebateRecord, Message } from '../types';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import Icon from './Icon';
import MessageBubble from './MessageBubble';

interface DebateHistoryViewProps {
  debate: DebateRecord;
  onBack: () => void;
}

const DebateHistoryView: React.FC<DebateHistoryViewProps> = ({ debate, onBack }) => {
  const { speak, isSpeaking, cancel } = useSpeechSynthesis();

  const handlePlayAudio = (text: string) => {
    if (isSpeaking) {
      cancel();
    }
    speak(text);
  };

  const getResultColor = () => {
    if (debate.winner === 'user') return 'text-green-400';
    if (debate.winner === 'ai') return 'text-red-400';
    return 'text-yellow-400';
  }

  return (
    <div className="flex flex-col h-[85vh] max-w-4xl mx-auto bg-gray-800 rounded-lg shadow-2xl animate-fade-in">
      <header className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
              <Icon name="arrow-left" />
              <span>Back</span>
            </button>
            <div className="text-right">
                <h2 className="font-bold text-lg">{debate.settings.topic}</h2>
                <p className="text-sm text-gray-400">
                    Debated on: {new Date(debate.timestamp).toLocaleDateString()}
                </p>
            </div>
        </div>
      </header>
      
      <div className="p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-3 bg-gray-900 p-3 rounded-lg">
            <Icon name="trophy" size="lg" className={getResultColor()} />
            <div>
                <h3 className={`font-bold text-lg ${getResultColor()}`}>
                    Result: {debate.winner === 'user' ? 'You Won' : debate.winner === 'ai' ? 'AI Won' : 'Draw'}
                </h3>
                <p className="text-sm text-gray-300 mt-1">{debate.judgement}</p>
            </div>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {debate.messages.map(msg => (
          <div key={msg.id} className="flex items-center gap-2">
            <div className="flex-grow">
              <MessageBubble message={msg} />
            </div>
            {msg.sender === 'ai' && (
              <button
                onClick={() => handlePlayAudio(msg.text)}
                className="p-2 text-gray-400 hover:text-indigo-400 transition-colors rounded-full self-start"
                aria-label="Play AI message audio"
              >
                <Icon name="play" size="sm" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DebateHistoryView;
