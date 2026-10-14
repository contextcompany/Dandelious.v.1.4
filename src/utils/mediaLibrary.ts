import { db, auth } from '../lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  updateDoc, 
  increment, 
  arrayUnion, 
  arrayRemove 
} from 'firebase/firestore';
import { ChatSession } from '../types';

export interface MediathekItem {
  id: string;
  type: 'document' | 'image' | 'video' | 'music' | 'code' | 'deep_research' | 'canvas' | 'lernhilfe' | string;
  title: string;
  description?: string;
  createdAt: number;
  updatedAt?: number;
  authorName: string;
  authorId?: string;
  url?: string; // Image URL or audio URL or video URL
  content?: string; // Document text, markdown or code
  language?: string;
  tags?: string[];
  isPublished?: boolean;
  publishedId?: string;
  likesCount?: number;
  likedBy?: string[];
  category?: string;
  isPrivateShared?: boolean;
  privateShareToken?: string;
  privateShareUrl?: string;
  docMetadata?: {
    docId?: string;
    status?: string;
    classification?: string;
    lastUpdated?: string;
  };
}

const STORAGE_KEY = 'saphire_mediathek_custom_items';
const STORAGE_DELETED_KEY = 'saphire_mediathek_deleted_ids';
const STORAGE_LIKES_KEY = 'saphire_user_liked_items';
const STORAGE_UNLOCKED_PRIVATE_KEY = 'saphire_unlocked_private_items';

// Get set of deleted item IDs to prevent re-extracting deleted session artifacts
export const getDeletedMediathekIds = (): Set<string> => {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_DELETED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch (e) {
    return new Set();
  }
};

export const addDeletedMediathekId = (id: string) => {
  if (typeof window === 'undefined') return;
  try {
    const set = getDeletedMediathekIds();
    set.add(id);
    localStorage.setItem(STORAGE_DELETED_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.error(e);
  }
};

// Get local user liked items
export const getUserLikedItemIds = (): Set<string> => {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_LIKES_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch (e) {
    return new Set();
  }
};

// Get local mediathek items
export const getLocalMediathekItems = (): MediathekItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const deleted = getDeletedMediathekIds();
    const items: MediathekItem[] = raw ? JSON.parse(raw) : [];
    const active = items.filter(i => i && i.id && !deleted.has(i.id));

    // Deduplicate by URL or normalized Title/ID to prevent duplicate spam
    const seen = new Set<string>();
    const deduplicated: MediathekItem[] = [];
    for (const item of active) {
      const key = item.url
        ? `url:${item.url.trim().toLowerCase()}`
        : (item.id ? `id:${item.id}` : `title:${(item.title || '').trim().toLowerCase()}`);

      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(item);
      }
    }

    // If duplicates were cleaned up, re-save clean list
    if (deduplicated.length !== items.length) {
      saveLocalMediathekItems(deduplicated);
    }

    return deduplicated;
  } catch (e) {
    console.error('Error loading local mediathek items:', e);
    return [];
  }
};

// Save local mediathek items
export const saveLocalMediathekItems = (items: MediathekItem[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Error saving local mediathek items:', e);
  }
};

