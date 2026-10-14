import { 
  db, 
  auth, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  collection,
  deleteDoc,
  serverTimestamp, 
  deleteUser,
  User,
  handleFirestoreError,
  OperationType 
} from '../lib/firebase';
import { SubscriptionTier } from '../types';

export interface UserProfileDocument {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  tier: SubscriptionTier;
  userTier?: SubscriptionTier;
  createdAt: number;
  updatedAt: number;
  lastLoginAt: number;
  authProvider: 'password' | 'google' | 'microsoft' | 'unknown';
  userNickname?: string;
  userOccupation?: string;
  userAbout?: string;
}

export interface SubscriptionStatusDocument {
  tier: SubscriptionTier;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  validUntil?: number;
  stripeSubscriptionId?: string;
  updatedAt?: number;
}

/**
 * Creates or synchronizes the user document in Firestore `/users/{uid}`.
 * Strictly enforces that users cannot elevate their own tier during registration or sync.
 */
export async function createOrUpdateUserProfile(
  user: User, 
  additionalData?: Partial<UserProfileDocument>
): Promise<UserProfileDocument> {
  if (!user || !user.uid) {
    throw new Error('User UID is missing for profile creation.');
  }

  const userDocRef = doc(db, 'users', user.uid);
  const now = Date.now();

  // Determine auth provider
  const providerId = user.providerData?.[0]?.providerId || '';
  let authProvider: UserProfileDocument['authProvider'] = 'password';
  if (providerId.includes('google')) authProvider = 'google';
  else if (providerId.includes('microsoft')) authProvider = 'microsoft';
  else if (providerId.includes('password')) authProvider = 'password';

  try {
    const existingSnap = await getDoc(userDocRef);
    if (existingSnap.exists()) {
      const existingData = existingSnap.data() as UserProfileDocument;
      
      // SECURITY RULE SAFEGUARD:
      // Client is forbidden from modifying 'tier', 'userTier', 'createdAt', or 'uid'.
      // We explicitly preserve existing protected fields from the database.
      const safeAdditionalData = { ...(additionalData || {}) };
      delete (safeAdditionalData as any).tier;
      delete (safeAdditionalData as any).userTier;
      delete (safeAdditionalData as any).createdAt;
      delete (safeAdditionalData as any).uid;

      const updatedProfile: UserProfileDocument = {
        ...existingData,
        email: user.email || existingData.email,
        displayName: user.displayName || safeAdditionalData.displayName || existingData.displayName,
        photoURL: user.photoURL || existingData.photoURL,
        lastLoginAt: now,
        updatedAt: now,
        // Guaranteed immutability of protected fields
        tier: existingData.tier || 'Kostenlos',
        userTier: existingData.tier || 'Kostenlos',
        createdAt: existingData.createdAt || now,
        uid: user.uid,
        ...safeAdditionalData,
      };

      await setDoc(userDocRef, {
        ...updatedProfile,
        _serverUpdated: serverTimestamp()
      }, { merge: true });

      return updatedProfile;
    } else {
      // First-time registration: Tier is immutably set to 'Kostenlos'
      const newProfile: UserProfileDocument = {
        uid: user.uid,
        email: user.email || null,
        displayName: additionalData?.displayName || user.displayName || 'Dandelious-Nutzer',
        photoURL: user.photoURL || null,
        tier: 'Kostenlos', // Default non-escalated tier
        userTier: 'Kostenlos',
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
        authProvider,
        userNickname: additionalData?.userNickname || '',
        userOccupation: additionalData?.userOccupation || '',
        userAbout: additionalData?.userAbout || '',
      };

      await setDoc(userDocRef, {
        ...newProfile,
        _serverCreated: serverTimestamp()
      }, { merge: true });

      return newProfile;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    console.warn('Notice while persisting user profile to Firestore:', err);
    return {
      uid: user.uid,
      email: user.email || null,
      displayName: additionalData?.displayName || user.displayName || 'Dandelious-Nutzer',
      photoURL: user.photoURL || null,
      tier: 'Kostenlos',
      userTier: 'Kostenlos',
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
      authProvider,
    };
  }
}

/**
 * Fetches the user profile document from Firestore `/users/{uid}`.
 */
export async function getUserProfile(uid: string): Promise<UserProfileDocument | null> {
  if (!uid) return null;
  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data() as UserProfileDocument;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `users/${uid}`);
    console.warn('Failed to fetch user profile:', err);
    return null;
  }
}

/**
 * Fetches read-only verified subscription status from `/users/{uid}/subscription/status`.
 * This document is writable solely by server webhooks and admin APIs.
 */
