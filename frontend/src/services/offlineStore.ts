import { createSOSAlertAPI } from './api';
import toast from 'react-hot-toast';

const QUEUE_KEY = 'safesphere_offline_sos_queue';

export interface OfflineSOSItem {
  id: string;
  timestamp: number;
  payload: any;
}

export const getOfflineSOSQueue = (): OfflineSOSItem[] => {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveOfflineSOSQueue = (queue: OfflineSOSItem[]): void => {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {}
};

export const queueOfflineSOS = (payload: any): OfflineSOSItem => {
  const queue = getOfflineSOSQueue();
  const newItem: OfflineSOSItem = {
    id: `offline-sos-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    timestamp: Date.now(),
    payload,
  };
  queue.push(newItem);
  saveOfflineSOSQueue(queue);
  return newItem;
};

export const clearOfflineSOSItem = (id: string): void => {
  const queue = getOfflineSOSQueue();
  const filtered = queue.filter(item => item.id !== id);
  saveOfflineSOSQueue(filtered);
};

export const syncOfflineSOSQueue = async (): Promise<{ synced: number; failed: number }> => {
  const queue = getOfflineSOSQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  toast.loading(`Syncing ${queue.length} offline SOS emergency alert(s)...`, { id: 'offline-sync' });

  let synced = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      await createSOSAlertAPI(item.payload);
      clearOfflineSOSItem(item.id);
      synced++;
    } catch (err) {
      failed++;
    }
  }

  if (synced > 0) {
    toast.success(`Successfully synced ${synced} offline SOS alert(s) to emergency dispatchers!`, { id: 'offline-sync' });
  } else if (failed > 0) {
    toast.error(`Failed to sync ${failed} offline SOS alert(s). Retrying when network stabilizes.`, { id: 'offline-sync' });
  }

  return { synced, failed };
};

// Automatic listener for browser reconnecting
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    syncOfflineSOSQueue();
  });
}