// Add a single item to local & user Firestore
export const addMediathekItem = async (item: Omit<MediathekItem, 'id' | 'createdAt'> & { id?: string; createdAt?: number }): Promise<MediathekItem> => {
  const localItems = getLocalMediathekItems();

  // Deduplicate by ID or identical URL
  const existingIdx = localItems.findIndex(i =>
    (item.id && i.id === item.id) ||
    (item.url && i.url && item.url.trim().toLowerCase() === i.url.trim().toLowerCase())
  );

  if (existingIdx >= 0) {
    const existing = localItems[existingIdx];
    const updatedItem: MediathekItem = {
      ...existing,
      ...item,
      id: existing.id,
      updatedAt: Date.now()
    };
    const updatedLocal = [...localItems];
    updatedLocal[existingIdx] = updatedItem;
    saveLocalMediathekItems(updatedLocal);
    return updatedItem;
  }

  const newItem: MediathekItem = {
    id: item.id || (item.url ? `med_url_${Math.abs(item.url.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0)).toString(36)}` : `med_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`),
    createdAt: item.createdAt || Date.now(),
    updatedAt: Date.now(),
    likesCount: 0,
    likedBy: [],
    ...item,
  };

  // 1. Local
  const updatedLocal = [newItem, ...localItems];
  saveLocalMediathekItems(updatedLocal);

  // 2. Firestore if user is authenticated
  const currentUser = auth.currentUser;
  if (currentUser) {
    try {
      const userItemRef = doc(db, 'users', currentUser.uid, 'mediathek', newItem.id);
      await setDoc(userItemRef, newItem, { merge: true });
    } catch (err) {
      console.warn('Firestore user mediathek sync notice:', err);
    }
  }

  return newItem;
};

// Delete item completely (from local, Firestore user library, and community hub if published)
export const deleteMediathekItem = async (id: string, publishedId?: string): Promise<void> => {
  // 1. Add to permanent deleted blacklist
  addDeletedMediathekId(id);
  if (publishedId) addDeletedMediathekId(publishedId);

  // 2. Delete from local list
  const localItems = getLocalMediathekItems().filter(i => i.id !== id && i.id !== publishedId);
  saveLocalMediathekItems(localItems);

  // 3. Delete from Community Hub in Firestore
  try {
    await deleteDoc(doc(db, 'community_hub', id));
    if (publishedId) {
      await deleteDoc(doc(db, 'community_hub', publishedId));
    }
    await deleteDoc(doc(db, 'community_hub', `pub_${id}`));
  } catch (err) {
    console.warn('Firestore delete community hub item notice:', err);
  }

  // 4. Firestore user doc
  const currentUser = auth.currentUser;
  if (currentUser) {
    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'mediathek', id));
      if (publishedId) {
        await deleteDoc(doc(db, 'users', currentUser.uid, 'mediathek', publishedId));
      }
    } catch (err) {
      console.warn('Firestore delete mediathek item notice:', err);
    }
  }
};

// Unpublish item from Community Hub
export const unpublishFromCommunityHub = async (item: MediathekItem): Promise<boolean> => {
  try {
    const pubId = item.publishedId || item.id || `pub_${item.id}`;
    
    // Delete from Firestore community_hub
    try {
      await deleteDoc(doc(db, 'community_hub', pubId));
      await deleteDoc(doc(db, 'community_hub', item.id));
      await deleteDoc(doc(db, 'community_hub', `pub_${item.id}`));
    } catch (e) {
      console.warn('Delete from community_hub notice:', e);
    }

    // Update local state
    const localItems = getLocalMediathekItems();
    const idx = localItems.findIndex(i => i.id === item.id || i.id === pubId);
    if (idx >= 0) {
      localItems[idx].isPublished = false;
      delete localItems[idx].publishedId;
      saveLocalMediathekItems(localItems);
    }

    // Update user's Firestore item if logged in
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        const userItemRef = doc(db, 'users', currentUser.uid, 'mediathek', item.id);
        await updateDoc(userItemRef, { isPublished: false, publishedId: null });
      } catch (err) {
        // Ignored
      }
    }

    return true;
  } catch (err) {
    console.error('Error unpublishing from Community Hub:', err);
    return false;
  }
};

