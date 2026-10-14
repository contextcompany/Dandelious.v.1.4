export interface RemoteDevice {
  id: string;
  name: string;
  platform: 'macOS' | 'Windows' | 'Linux' | 'iPadOS';
  status: 'online' | 'idle' | 'executing';
  pairedAt: number;
  lastActive: number;
  latencyMs: number;
  currentDirectory: string;
  systemStats: {
    cpu: string;
    memory: string;
    nodeVersion: string;
  };
}

export interface RemoteLogItem {
  id: string;
  timestamp: number;
  type: 'command' | 'output' | 'error' | 'status';
  text: string;
  detail?: string;
}

export interface SyncedChatSession {
  id: string;
  title: string;
  messageCount: number;
  lastMessageTime: number;
  status: 'synced' | 'pending';
}

export interface RemoteState {
  isConnected: boolean;
  device: RemoteDevice | null;
  pairingCode: string;
  recentLogs: RemoteLogItem[];
  lastSyncTimestamp: number;
  syncStatus: 'synced' | 'syncing' | 'idle';
  syncedSessions: SyncedChatSession[];
}

const STORAGE_REMOTE_KEY = 'dandelious_remote_state_v2';

export const createDefaultRemoteDevice = (customName?: string, platform?: RemoteDevice['platform']): RemoteDevice => ({
  id: `dev_${Date.now().toString(36)}`,
  name: customName || 'Desktop PC',
  platform: platform || 'macOS',
  status: 'online',
  pairedAt: Date.now(),
  lastActive: Date.now(),
  latencyMs: 14,
  currentDirectory: '~/Projects/Dandelious-Workspace',
  systemStats: {
    cpu: 'Apple Silicon / Intel · 8% Last',
    memory: '14.2 GB / 36 GB',
    nodeVersion: 'v22.4.0'
  }
});

export const loadRemoteState = (): RemoteState => {
  if (typeof window === 'undefined') {
    return {
      isConnected: false,
      device: null,
      pairingCode: '582-914',
      recentLogs: [],
      lastSyncTimestamp: Date.now(),
      syncStatus: 'idle',
      syncedSessions: []
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_REMOTE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        isConnected: Boolean(parsed.isConnected),
        device: parsed.device || null,
        pairingCode: parsed.pairingCode || '582-914',
        recentLogs: Array.isArray(parsed.recentLogs) ? parsed.recentLogs : [],
        lastSyncTimestamp: parsed.lastSyncTimestamp || Date.now(),
        syncStatus: parsed.syncStatus || 'idle',
        syncedSessions: Array.isArray(parsed.syncedSessions) ? parsed.syncedSessions : []
      };
    }
  } catch (e) {
    console.warn('Failed to load remote state:', e);
  }

  return {
    isConnected: false,
    device: null,
    pairingCode: '582-914',
    recentLogs: [],
    lastSyncTimestamp: Date.now(),
    syncStatus: 'idle',
    syncedSessions: []
  };
};

export const saveRemoteState = (state: RemoteState): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_REMOTE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent('dandelious_remote_state_changed', { detail: state }));
  } catch (e) {}
};

export const generateNewPairingCode = (): string => {
  const part1 = Math.floor(100 + Math.random() * 900);
  const part2 = Math.floor(100 + Math.random() * 900);
  const code = `${part1}-${part2}`;
  const current = loadRemoteState();
  const next = { ...current, pairingCode: code };
  saveRemoteState(next);
  return code;
};

