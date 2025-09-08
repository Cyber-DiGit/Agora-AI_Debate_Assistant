import React from 'react';

interface ConfigErrorProps {
  messages: string[];
}

const ConfigError: React.FC<ConfigErrorProps> = ({ messages }) => {
  return (
    <div className="min-h-screen bg-slate-900 font-sans flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md w-full p-8 bg-slate-800 rounded-lg shadow-xl border border-red-500/30">
        <div className="w-16 h-16 mx-auto flex items-center justify-center bg-red-500/10 rounded-full mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-red-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.25-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
            </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-100 mb-2">Configuration Error</h1>
        <p className="text-slate-400 mb-4">
          This application is not properly configured. Please correct the following issues:
        </p>
        <ul className="text-left text-slate-300 bg-slate-700/50 p-3 rounded-md space-y-2">
            {messages.map((msg, index) => (
                <li key={index} className="flex items-start">
                    <span className="text-red-400 mr-2 font-mono">&gt;</span>
                    <span>{msg}</span>
                </li>
            ))}
        </ul>
        <p className="text-slate-500 text-sm mt-4">
          If you are the owner of this site, please set the required environment variables in your deployment settings.
        </p>
      </div>
    </div>
  );
};

export default ConfigError;