// Publish item to Community Hub in Firestore
export const publishToCommunityHub = async (item: MediathekItem, authorNickname?: string): Promise<boolean> => {
  try {
    const pubId = item.publishedId || `pub_${item.id}`;
    const currentUser = auth.currentUser;
    const author = authorNickname || currentUser?.displayName || currentUser?.email?.split('@')[0] || item.authorName || 'Dandelious Creator';

    const communityPayload: MediathekItem = {
      ...item,
      id: pubId,
      isPublished: true,
      publishedId: pubId,
      authorName: author,
      authorId: currentUser?.uid || 'anon',
      updatedAt: Date.now(),
      likesCount: item.likesCount || 0,
      likedBy: item.likedBy || [],
    };

    const hubDocRef = doc(db, 'community_hub', pubId);
    await setDoc(hubDocRef, communityPayload, { merge: true });

    // Mark local item as published
    const localItems = getLocalMediathekItems();
    const idx = localItems.findIndex(i => i.id === item.id);
    if (idx >= 0) {
      localItems[idx].isPublished = true;
      localItems[idx].publishedId = pubId;
      saveLocalMediathekItems(localItems);
    }

    return true;
  } catch (err) {
    console.error('Error publishing to Community Hub:', err);
    return false;
  }
};

// Generate a secure, unique private share token
export const generatePrivateToken = (itemId: string): string => {
  const rand = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 8);
  return `pvt_${itemId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)}_${rand}`;
};

// Publish item to Private Shared Hub in Firestore (Accessible only via unique secret link / token)
export const publishToPrivateShare = async (
  item: MediathekItem, 
  authorNickname?: string
): Promise<{ success: boolean; token: string; shareUrl: string }> => {
  try {
    const token = item.privateShareToken || generatePrivateToken(item.id);
    const currentUser = auth.currentUser;
    const author = authorNickname || currentUser?.displayName || currentUser?.email?.split('@')[0] || item.authorName || 'Dandelious Creator';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://dandelious.ai';
    const shareUrl = `${baseUrl}/?privateDoc=${encodeURIComponent(token)}`;

    const privatePayload: MediathekItem = {
      ...item,
      id: item.id,
      isPrivateShared: true,
      privateShareToken: token,
      privateShareUrl: shareUrl,
      authorName: author,
      authorId: currentUser?.uid || 'anon',
      updatedAt: Date.now()
    };

    // Save to Firestore private_hub collection
    const privateDocRef = doc(db, 'private_hub', token);
    await setDoc(privateDocRef, privatePayload, { merge: true });

    // Update local item
    const localItems = getLocalMediathekItems();
    const idx = localItems.findIndex(i => i.id === item.id);
    if (idx >= 0) {
      localItems[idx].isPrivateShared = true;
      localItems[idx].privateShareToken = token;
      localItems[idx].privateShareUrl = shareUrl;
      saveLocalMediathekItems(localItems);
    }

    // Save to unlocked list for easy self-access
    saveUnlockedPrivateItem(privatePayload);

    return { success: true, token, shareUrl };
  } catch (err) {
    console.error('Error publishing to Private Hub:', err);
    return { success: false, token: '', shareUrl: '' };
  }
};

// Unpublish from Private Shared Hub
export const unpublishFromPrivateShare = async (item: MediathekItem): Promise<boolean> => {
  try {
    if (item.privateShareToken) {
      try {
        await deleteDoc(doc(db, 'private_hub', item.privateShareToken));
      } catch (e) {
        console.warn('Delete from private_hub notice:', e);
      }
    }

    // Update local item
    const localItems = getLocalMediathekItems();
    const idx = localItems.findIndex(i => i.id === item.id || (item.privateShareToken && i.privateShareToken === item.privateShareToken));
    if (idx >= 0) {
      localItems[idx].isPrivateShared = false;
      delete localItems[idx].privateShareToken;
      delete localItems[idx].privateShareUrl;
      saveLocalMediathekItems(localItems);
    }

    // Remove from unlocked private storage
    if (item.privateShareToken) {
      removeUnlockedPrivateItem(item.privateShareToken);
    }

    return true;
  } catch (err) {
    console.error('Error unpublishing private share:', err);
    return false;
  }
};

