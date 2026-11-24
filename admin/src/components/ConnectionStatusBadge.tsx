import React, { useEffect, useState } from 'react';
import { collection, limit, onSnapshot, query } from 'firebase/firestore';
import { getFirebaseServices, type FirebaseConnectionState } from '@queueless/shared';

type FirebaseConnectionHealth = 'CONNECTING' | 'CONNECTED' | 'OFFLINE' | 'ERROR';

interface ConnectionStatusBadgeProps {
  connectionState: FirebaseConnectionState;
}

export const ConnectionStatusBadge: React.FC<ConnectionStatusBadgeProps> = ({
  connectionState,
}) => {
  const [health, setHealth] = useState<FirebaseConnectionHealth>('CONNECTING');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const services = getFirebaseServices();
    setError(services.connectionError);

    if (!services.db || !services.isConfigured) {
      setHealth('OFFLINE');
      return;
    }

    setHealth('CONNECTING');
    const healthQuery = query(collection(services.db, 'institutions'), limit(1));
    const unsubscribe = onSnapshot(
      healthQuery,
      { includeMetadataChanges: true },
      (snapshot) => {
        if (snapshot.metadata.fromCache) {
          setHealth(typeof navigator !== 'undefined' && !navigator.onLine ? 'OFFLINE' : 'CONNECTING');
          return;
        }

        setHealth('CONNECTED');
        setError(null);
      },
      (connectionError) => {
        setHealth('ERROR');
        setError(connectionError.message);
      }
    );

    const handleOffline = () => setHealth('OFFLINE');
    const handleOnline = () => setHealth('CONNECTING');
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      unsubscribe();
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const healthLabel = {
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    OFFLINE: 'offline',
    ERROR: 'connection error',
  }[health];

  if (connectionState === 'STANDALONE_FALLBACK') {
    return (
      <div
        title={`${error || 'Firebase is not configured.'} Using local in-memory data; changes are not persisted to Firebase.`}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 cursor-help"
      >
        <span className="w-2 h-2 rounded-full bg-amber-500" />
        <span>Local fallback</span>
      </div>
    );
  }

  const isConnected = health === 'CONNECTED';
  const isError = health === 'ERROR';
  const badgeClass = isConnected
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : isError
      ? 'bg-red-50 text-red-700 border-red-200'
      : 'bg-amber-50 text-amber-800 border-amber-200';
  const dotClass = isConnected
    ? 'bg-emerald-500 animate-pulse'
    : isError
      ? 'bg-red-500'
      : 'bg-amber-500';
  const label = connectionState === 'LOCAL_EMULATOR' ? 'Firebase Emulator' : 'Cloud Firestore';
  const title =
    error ||
    `${connectionState === 'LOCAL_EMULATOR' ? 'Development Firebase Emulator' : 'Cloud Firestore'} ${healthLabel}.`;

  return (
    <div
      title={title}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${badgeClass}`}
    >
      <span className={`w-2 h-2 rounded-full ${dotClass}`} />
      <span>{label} {healthLabel}</span>
    </div>
  );
};
