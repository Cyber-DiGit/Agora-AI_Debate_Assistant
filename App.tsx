import React, { useState, useEffect } from 'react';
import { DebateSettings, DebateState, DebateRecord } from './types';
import { getDebateWinner } from './services/geminiService';
import DebateSetup from './components/DebateSetup';
import DebateView from './components/DebateView';
import DebateHistoryView from './components/DebateHistoryView';
import Icon from './components/Icon';

type View = 'setup' | 'debate' | 'history' | 'judging';

const App: React.FC = () => {
  const [debateState, setDebateState] = useState<DebateState | null>(null);
  const [history, setHistory] = useState<DebateRecord[]>([]);
  const [view, setView] = useState<View>('setup');
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<DebateRecord | null>(null);

  // Load active debate and history from localStorage on initial render
  useEffect(() => {
    try {
      const savedDebate = localStorage.getItem('agora-ai-debate');
      if (savedDebate) {
        setDebateState(JSON.parse(savedDebate));
        setView('debate');
      }
      const savedHistory = localStorage.getItem('agora-ai-history');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error("Failed to load saved data:", error);
      localStorage.removeItem('agora-ai-debate');
      localStorage.removeItem('agora-ai-history');
    }
  }, []);

  // Persist active debate state
  useEffect(() => {
    try {
      if (debateState) {
        localStorage.setItem('agora-ai-debate', JSON.stringify(debateState));
      } else {
        localStorage.removeItem('agora-ai-debate');
      }
    } catch (error) {
      console.error("Failed to save debate:", error);
    }
  }, [debateState]);

  // Persist history
  useEffect(() => {
    try {
      localStorage.setItem('agora-ai-history', JSON.stringify(history));
    } catch (error) {
      console.error("Failed to save history:", error);
    }
  }, [history]);

  const handleDebateStart = (settings: DebateSettings) => {
    const aiStance = settings.userStance === 'For' ? 'Against' : 'For';
    const newDebateState: DebateState = {
      settings,
      messages: [],
      aiStance,
      isAiTyping: false,
    };
    setDebateState(newDebateState);
    setView('debate');
  };

  const handleEndDebate = async () => {
    if (!debateState || debateState.messages.length === 0) {
      setDebateState(null);
      setView('setup');
      return;
    }
    
    setView('judging');
    const finalDebateState = { ...debateState }; // Capture state before clearing
    setDebateState(null); // Clear active debate immediately

    try {
      const { winner, judgement } = await getDebateWinner(finalDebateState.messages);
      const newRecord: DebateRecord = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        ...finalDebateState,
        winner,
        judgement,
      };
      setHistory(prevHistory => [newRecord, ...prevHistory]);
    } catch (error) {
      console.error("Failed to get debate winner:", error);
      // Even if judging fails, save the debate without a winner
       const newRecord: DebateRecord = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        ...finalDebateState,
        winner: 'draw',
        judgement: 'Could not determine a winner due to an error.',
      };
      setHistory(prevHistory => [newRecord, ...prevHistory]);
    } finally {
      setView('setup');
    }
  };

  const handleViewHistory = (item: DebateRecord) => {
    setSelectedHistoryItem(item);
    setView('history');
  };
  
  const renderView = () => {
    switch (view) {
      case 'judging':
        return (
           <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-gray-800 rounded-lg shadow-xl">
             <Icon name="ai" size="lg" className="text-indigo-400 mb-4" />
             <h2 className="text-2xl font-bold mb-2">The judge is deliberating...</h2>
             <p className="text-gray-400">Analyzing arguments and evidence to determine a winner.</p>
             <div className="flex items-center justify-center space-x-2 mt-6">
               <span className="w-3 h-3 bg-indigo-400 rounded-full animate-pulse delay-0"></span>
               <span className="w-3 h-3 bg-indigo-400 rounded-full animate-pulse delay-200"></span>
               <span className="w-3 h-3 bg-indigo-400 rounded-full animate-pulse delay-400"></span>
             </div>
           </div>
        );
      case 'history':
        return selectedHistoryItem && (
          <DebateHistoryView
            debate={selectedHistoryItem}
            onBack={() => setView('setup')}
          />
        );
      case 'debate':
        return debateState && (
          <DebateView
            initialDebateState={debateState}
            setDebateState={setDebateState}
            onEndDebate={handleEndDebate}
          />
        );
      case 'setup':
      default:
        return <DebateSetup onStartDebate={handleDebateStart} history={history} onViewHistory={handleViewHistory} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 font-sans flex flex-col items-center p-4">
      <header className="w-full max-w-4xl text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
          Agora AI
        </h1>
        <p className="text-gray-400 mt-2">The arena for your ideas. Debate with AI.</p>
      </header>
      <main className="w-full h-full flex-grow max-w-4xl">
        {renderView()}
      </main>
    </div>
  );
};

export default App;
