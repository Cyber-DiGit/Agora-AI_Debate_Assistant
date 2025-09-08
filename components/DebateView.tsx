import React, { useState, useEffect, useRef } from 'react';
import type { Chat } from '@google/genai';
import { DebateState, Message } from '../types';
import { startOrContinueChat, sendMessageToAI } from '../services/geminiService';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import MessageBubble from './MessageBubble';
import MicButton from './MicButton';
import Icon from './Icon';

interface DebateViewProps {
  initialDebateState: DebateState;
  setDebateState: React.Dispatch<React.SetStateAction<DebateState | null>>;
  onEndDebate: () => void;
}

const DebateView: React.FC<DebateViewProps> = ({
  initialDebateState,
  setDebateState,
  onEndDebate,
}) => {
  const [inputValue, setInputValue] = useState('');
  const chatRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { isSpeaking, speak, cancel: cancelSpeech } = useSpeechSynthesis();

  const handleSpeechResult = (transcript: string) => {
    setInputValue(transcript);
  };

  const handleSpeechEnd = () => {
    // This function is now intentionally left blank.
    // We no longer want to auto-send the message when the user pauses.
    // The user has full control to send via the button or Enter key.
  };

  const { 
    isListening, 
    startListening, 
    stopListening, 
    isSupported: sttSupported,
    resetTranscript
  } = useSpeechRecognition({
    onResult: handleSpeechResult,
    onEnd: handleSpeechEnd,
    onError: (error) => console.error('Speech recognition error:', error),
  });

  useEffect(() => {
    chatRef.current = startOrContinueChat(initialDebateState.settings, initialDebateState.aiStance);

    if (initialDebateState.messages.length === 0) {
      setDebateState(prev => prev ? {...prev, isAiTyping: true} : null);
      sendMessageToAI(chatRef.current, "Begin the debate with your opening statement.").then(response => {
        const aiMessage: Message = {
          id: Date.now().toString(),
          text: response.text,
          sender: 'ai',
          sources: response.sources,
        };
        setDebateState(prev => prev ? { ...prev, messages: [aiMessage], isAiTyping: false } : null);
        speak(response.text);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [initialDebateState.messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !chatRef.current) return;
    
    stopListening();
    cancelSpeech();
    
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
    };
    
    resetTranscript();
    setInputValue('');
    setDebateState(prev => prev ? {
      ...prev,
      messages: [...prev.messages, userMessage],
      isAiTyping: true,
    } : null);

    const response = await sendMessageToAI(chatRef.current, inputValue);

    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: response.text,
      sender: 'ai',
      sources: response.sources,
    };

    setDebateState(prev => prev ? {
      ...prev,
      messages: [...prev.messages, aiMessage],
      isAiTyping: false,
    } : null);
    speak(response.text);
  };
  
  return (
    <div className="flex flex-col h-[85vh] max-w-4xl mx-auto bg-slate-800 rounded-lg shadow-2xl">
      <header className="p-4 border-b border-slate-700 flex justify-between items-center">
        <div>
          <h2 className="font-bold text-lg">{initialDebateState.settings.topic}</h2>
          <p className="text-sm text-slate-400">
            You: <span className="font-semibold text-indigo-400">{initialDebateState.settings.userStance}</span> | 
            AI: <span className="font-semibold text-purple-400">{initialDebateState.aiStance}</span>
          </p>
        </div>
        <button onClick={onEndDebate} className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-md text-sm font-bold transition-colors">
          End Debate
        </button>
      </header>
      
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {initialDebateState.messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {initialDebateState.isAiTyping && (
           <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
              <Icon name="ai" />
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse delay-0"></span>
              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse delay-200"></span>
              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse delay-400"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <footer className="p-4 border-t border-slate-700">
        <div className="flex items-center bg-slate-700 rounded-lg px-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type your argument or use the mic..."
            className="flex-1 bg-transparent p-2 focus:outline-none resize-none h-12"
            rows={1}
            disabled={isListening || initialDebateState.isAiTyping}
          />
          {sttSupported && <MicButton isListening={isListening} isSpeaking={isSpeaking} onToggle={isListening ? stopListening : startListening} />}
           <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || initialDebateState.isAiTyping}
              className="p-2 text-indigo-400 hover:text-indigo-300 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
           >
              <Icon name="send" />
           </button>
        </div>
        {!sttSupported && <p className="text-xs text-center text-yellow-500 mt-2">Voice input is not supported by your browser.</p>}
      </footer>
    </div>
  );
};

export default DebateView;