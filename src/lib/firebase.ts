import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  OAuthProvider,
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  deleteUser,
  signOut, 
  onAuthStateChanged,
  updateProfile,
  User 
} from 'firebase/auth';
import { 
  initializeFirestore,
  memoryLocalCache,
  getFirestore,
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  collection, 
  addDoc,
  onSnapshot, 
  deleteDoc, 
  writeBatch,
  query,
  orderBy,
  serverTimestamp,
  getDocFromServer,
  Firestore
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp({
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId,
});

export const auth = getAuth(app);

// Use memoryLocalCache and auto-detect long polling to prevent IndexedDB and network sandbox errors in iframes
let firestoreDb: Firestore;
const dbId = (firebaseConfig as any)?.firestoreDatabaseId;
try {
  firestoreDb = dbId
    ? initializeFirestore(app, { localCache: memoryLocalCache(), experimentalAutoDetectLongPolling: true }, dbId)
    : initializeFirestore(app, { localCache: memoryLocalCache(), experimentalAutoDetectLongPolling: true });
} catch {
  firestoreDb = dbId 
    ? getFirestore(app, dbId)
    : getFirestore(app);
}

export const db = firestoreDb;


export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Error Context:', JSON.stringify(errInfo));
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const googleWorkspaceProvider = new GoogleAuthProvider();
googleWorkspaceProvider.setCustomParameters({ prompt: 'select_account' });
googleWorkspaceProvider.addScope('https://www.googleapis.com/auth/drive');
googleWorkspaceProvider.addScope('https://www.googleapis.com/auth/drive.file');
googleWorkspaceProvider.addScope('https://www.googleapis.com/auth/drive.readonly');
googleWorkspaceProvider.addScope('https://www.googleapis.com/auth/gmail.readonly');
googleWorkspaceProvider.addScope('https://www.googleapis.com/auth/gmail.send');
googleWorkspaceProvider.addScope('https://www.googleapis.com/auth/gmail.compose');
googleWorkspaceProvider.addScope('https://www.googleapis.com/auth/gmail.modify');
googleWorkspaceProvider.addScope('https://www.googleapis.com/auth/spreadsheets');
googleWorkspaceProvider.addScope('https://www.googleapis.com/auth/spreadsheets.readonly');
googleWorkspaceProvider.addScope('https://www.googleapis.com/auth/calendar');
googleWorkspaceProvider.addScope('https://www.googleapis.com/auth/calendar.events');
googleWorkspaceProvider.addScope('https://www.googleapis.com/auth/calendar.readonly');

let cachedGoogleAccessToken: string | null = null;

export const setGoogleAccessToken = (token: string | null) => {
  cachedGoogleAccessToken = token;
};

export const getGoogleAccessToken = (): string | null => {
  return cachedGoogleAccessToken;
};

export const signInWithGoogleWorkspace = async (): Promise<{ user: User | null; accessToken: string | null; cancelled?: boolean }> => {
  try {
    const result = await signInWithPopup(auth, googleWorkspaceProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken || null;
    if (accessToken) {
      cachedGoogleAccessToken = accessToken;
    }
    return { user: result.user, accessToken, cancelled: false };
  } catch (error: any) {
    if (
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request' ||
      error?.code === 'auth/user-cancelled'
    ) {
      return { user: null, accessToken: null, cancelled: true };
    }
    console.warn('Google Workspace Sign In notice:', error?.message || error);
    return { user: null, accessToken: null, cancelled: false };
  }
};

export const microsoftProvider = new OAuthProvider('microsoft.com');

export {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  deleteUser,
  signOut,
  onAuthStateChanged,
  updateProfile,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  writeBatch,
  query,
  orderBy,
  serverTimestamp
};
export type { User };
