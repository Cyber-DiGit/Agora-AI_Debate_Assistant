import React, { useState, useEffect, useCallback } from 'react';
import { DebateSettings, DebateState, DebateRecord, UserProfile } from './types';
import { getDebateWinner } from './services/geminiService';
import { initGoogleAuth, signIn, signOut } from './services/googleAuthService';
import { loadHistory as loadHistoryFromDrive, saveHistory as saveHistoryToDrive } from './services/googleDriveService';
import DebateSetup from './components/DebateSetup';
import DebateView from './components/DebateView';
import DebateHistoryView from './components/DebateHistoryView';
import AuthHeader from './components/AuthHeader';
import Icon from './components/Icon';

type View = 'setup' | 'debate' | 'history' | 'judging';

const App: React.FC = () => {
  const [debateState, setDebateState] = useState<DebateState | null>(null);
  const [history, setHistory] = useState<DebateRecord[]>([]);
  const [view, setView] = useState<View>('setup');
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<DebateRecord | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);
  const [isDriveLoading, setIsDriveLoading] = useState(false);

  // Initialize Google Auth and load user
  useEffect(() => {
    initGoogleAuth((profile) => {
      setUser(profile);
      setIsAuthInitialized(true);
    });
  }, []);

  // Load data from Drive or localStorage when auth state is known
  useEffect(() => {
    const loadData = async () => {
      if (!isAuthInitialized) return;

      setIsDriveLoading(true);
      try {
        if (user) {
          const driveHistory = await loadHistoryFromDrive();
          setHistory(driveHistory);
        } else {
          const savedHistory = localStorage.getItem('agora-ai-history');
          if (savedHistory) {
            setHistory(JSON.parse(savedHistory));
          }
        }
      } catch (error) {
        console.error("Failed to load history:", error);
        // Fallback or show error
      } finally {
        setIsDriveLoading(false);
      }
    };
    loadData();
  }, [user, isAuthInitialized]);


  // Persist history to Drive or localStorage
  useEffect(() => {
    const saveData = async () => {
        if (!isAuthInitialized) return; // Don't save until we know the login state

        try {
            if (user) {
                await saveHistoryToDrive(history);
            } else {
                localStorage.setItem('agora-ai-history', JSON.stringify(history));
            }
        } catch (error) {
            console.error("Failed to save history:", error);
        }
    };
    saveData();
  }, [history, user, isAuthInitialized]);

  // Load active debate from localStorage on initial render
   useEffect(() => {
    try {
      const savedDebate = localStorage.getItem('agora-ai-debate');
      if (savedDebate) {
        setDebateState(JSON.parse(savedDebate));
        setView('debate');
      }
    } catch (error) {
      console.error("Failed to load saved debate:", error);
      localStorage.removeItem('agora-ai-debate');
    }
  }, []);

  // Persist active debate state to localStorage (always local)
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
    if (!isAuthInitialized || isDriveLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
           <div className="flex items-center justify-center space-x-2 mt-6">
             <span className="w-4 h-4 bg-indigo-400 rounded-full animate-pulse delay-0"></span>
             <span className="w-4 h-4 bg-indigo-400 rounded-full animate-pulse delay-200"></span>
             <span className="w-4 h-4 bg-indigo-400 rounded-full animate-pulse delay-400"></span>
           </div>
           <p className="mt-4 text-slate-400">Loading your debate history...</p>
        </div>
      );
    }
    switch (view) {
      case 'judging':
        return (
           <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-slate-800 rounded-lg shadow-xl">
             <Icon name="ai" size="lg" className="text-indigo-400 mb-4" />
             <h2 className="text-2xl font-bold mb-2">The judge is deliberating...</h2>
             <p className="text-slate-400">Analyzing arguments and evidence to determine a winner.</p>
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
    <div className="min-h-screen bg-slate-900 font-sans flex flex-col items-center p-4">
      <header className="w-full max-w-4xl text-center mb-4">
        <div className="flex justify-between items-start">
            <div className="flex-1 text-left">
                <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
                Agora AI
                </h1>
                <p className="text-slate-400 mt-2">The arena for your ideas. Debate with AI.</p>
            </div>
            <AuthHeader user={user} onLogin={signIn} onLogout={signOut} isReady={isAuthInitialized}/>
        </div>
      </header>
      <main className="w-full h-full flex-grow max-w-4xl mt-4">
        {renderView()}
      </main>
    </div>
  );
};

export default App;