import React from 'react';
import { DebateRecord, Winner } from '../types';
import Icon from './Icon';

interface DebateHistoryListProps {
  history: DebateRecord[];
  onViewHistory: (item: DebateRecord) => void;
}

const ResultBadge: React.FC<{ result: Winner }> = ({ result }) => {
    const baseClasses = "px-2.5 py-0.5 text-xs font-semibold rounded-full";
    if (result === 'user') {
        return <span className={`${baseClasses} bg-green-200 text-green-800`}>Win</span>;
    }
    if (result === 'ai') {
        return <span className={`${baseClasses} bg-red-200 text-red-800`}>Loss</span>;
    }
    return <span className={`${baseClasses} bg-yellow-200 text-yellow-800`}>Draw</span>;
};

const DebateHistoryList: React.FC<DebateHistoryListProps> = ({ history, onViewHistory }) => {
  if (history.length === 0) {
    return null;
  }

  return (
    <div className="p-8 bg-gray-800 rounded-lg shadow-xl">
      <div className="flex items-center gap-3 mb-4">
        <Icon name="history" className="text-gray-400" />
        <h2 className="text-2xl font-bold text-center">Debate History</h2>
      </div>
      <ul className="space-y-3">
        {history.map(item => (
          <li key={item.id}>
            <button
              onClick={() => onViewHistory(item)}
              className="w-full text-left p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex justify-between items-center"
            >
              <div>
                <p className="font-bold text-gray-100 truncate">{item.settings.topic}</p>
                <p className="text-sm text-gray-400">
                  {new Date(item.timestamp).toLocaleString()}
                </p>
              </div>
              <ResultBadge result={item.winner} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DebateHistoryList;
