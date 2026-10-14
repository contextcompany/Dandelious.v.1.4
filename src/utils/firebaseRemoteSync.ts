import { db } from '../lib/firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc 
} from 'firebase/firestore';
import { RemoteDevice, RemoteState, SyncedChatSession, loadRemoteState, saveRemoteState } from './remoteConnection';

const STORAGE_DEVICE_ID = 'dandelious_remote_device_id';
const STORAGE_PAIRING_CODE = 'dandelious_remote_pairing_code';

export interface FirebaseRemoteDeviceDoc {
  id: string;
  pairingCode: string;
  cleanCode: string;
  deviceName: string;
  platform: 'macOS' | 'Windows' | 'Linux' | 'iPadOS';
  status: 'waiting' | 'paired';
  pairedWithDeviceId: string | null;
  pairedWithDeviceName: string | null;
  lastActive: number;
  syncedChats?: SyncedChatSession[];
}

export const getOrCreateDeviceId = (): string => {
  if (typeof window === 'undefined') return 'server_device';
  let id = localStorage.getItem(STORAGE_DEVICE_ID);
  if (!id) {
    id = `dev_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
    localStorage.setItem(STORAGE_DEVICE_ID, id);
  }
  return id;
};

export const detectCurrentDevicePlatform = (): { name: string; platform: RemoteDevice['platform'] } => {
  if (typeof window === 'undefined') return { name: 'Desktop PC', platform: 'macOS' };
  const ua = window.navigator.userAgent.toLowerCase();
  
  if (/ipad/.test(ua) || (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)) {
    return { name: 'iPad Pro', platform: 'iPadOS' };
  }
  if (/iphone/.test(ua)) {
    return { name: 'iPhone', platform: 'iPadOS' };
  }
  if (/android/.test(ua)) {
    return { name: 'Android Tablet / Handy', platform: 'Linux' };
  }
  if (/windows/.test(ua)) {
    return { name: 'Windows PC', platform: 'Windows' };
  }
  if (/macintosh|mac os x/.test(ua)) {
    return { name: 'MacBook Pro', platform: 'macOS' };
  }
  if (/linux/.test(ua)) {
    return { name: 'Linux Desktop', platform: 'Linux' };
  }
  return { name: 'Desktop PC', platform: 'macOS' };
};

export const generateUnique6DigitCode = (): string => {
  const num1 = Math.floor(100 + Math.random() * 900);
  const num2 = Math.floor(100 + Math.random() * 900);
  return `${num1}-${num2}`;
};

export const registerDeviceInFirestore = async (customName?: string): Promise<{ deviceId: string; pairingCode: string }> => {
  const deviceId = getOrCreateDeviceId();
  let pairingCode = localStorage.getItem(STORAGE_PAIRING_CODE);

  if (!pairingCode) {
    pairingCode = generateUnique6DigitCode();
    localStorage.setItem(STORAGE_PAIRING_CODE, pairingCode);
  }

  const cleanCode = pairingCode.replace(/[^0-9]/g, '');
  const detected = detectCurrentDevicePlatform();
  const deviceName = customName || detected.name;

  const docData: FirebaseRemoteDeviceDoc = {
    id: deviceId,
    pairingCode,
    cleanCode,
    deviceName,
    platform: detected.platform,
    status: 'waiting',
    pairedWithDeviceId: null,
    pairedWithDeviceName: null,
    lastActive: Date.now()
  };

  try {
    // 1. Save device document
    await setDoc(doc(db, 'remote_devices', deviceId), docData, { merge: true });

    // 2. Save pairing lookup document for fast code query
    await setDoc(doc(db, 'remote_pairings', cleanCode), {
      code: cleanCode,
      deviceId,
      deviceName,
      updatedAt: Date.now()
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore device registration notice:', err);
  }

  return { deviceId, pairingCode };
};

export const subscribeToDevicePairing = (
  deviceId: string,
  onPairedChange: (isPaired: boolean, partnerData: { id: string; name: string; platform?: any } | null) => void
): (() => void) => {
  try {
    const unsub = onSnapshot(doc(db, 'remote_devices', deviceId), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as FirebaseRemoteDeviceDoc;
        if (data.status === 'paired' && data.pairedWithDeviceId) {
          onPairedChange(true, {
            id: data.pairedWithDeviceId,
            name: data.pairedWithDeviceName || 'Gekoppeltes Gerät'
          });
        } else {
          onPairedChange(false, null);
        }
      }
    }, (err) => {
      console.warn('Firestore pairing snapshot notice:', err);
    });

    return unsub;
  } catch (err) {
    console.warn('Error subscribing to device pairing:', err);
    return () => {};
  }
};

export const pairWithRemoteCode = async (
  enteredCode: string
): Promise<{ success: boolean; partnerName?: string; error?: string }> => {
  const cleanCode = enteredCode.replace(/[^0-9]/g, '');
  if (cleanCode.length !== 6) {
    return { success: false, error: 'Bitte gib einen 6-stelligen Code ein (z. B. 492-815).' };
  }

  const myDeviceId = getOrCreateDeviceId();
  const myDetected = detectCurrentDevicePlatform();

  try {
    // 1. Look up target pairing code
    const pairingSnap = await getDoc(doc(db, 'remote_pairings', cleanCode));
    let targetDeviceId: string | null = null;
    let targetDeviceName = 'Remote Desktop';

    if (pairingSnap.exists()) {
      targetDeviceId = pairingSnap.data()?.deviceId;
      targetDeviceName = pairingSnap.data()?.deviceName || 'Remote Desktop';
    } else {
      // Fallback query across remote_devices
      const q = query(collection(db, 'remote_devices'), where('cleanCode', '==', cleanCode));
      const qSnap = await getDocs(q);
      if (!qSnap.empty) {
        const firstDoc = qSnap.docs[0];
        targetDeviceId = firstDoc.id;
        targetDeviceName = firstDoc.data().deviceName || 'Remote Desktop';
      }
    }

    if (!targetDeviceId) {
      return { 
        success: false, 
        error: `Kein Gerät mit Code ${cleanCode.slice(0, 3)}-${cleanCode.slice(3)} gefunden. Stelle sicher, dass Dandelious auf dem PC oder iPad geöffnet ist.` 
      };
    }

    if (targetDeviceId === myDeviceId) {
      return {
        success: false,
        error: 'Du kannst dieses Gerät nicht mit sich selbst koppeln. Verwende den Code eines anderen Geräts.'
      };
    }

    // 2. Link target device in Firestore
    await updateDoc(doc(db, 'remote_devices', targetDeviceId), {
      status: 'paired',
      pairedWithDeviceId: myDeviceId,
      pairedWithDeviceName: myDetected.name,
      lastActive: Date.now()
    });

    // 3. Link this device in Firestore
    await updateDoc(doc(db, 'remote_devices', myDeviceId), {
      status: 'paired',
      pairedWithDeviceId: targetDeviceId,
      pairedWithDeviceName: targetDeviceName,
      lastActive: Date.now()
    });

    return { success: true, partnerName: targetDeviceName };
  } catch (err: any) {
    console.warn('Pairing error in Firestore:', err);
    return { success: false, error: 'Verbindungsfehler. Bitte versuche es erneut.' };
  }
};

export const unpairRemoteDevices = async (): Promise<void> => {
  const myDeviceId = getOrCreateDeviceId();
  try {
    const myDoc = await getDoc(doc(db, 'remote_devices', myDeviceId));
    if (myDoc.exists()) {
      const data = myDoc.data() as FirebaseRemoteDeviceDoc;
      const partnerId = data.pairedWithDeviceId;

      await updateDoc(doc(db, 'remote_devices', myDeviceId), {
        status: 'waiting',
        pairedWithDeviceId: null,
        pairedWithDeviceName: null,
        lastActive: Date.now()
      });

      if (partnerId) {
        try {
          await updateDoc(doc(db, 'remote_devices', partnerId), {
            status: 'waiting',
            pairedWithDeviceId: null,
            pairedWithDeviceName: null,
            lastActive: Date.now()
          });
        } catch {}
      }
    }
  } catch (err) {
    console.warn('Unpair notice:', err);
  }
};
