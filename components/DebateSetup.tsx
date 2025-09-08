import React, { useState } from 'react';
import { DebateSettings, Stance, DebateRecord } from '../types';
import { SUGGESTED_TOPICS, AI_PERSONAS } from '../constants';
import DebateHistoryList from './DebateHistoryList';

interface DebateSetupProps {
  onStartDebate: (settings: DebateSettings) => void;
  history: DebateRecord[];
  onViewHistory: (item: DebateRecord) => void;
}

const DebateSetup: React.FC<DebateSetupProps> = ({ onStartDebate, history, onViewHistory }) => {
  const [topic, setTopic] = useState('');
  const [userStance, setUserStance] = useState<Stance | null>(null);
  const [aiPersona, setAiPersona] = useState<string>(AI_PERSONAS[0]);

  const handleTopicSelect = (selectedTopic: string) => {
    setTopic(selectedTopic);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic && userStance) {
      onStartDebate({ topic, userStance, aiPersona });
    }
  };

  return (
    <div className="w-full mx-auto space-y-8 animate-fade-in">
      <div className="p-8 bg-slate-800 rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold text-center mb-6">Start a New Debate</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="topic" className="block text-sm font-medium text-slate-300 mb-2">
              What would you like to debate?
            </label>
            <input
              id="topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Should AI have rights?"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div className="text-sm text-slate-400">or choose a suggestion:</div>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_TOPICS.map((suggestedTopic) => (
              <button
                key={suggestedTopic}
                type="button"
                onClick={() => handleTopicSelect(suggestedTopic)}
                className="px-3 py-1 text-sm bg-slate-700 hover:bg-slate-600 rounded-full transition-colors"
              >
                {suggestedTopic}
              </button>
            ))}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Your Stance:</label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setUserStance('For')}
                className={`flex-1 py-2 rounded-md transition-all ${
                  userStance === 'For'
                    ? 'bg-green-600 text-white shadow-lg ring-2 ring-green-400'
                    : 'bg-slate-700 hover:bg-slate-600'
                }`}
              >
                For
              </button>
              <button
                type="button"
                onClick={() => setUserStance('Against')}
                className={`flex-1 py-2 rounded-md transition-all ${
                  userStance === 'Against'
                    ? 'bg-red-600 text-white shadow-lg ring-2 ring-red-400'
                    : 'bg-slate-700 hover:bg-slate-600'
                }`}
              >
                Against
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="ai-persona" className="block text-sm font-medium text-slate-300 mb-2">
              AI Persona:
            </label>
            <select 
              id="ai-persona" 
              value={aiPersona}
              onChange={(e) => setAiPersona(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {AI_PERSONAS.map(persona => <option key={persona} value={persona}>{persona}</option>)}
            </select>
          </div>

          <button
            type="submit"
            disabled={!topic || !userStance}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 rounded-md font-bold text-white transition-all disabled:bg-slate-600 disabled:cursor-not-allowed"
          >
            Begin Debate
          </button>
        </form>
      </div>

      <DebateHistoryList history={history} onViewHistory={onViewHistory} />
    </div>
  );
};

export default DebateSetup;