// Fetch a single private item by token from Firestore
export const getPrivateSharedItem = async (token: string): Promise<MediathekItem | null> => {
  const cleanToken = token.trim().replace(/^.*[?&]privateDoc=/, '').replace(/^.*[?&]privateMedia=/, '').trim();
  if (!cleanToken) return null;

  try {
    const docRef = doc(db, 'private_hub', cleanToken);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as MediathekItem;
      const fullItem: MediathekItem = {
        ...data,
        id: data.id || `pvt_item_${cleanToken}`,
        isPrivateShared: true,
        privateShareToken: cleanToken
      };
      // Auto save to local unlocked items
      saveUnlockedPrivateItem(fullItem);
      return fullItem;
    }
  } catch (err) {
    console.warn('Error fetching private shared item:', err);
  }
  return null;
};

// Local storage for private unlocked items
export const getUnlockedPrivateItems = (): MediathekItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_UNLOCKED_PRIVATE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const saveUnlockedPrivateItem = (item: MediathekItem) => {
  if (typeof window === 'undefined' || !item) return;
  try {
    const existing = getUnlockedPrivateItems();
    const filtered = existing.filter(i => 
      i.id !== item.id && 
      (!item.privateShareToken || i.privateShareToken !== item.privateShareToken)
    );
    const updated = [item, ...filtered];
    localStorage.setItem(STORAGE_UNLOCKED_PRIVATE_KEY, JSON.stringify(updated.slice(0, 100)));
  } catch (e) {
    console.error('Error saving unlocked private item:', e);
  }
};

