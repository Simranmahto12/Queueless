import React from 'react';
import { RefreshCw, CheckCircle2, AlertTriangle, WifiOff, Loader2 } from 'lucide-react';
import type { FirebaseConnectionState } from '@queueless/shared';

export type FirebaseConnectionHealth = 'CONNECTING' | 'CONNECTED' | 'OFFLINE' | 'ERROR';

interface ConnectionStatusBadgeProps {
  connectionState: FirebaseConnectionState;
  connectionHealth: FirebaseConnectionHealth;
  connectionError: string | null;
  onForceSync?: () => Promise<void> | void;
  isSyncing?: boolean;
}

export const ConnectionStatusBadge: React.FC<ConnectionStatusBadgeProps> = ({
  connectionState,
  connectionHealth,
  connectionError,
  onForceSync,
  isSyncing = false,
}) => {
  // Determine plain English display state
  const isConnected = connectionHealth === 'CONNECTED';
  const isOffline = connectionHealth === 'OFFLINE' || connectionState === 'STANDALONE_FALLBACK';
  const isReconnecting = connectionHealth === 'CONNECTING';
  const isError = connectionHealth === 'ERROR';

  return (
    <div className="flex items-center gap-2">
      {/* Plain English Status Pill */}
      {isConnected ? (
        <div
          title="Direct secure connection established with central database."
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-xs"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Connected to Central Server</span>
        </div>
      ) : isReconnecting ? (
        <div
          title="Attempting to re-establish secure connection with central server..."
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-300 shadow-xs animate-pulse"
        >
          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
          <span>Reconnecting...</span>
        </div>
      ) : isError ? (
        <div
          title={connectionError || 'Connection error. Please inspect network.'}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-300 shadow-xs"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          <span>Connection Problem — Check Network</span>
        </div>
      ) : (
        <div
          title="Operating in protected local mode. Changes will be synced to central server automatically."
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 shadow-xs"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>Offline Mode — Changes Pending Sync</span>
        </div>
      )}

      {/* Force Sync Action Button */}
      {onForceSync && (
        <button
          onClick={() => onForceSync()}
          disabled={isSyncing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-borderSoft transition shadow-xs disabled:opacity-50"
          title="Force immediate check and push pending changes to central server"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-primary' : 'text-slate-600'}`} />
          <span>{isSyncing ? 'Syncing...' : 'Force Sync'}</span>
        </button>
      )}
    </div>
  );
};
