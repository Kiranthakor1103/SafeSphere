import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, CheckCircle2, ShieldAlert } from 'lucide-react';
import { getOfflineSOSQueue, syncOfflineSOSQueue } from '../../services/offlineStore';

export const NetworkStatusBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [queuedCount, setQueuedCount] = useState<number>(0);
  const [syncing, setSyncing] = useState(false);

  const checkQueue = () => {
    const queue = getOfflineSOSQueue();
    setQueuedCount(queue.length);
  };

  useEffect(() => {
    checkQueue();
    const interval = setInterval(checkQueue, 3000);

    const handleOnline = () => {
      setIsOnline(true);
      checkQueue();
      syncOfflineSOSQueue().finally(checkQueue);
    };

    const handleOffline = () => {
      setIsOnline(false);
      checkQueue();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleManualSync = async () => {
    setSyncing(true);
    await syncOfflineSOSQueue();
    checkQueue();
    setSyncing(false);
  };

  if (isOnline && queuedCount === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      background: !isOnline ? '#ef4444' : '#f59e0b',
      color: '#ffffff',
      padding: '8px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: '13px',
      fontWeight: 600,
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      animation: 'slideDown 0.3s ease-out',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {!isOnline ? <WifiOff size={16} /> : <ShieldAlert size={16} />}
        <span>
          {!isOnline
            ? 'Network Disconnected: SafeSphere is operating in Offline Mode. SOS alerts are queued locally.'
            : `Reconnected! ${queuedCount} offline SOS alert(s) queued for synchronization.`
          }
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {queuedCount > 0 && isOnline && (
          <button
            onClick={handleManualSync}
            disabled={syncing}
            style={{
              background: 'rgba(255,255,255,0.25)',
              border: '1px solid rgba(255,255,255,0.4)',
              color: '#ffffff',
              padding: '4px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            <RefreshCw size={12} className={syncing ? 'spinner-icon' : ''} />
            {syncing ? 'Syncing...' : `Sync Now (${queuedCount})`}
          </button>
        )}
      </div>
    </div>
  );
};

export default NetworkStatusBanner;
