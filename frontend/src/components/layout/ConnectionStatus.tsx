'use client';

import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
  isReconnecting: boolean;
}

export const ConnectionStatus = ({ isConnected, isReconnecting }: ConnectionStatusProps) => {
  if (isConnected) {
    return null; // Don't show anything when connected smoothly
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2 fade-in">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium transition-colors ${
          isReconnecting
            ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-700 dark:text-yellow-400'
            : 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400'
        }`}
      >
        {isReconnecting ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin text-yellow-600 dark:text-yellow-500" />
            <span>Reconnecting...</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4 text-red-600 dark:text-red-500" />
            <span>Connection Lost</span>
          </>
        )}
      </div>
    </div>
  );
};