export const removeUnlockedPrivateItem = (tokenOrId: string) => {
  if (typeof window === 'undefined') return;
  try {
    const existing = getUnlockedPrivateItems();
    const updated = existing.filter(i => i.id !== tokenOrId && i.privateShareToken !== tokenOrId);
    localStorage.setItem(STORAGE_UNLOCKED_PRIVATE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error(e);
  }
};

// Toggle like on Community Hub item (Enforces 1 like per item!)
export const toggleLikeCommunityItem = async (itemId: string, userId?: string): Promise<{ liked: boolean; newCount: number }> => {
  const currentUser = auth.currentUser;
  const uid = userId || currentUser?.uid || 'guest';
  const likedSet = getUserLikedItemIds();
  const isCurrentlyLiked = likedSet.has(itemId);

  let newCountDelta = 1;
  let isNowLiked = true;

  if (isCurrentlyLiked) {
    // Unlike
    likedSet.delete(itemId);
    newCountDelta = -1;
    isNowLiked = false;
  } else {
    // Like
    likedSet.add(itemId);
    newCountDelta = 1;
    isNowLiked = true;
  }

  // Save to localStorage
  try {
    localStorage.setItem(STORAGE_LIKES_KEY, JSON.stringify(Array.from(likedSet)));
  } catch (e) {
    console.error(e);
  }

  // Firestore update
  try {
    const itemRef = doc(db, 'community_hub', itemId);
    await updateDoc(itemRef, {
      likesCount: increment(newCountDelta),
      likedBy: isNowLiked ? arrayUnion(uid) : arrayRemove(uid)
    });
  } catch (err) {
    console.warn('Error updating like in Firestore:', err);
  }

  return { liked: isNowLiked, newCount: newCountDelta };
};

// Helper to extract image URLs from markdown or HTML content
export const extractImagesFromContent = (content: string): Array<{ url: string; title: string }> => {
  const images: Array<{ url: string; title: string }> = [];
  if (!content) return images;

  // 1. Markdown images: ![Alt text](url) (both absolute https:// and relative /api/...)
  const mdRegex = /!\[(.*?)\]\(((\/api\/[^\s\)]+)|(https?:\/\/[^\s\)]+))\)/g;
  let match: RegExpExecArray | null;
  while ((match = mdRegex.exec(content)) !== null) {
    const title = match[1]?.trim() || 'Internet-Bild';
    const url = match[2]?.trim();
    if (url && !images.some(i => i.url.toLowerCase() === url.toLowerCase())) {
      images.push({ url, title });
    }
  }

  // 2. HTML img tags: <img src="url" alt="..." />
  const htmlRegex = /<img[^>]+src=["']((\/api\/[^"']+) | (https?:\/\/[^"']+))["'][^>]*>/gi;
  while ((match = htmlRegex.exec(content)) !== null) {
    const url = match[1]?.trim();
    const altMatch = match[0].match(/alt=["']([^"']*)["']/i);
    const title = altMatch ? altMatch[1]?.trim() : 'Internet-Bild';
    if (url && !images.some(i => i.url.toLowerCase() === url.toLowerCase())) {
      images.push({ url, title: title || 'Internet-Bild' });
    }
  }

  // 3. Direct image URLs on their own lines
  const directUrlRegex = /(https?:\/\/[^\s<>"'\)]+\.(?:png|jpg|jpeg|webp|svg|gif)(?:\?[^\s<>"'\)]*)?)/gi;
  while ((match = directUrlRegex.exec(content)) !== null) {
    const url = match[1]?.trim();
    if (url && !images.some(i => i.url.toLowerCase() === url.toLowerCase())) {
      images.push({ url, title: 'Internet-Bild' });
    }
  }

  return images;
};

// Scan sessions for generated documents/artifacts and images to auto-populate Mediathek
export const extractItemsFromSessions = (sessions: ChatSession[]): MediathekItem[] => {
  const extracted: MediathekItem[] = [];
  const seenIds = new Set<string>();
  const seenUrls = new Set<string>();
  const deletedIds = getDeletedMediathekIds();

  sessions.forEach(session => {
    // Check if whole session is Deep Research
    const isDeepResearchSession = session.title?.toLowerCase().includes('research') || 
                                  session.messages.some(m => m.content.includes('[Deep Research]') || m.content.includes('Forschungsbericht'));

    // Check messages
    session.messages.forEach((msg, mIdx) => {
      // 1. Detect images attached directly in message
      if (msg.images && msg.images.length > 0) {
        msg.images.forEach((img, idx) => {
          const imgId = `img_${msg.id}_${idx}`;
          const normalizedUrl = (img.url || '').trim().toLowerCase();
          if (!seenIds.has(imgId) && (!normalizedUrl || !seenUrls.has(normalizedUrl)) && !deletedIds.has(imgId)) {
            seenIds.add(imgId);
            if (normalizedUrl) seenUrls.add(normalizedUrl);
            extracted.push({
              id: imgId,
              type: 'image',
              title: img.name || `Dandelious Bild: ${session.title || 'Kreation'}`,
              createdAt: msg.timestamp || session.updatedAt,
              authorName: msg.role === 'assistant' ? 'Dandelious AI' : 'Nutzer',
              url: img.url,
              tags: ['dandelious-vision', 'ai-generated']
            });
          }
        });
      }

      // 2. Detect internet images used in message content (markdown ![alt](url) or web images)
      if (msg.content) {
        const webImages = extractImagesFromContent(msg.content);
        webImages.forEach((wImg, wIdx) => {
          const imgId = `web_img_${msg.id}_${wIdx}`;
          const normalizedUrl = (wImg.url || '').trim().toLowerCase();
          if (!seenIds.has(imgId) && (!normalizedUrl || !seenUrls.has(normalizedUrl)) && !deletedIds.has(imgId)) {
            seenIds.add(imgId);
            if (normalizedUrl) seenUrls.add(normalizedUrl);
            extracted.push({
              id: imgId,
              type: 'image',
              title: wImg.title || `Internet-Bild: ${session.title || 'Recherche'}`,
              createdAt: msg.timestamp || session.updatedAt,
              authorName: msg.role === 'assistant' ? 'Dandelious Web' : 'Nutzer',
              url: wImg.url,
              tags: ['internet-image', 'web-image', 'dandelious-source']
            });
          }
        });
      }

      // 3. Detect code / documents / deep research in assistant messages
      if (msg.role === 'assistant') {
        const content = msg.content || '';
        const prevMsg = mIdx > 0 ? session.messages[mIdx - 1] : null;
        const isDocRequest = prevMsg?.content.includes('[Dokument]') || 
                             prevMsg?.content.toLowerCase().includes('dokument') || 
                             content.includes('```document') || 
                             content.includes('Projektdossier') ||
                             content.includes('Executive Summary');
        
        const isDeepResearchMsg = isDeepResearchSession || 
                                  prevMsg?.content.includes('[Deep Research]') || 
                                  content.includes('[Deep Research]') ||
                                  content.includes('Deep Research Report') ||
                                  content.includes('Forschungsbericht:');

        // Check if the assistant message itself is a standalone document or deep research report
        if ((isDocRequest || isDeepResearchMsg) && content.length > 150) {
          const docId = `doc_full_${msg.id}`;
          if (!seenIds.has(docId)) {
            seenIds.add(docId);

            // Extract title
            let docTitle = isDeepResearchMsg ? `Deep Research: ${session.title}` : `Projektdossier: ${session.title}`;
            const firstH1 = content.match(/^#+\s*(.+)$/m);
            if (firstH1 && firstH1[1]) {
              docTitle = firstH1[1].replace(/[*_#]/g, '').trim();
            } else if (content.includes('Projektdossier:')) {
              const match = content.match(/Projektdossier:\s*([^\n]+)/);
              if (match && match[1]) docTitle = `Projektdossier: ${match[1].trim()}`;
            }

            extracted.push({
              id: docId,
              type: isDeepResearchMsg ? 'deep_research' : 'document',
              title: docTitle,
              createdAt: msg.timestamp || session.updatedAt,
              authorName: isDeepResearchMsg ? 'Dandelious Deep Research' : 'Dandelious',
              content: content,
              language: 'markdown',
              tags: isDeepResearchMsg ? ['deep-research', 'analysis'] : ['dandelious-document', 'dossier'],
              docMetadata: {
                docId: `PRJ-${new Date(msg.timestamp || Date.now()).getFullYear()}-${Math.random().toString(36).substring(2, 4).toUpperCase()}`,
                status: 'In Überprüfung',
                classification: 'Intern / Konzeptphase',
                lastUpdated: new Date(msg.timestamp || Date.now()).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })
              }
            });
          }
        }
        
        // Match code blocks ```typescript ... ``` or HTML or Markdown docs
        const codeBlockRegex = /```([a-zA-Z0-9_\-#+]*)\s*\n([\s\S]*?)```/g;
        let match: RegExpExecArray | null;
        let docIndex = 0;

        while ((match = codeBlockRegex.exec(content)) !== null) {
          const lang = match[1]?.trim() || 'text';
          const code = match[2]?.trim() || '';
          
          if (code.length > 40) { // Only meaningful docs/code
            docIndex++;
            const docId = `doc_${msg.id}_${docIndex}`;
            if (!seenIds.has(docId)) {
              seenIds.add(docId);
              
              let title = `${session.title || 'Dokument'} (${lang.toUpperCase() || 'Code'})`;
              if (code.toLowerCase().includes('system prompt') || content.toLowerCase().includes('system prompt')) {
                title = 'Context System Prompt';
              } else if (lang === 'html' || code.includes('<!DOCTYPE') || code.includes('<html')) {
                title = 'Context Ecosystem Website';
              } else if (code.length > 300) {
                const firstHeading = code.match(/^#+\s*(.+)$/m);
                if (firstHeading && firstHeading[1]) {
                  title = firstHeading[1].trim();
                }
              }

              extracted.push({
                id: docId,
                type: (lang === 'html' || lang === 'tsx' || lang === 'jsx' || lang === 'js' || lang === 'ts' || lang === 'python') ? 'code' : 'document',
                title: title,
                createdAt: msg.timestamp || session.updatedAt,
                authorName: 'Dandelious',
                content: code,
                language: lang,
                tags: ['dandelious-artifact', lang]
              });
            }
          }
        }
      }
    });
  });

  return extracted.filter(item => !deletedIds.has(item.id));
};