export async function getUserSubscriptionStatus(uid: string): Promise<SubscriptionStatusDocument | null> {
  if (!uid) return null;
  try {
    const subDocRef = doc(db, 'users', uid, 'subscription', 'status');
    const snap = await getDoc(subDocRef);
    if (snap.exists()) {
      return snap.data() as SubscriptionStatusDocument;
    }
    return null;
  } catch (err) {
    console.warn('Notice fetching subscription status:', err);
    return null;
  }
}

/**
 * Updates allowed profile fields in `/users/{uid}`.
 * Strictly prevents privilege escalation by stripping protected keys (tier, userTier, createdAt, uid).
 */
export async function updateUserProfile(
  uid: string, 
  data: Partial<UserProfileDocument>
): Promise<void> {
  if (!uid) return;
  try {
    // Strip protected fields to prevent client-side privilege escalation
    const sanitizedData = { ...data };
    delete (sanitizedData as any).tier;
    delete (sanitizedData as any).userTier;
    delete (sanitizedData as any).createdAt;
    delete (sanitizedData as any).uid;

    const userDocRef = doc(db, 'users', uid);
    await setDoc(userDocRef, {
      ...sanitizedData,
      updatedAt: Date.now(),
      _serverUpdated: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    console.warn('Failed to update user profile:', err);
    throw err;
  }
}

/**
 * GDPR-compliant cascade deletion of all user data.
 * Purges:
 * 1. User chat sessions in `/users/{uid}/chats`
 * 2. User settings in `/users/{uid}/settings`
 * 3. Legacy `/user_settings/{uid}`
 * 4. User profile document `/users/{uid}`
 * 5. Calls server API `/api/auth/delete-account` for backend/database cleanup
 * 6. Deletes Firebase Auth user account
 * 7. Clears client local storage
 */
export async function deleteUserAccount(
  currentUser: User,
  onProgress?: (step: string) => void
): Promise<void> {
  if (!currentUser) {
    throw new Error('Kein angemeldeter Benutzer für die Löschung vorhanden.');
  }

  const uid = currentUser.uid;

  try {
    // Step 1: Clean up Firestore subcollections while authenticated
    onProgress?.('Bereinige Cloud-Chatverläufe...');
    try {
      const chatsRef = collection(db, 'users', uid, 'chats');
      const chatsSnap = await getDocs(chatsRef);
      for (const chatDoc of chatsSnap.docs) {
        await deleteDoc(chatDoc.ref);
      }
    } catch (e) {
      console.warn('Notice while deleting chat subcollection:', e);
    }

    // Step 2: Delete settings subcollection
    onProgress?.('Bereinige persönliche Cloud-Einstellungen...');
    try {
      await deleteDoc(doc(db, 'users', uid, 'settings', 'config'));
      await deleteDoc(doc(db, 'users', uid, 'settings', 'memories'));
      await deleteDoc(doc(db, 'user_settings', uid));
    } catch (e) {
      console.warn('Notice while deleting user settings docs:', e);
    }

    // Step 3: Delete root user document
    onProgress?.('Lösche Benutzerprofil...');
    try {
      await deleteDoc(doc(db, 'users', uid));
    } catch (e) {
      console.warn('Notice while deleting user profile doc:', e);
    }

    // Step 4: Call backend cascade endpoint to clean server databases (PostgreSQL, logs, sessions)
    onProgress?.('Bereinige Server- und Systemdaten...');
    try {
      const idToken = await currentUser.getIdToken();
      await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        }
      });
    } catch (e) {
      console.warn('Notice while calling backend delete endpoint:', e);
    }

    // Step 5: Delete user from Firebase Auth
    onProgress?.('Lösche Authentifizierungskonto...');
    await deleteUser(currentUser);

    // Step 6: Clear local storage artifacts
    onProgress?.('Bereinige lokalen Speicher...');
    try {
      localStorage.removeItem('dandelious_settings_v3');
      localStorage.removeItem('dandelious_chats_v3');
      localStorage.removeItem('dandelious_active_chat');
      localStorage.removeItem('dandelious_memory_topics');
      localStorage.removeItem('dandelious_memory_graph');
      localStorage.removeItem('dandelious_shards_fitness_v4');
      localStorage.removeItem('dandelious_achievements_v7');
    } catch (e) {
      console.warn('Notice while clearing local storage:', e);
    }

  } catch (err: any) {
    console.error('Cascading account deletion error:', err);
    throw err;
  }
}