export const pairDeviceWithCode = (
  enteredCode: string,
  targetDeviceName?: string,
  targetPlatform?: RemoteDevice['platform']
): { success: boolean; error?: string; state: RemoteState } => {
  const cleanCode = enteredCode.replace(/[^0-9]/g, '');
  if (cleanCode.length !== 6) {
    return {
      success: false,
      error: 'Bitte gib einen gültigen 6-stelligen Kopplungscode ein (z. B. 582-914).',
      state: loadRemoteState()
    };
  }

  const current = loadRemoteState();
  const detectedName = targetDeviceName || (
    cleanCode.startsWith('7') ? 'iPad Pro' :
    cleanCode.startsWith('8') ? 'MacBook Pro' :
    cleanCode.startsWith('9') ? 'Windows PC' :
    'Desktop PC'
  );
  const detectedPlatform = targetPlatform || (
    cleanCode.startsWith('7') ? 'iPadOS' :
    cleanCode.startsWith('8') ? 'macOS' :
    cleanCode.startsWith('9') ? 'Windows' :
    'macOS'
  );

  const device = createDefaultRemoteDevice(detectedName, detectedPlatform);

  const initialSynced: SyncedChatSession[] = [
    {
      id: 'session-synced-1',
      title: 'Full-Stack Architektur & Next.js Setup',
      messageCount: 14,
      lastMessageTime: Date.now() - 1000 * 60 * 15,
      status: 'synced'
    },
    {
      id: 'session-synced-2',
      title: 'Vite & Tailwind CSS Performance',
      messageCount: 8,
      lastMessageTime: Date.now() - 1000 * 60 * 65,
      status: 'synced'
    },
    {
      id: 'session-synced-3',
      title: 'Dandelious Remote Bridge Skript',
      messageCount: 22,
      lastMessageTime: Date.now() - 1000 * 60 * 180,
      status: 'synced'
    }
  ];

  const newState: RemoteState = {
    ...current,
    isConnected: true,
    device,
    lastSyncTimestamp: Date.now(),
    syncStatus: 'synced',
    syncedSessions: current.syncedSessions.length > 0 ? current.syncedSessions : initialSynced,
    recentLogs: [
      {
        id: `log-pair-${Date.now()}`,
        timestamp: Date.now(),
        type: 'status',
        text: `Kopplung erfolgreich mit ${device.name} via Code [${cleanCode.slice(0, 3)}-${cleanCode.slice(3)}].`
      },
      ...current.recentLogs
    ]
  };

  saveRemoteState(newState);
  return { success: true, state: newState };
};

export const connectDesktopDevice = (customName?: string): RemoteState => {
  const current = loadRemoteState();
  const device = createDefaultRemoteDevice(customName);

  const newState: RemoteState = {
    ...current,
    isConnected: true,
    device,
    lastSyncTimestamp: Date.now(),
    syncStatus: 'synced',
    recentLogs: [
      {
        id: `log-init-${Date.now()}`,
        timestamp: Date.now(),
        type: 'status',
        text: `Verbindung zu (${device.name}) hergestellt.`
      },
      ...current.recentLogs
    ]
  };

  saveRemoteState(newState);
  return newState;
};

export const syncChatSessionsToDesktop = (sessions: Array<{ id: string; title: string; messages?: any[] }>): RemoteState => {
  const current = loadRemoteState();
  const converted: SyncedChatSession[] = sessions.slice(0, 16).map((s) => ({
    id: s.id,
    title: s.title || 'Neuer Chat',
    messageCount: s.messages?.length || 0,
    lastMessageTime: Date.now(),
    status: 'synced'
  }));

  const newState: RemoteState = {
    ...current,
    lastSyncTimestamp: Date.now(),
    syncStatus: 'synced',
    syncedSessions: converted.length > 0 ? converted : current.syncedSessions
  };

  saveRemoteState(newState);
  return newState;
};

export const disconnectDesktopDevice = (): RemoteState => {
  const current = loadRemoteState();
  const newState: RemoteState = {
    ...current,
    isConnected: false,
    device: null,
    syncStatus: 'idle',
    recentLogs: [
      {
        id: `log-disc-${Date.now()}`,
        timestamp: Date.now(),
        type: 'status',
        text: 'Verbindung zum Gerät getrennt.'
      },
      ...current.recentLogs
    ]
  };

  saveRemoteState(newState);
  return newState;
};

export const addRemoteLog = (type: RemoteLogItem['type'], text: string, detail?: string): void => {
  const current = loadRemoteState();
  const newItem: RemoteLogItem = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    timestamp: Date.now(),
    type,
    text,
    detail
  };

  const updatedState: RemoteState = {
    ...current,
    recentLogs: [newItem, ...current.recentLogs.slice(0, 49)]
  };

  saveRemoteState(updatedState);
};
