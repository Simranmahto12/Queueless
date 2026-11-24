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
  const isConnected = connectionHealth === 'CONNECTED';
  const isOffline = connectionHealth === 'OFFLINE' || connectionState === 'STANDALONE_FALLBACK';
  const isReconnecting = connectionHealth === 'CONNECTING';
  const isError = connectionHealth === 'ERROR';

  return (
    <div className="flex items-center gap-2">
      {isConnected ? (
        <div
          title="Direct secure connection established with central database."
          className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap bg-emerald-50 text-emerald-800 border border-emerald-300"
        >
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>Connected to Central Server</span>
        </div>
      ) : isReconnecting ? (
        <div
          title="Attempting to re-establish secure connection with central server..."
          className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap bg-blue-50 text-blue-800 border border-blue-300"
        >
          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
          <span>Reconnecting...</span>
        </div>
      ) : isError ? (
        <div
          title={connectionError || 'Connection error. Please inspect network.'}
          className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap bg-rose-50 text-rose-800 border border-rose-300"
        >
          <AlertTriangle className="w-3 h-3 text-rose-600" />
          <span>Connection Problem — Check Network</span>
        </div>
      ) : (
        <div
          title={
            isOffline
              ? 'Operating in protected local mode. Changes will be synced to central server automatically.'
              : 'Connection status is being checked.'
          }
          className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap bg-amber-50 text-amber-900 border border-amber-300"
        >
          <WifiOff className="w-3 h-3 text-amber-600" />
          <span>{isOffline ? 'Offline Mode — Changes Pending Sync' : 'Offline'}</span>
        </div>
      )}

      {onForceSync && (
        <button
          onClick={() => onForceSync()}
          disabled={isSyncing}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium whitespace-nowrap bg-slate-100 hover:bg-slate-200 text-slate-700 border border-borderSoft transition disabled:opacity-50"
          title="Force immediate check and push pending changes to central server"
        >
          <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-primary' : 'text-slate-600'}`} />
          <span>{isSyncing ? 'Syncing...' : 'Force Sync'}</span>
        </button>
      )}
    </div>
  );
};
