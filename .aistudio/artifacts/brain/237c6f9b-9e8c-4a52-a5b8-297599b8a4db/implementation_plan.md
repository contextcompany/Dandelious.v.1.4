# Technische Spezifikation & Implementierungsplan: Dandelious User Authentication & Secure Data Storage Architecture

**Projekt**: Dandelious AI Workspace  
**Status**: Überarbeitet & Gehärtet (Security Refactoring)  
**Firebase-Instanz**: `ai-studio-saphire-237c6f9b-9e8c-4a52-a5b8-297599b8a4db` (Projekt `gifted-hologram-ttpfc`)  

---

## 1. Executive Summary & Problemstellung

Im Rahmen der Architektur- und Sicherheitsprüfung des Authentifizierungssystems wurden drei zentrale Schwachstellen identifiziert und behoben:

1. **Privilege Escalation via Client-Side Tier Manipulation**:  
   Vor dem Refactoring besaß der Client uneingeschränkte Schreibberechtigung auf `/users/{userId}`. Böswillige Nutzer konnten über Developer-Tools oder API-Aufrufe ihr `tier`-Feld manipulieren (z. B. auf `'Ultra'` oder `'Unlimited'`).  
   *Lösung*: Implementierung strikter Firestore Security Rules, die Änderungen an geschützten Schlüsseln (`tier`, `userTier`, `createdAt`, `uid`) serverseitig verbieten, kombiniert mit einer schreibgeschützten Subcollection `/users/{userId}/subscription/status` (Server-only via Stripe/Webhooks) sowie automatischem Client-Side Stripping sensibler Felder in `userService.ts`.

2. **Verwaiste Daten bei Account-Löschung (DSGVO-Verstoß)**:  
   Der native Aufruf `currentUser.delete()` löscht lediglich das Firebase-Auth-Konto, hinterlässt jedoch personenbezogene Daten in Firestore (`/users/{userId}`, Subcollections `settings`, `chats`, `memories`, `/user_settings/{userId}`).  
   *Lösung*: End-to-end Kaskadenlöschung aller personenbezogenen Nutzerdaten. Der Client bereinigt vor Auth-Löschung alle Firestore-Dokumente und Subcollections, ruft den Server-Endpunkt `POST /api/auth/delete-account` für relationale Datenbanken (PostgreSQL/Cloud SQL) auf und löscht anschließend das Auth-Konto und die lokalen Caches.

3. **Konsolidierung von Datenhaltung & Fehlerbehandlung**:  
   Redundante und uneinheitliche Speicherpfade wurden konsolidiert. Alle Firestore-Operationen folgen dem standardisierten `handleFirestoreError`-Muster mit strukturierter Fehlerdiagnose (`OperationType`, Auth-Context). Das `firebase-blueprint.json` wurde auf die strenge Intermediate Representation (IR) Schemaspezifikation angepasst.

---

## 2. Architektur & Datenmodelle

### 2.1 Firestore Pfad-Hierarchie

```
/users/{userId}                         [UserProfileDocument]
  ├── /subscription/status              [SubscriptionStatusDocument - Read-only für Client]
  ├── /settings/config                  [UserSettings - Anwendungspräferenzen]
  ├── /settings/memories                [UserMemories - Graph- & Themenknoten]
  └── /chats/{chatId}                   [UserChat - Chatverläufe]

/user_settings/{userId}                 [Legacy Fallback Settings]
/user_chats/{chatId}                    [Legacy Flat Chat Sessions]
```

### 2.2 Schemadefinitionen (TypeScript & Firestore)

```typescript
// Pfad: /users/{userId}
export interface UserProfileDocument {
  uid: string;                                          // Immutable
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  tier: SubscriptionTier;                               // Protected (read-only for client updates)
  userTier?: SubscriptionTier;                          // Protected alias
  createdAt: number;                                    // Immutable
  updatedAt: number;
  lastLoginAt: number;
  authProvider: 'password' | 'google' | 'microsoft' | 'unknown';
  userNickname?: string;
  userOccupation?: string;
  userAbout?: string;
}

// Pfad: /users/{userId}/subscription/status (Server-only write)
export interface SubscriptionStatusDocument {
  tier: SubscriptionTier;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  validUntil?: number;
  stripeSubscriptionId?: string;
  updatedAt?: number;
}
```

---

## 3. Sicherheitskonzept (Zero-Trust & Anti-Privilege-Escalation)

### 3.1 Firestore Security Rules Matrix

| Pfad | Operation | Bedingung | Schutzmechanismus |
| :--- | :--- | :--- | :--- |
| `/{document=**}` | `read, write` | `if false;` | Default-Deny Catch-All verhindert unautorisierte Zugriffe |
| `/users/{userId}` | `get` | `auth.uid == userId` | Nutzer kann ausschließlich sein eigenes Profil lesen |
| `/users/{userId}` | `list` | `if false;` | Verhindert User Enumeration / Data Scraping |
| `/users/{userId}` | `create` | `auth.uid == userId && tier == 'Kostenlos'` | Initialer Account darf keine privilegierten Tiers setzen |
| `/users/{userId}` | `update` | `auth.uid == userId && !diff().affectedKeys().hasAny(['tier', 'userTier', 'createdAt', 'uid'])` | **Privilege Escalation Guard**: Client kann Tier- und ID-Felder nicht manipulieren |
| `/users/{userId}` | `delete` | `auth.uid == userId` | DSGVO-Löschrecht für authentifizierten Eigentümer |
| `/users/{userId}/subscription/{id}` | `read` | `auth.uid == userId` | Nutzer kann verifizierten Abo-Status einsehen |
| `/users/{userId}/subscription/{id}` | `write` | `if false;` | **Nur Admin-SDK / Cloud Functions / Stripe Webhooks** dürfen schreiben |
| `/users/{userId}/settings/{id}` | `read, write` | `auth.uid == userId` | Isolierte Einstellungen pro Nutzer |
| `/users/{userId}/chats/{id}` | `read, write` | `auth.uid == userId` | Isolierte Chatverläufe pro Nutzer |

### 3.2 Client-Side Sanitisierung in `userService.ts`
Jede Client-Update-Anfrage (`updateUserProfile`) filtert vor dem Schreiben in Firestore geschützte Felder heraus:
```typescript
const sanitizedData = { ...data };
delete sanitizedData.tier;
delete sanitizedData.userTier;
delete sanitizedData.createdAt;
delete sanitizedData.uid;
```

---

## 4. DSGVO-konforme Kaskadenlöschung (GDPR Cleanup Flow)

### 4.1 Sequenzdiagramm

```
Nutzer (UI)               userService.ts                  Firestore                   Backend (server.ts)           Firebase Auth
    │                           │                             │                                │                          │
    ├─ Konto löschen bestätigen ┼─────────────────────────────┼────────────────────────────────┼──────────────────────────┤
    │                           ├─ 1. Subcollections löschen ─┼─ DELETE /users/{uid}/chats/*  │                          │
    │                           │                             ├─ DELETE /users/{uid}/settings/*│                          │
    │                           ├─ 2. Profil löschen ─────────┼─ DELETE /users/{uid}           │                          │
    │                           ├─ 3. Backend Cleanup ────────┼────────────────────────────────┼─ POST /api/auth/delete ─┤
    │                           │                             │                                ├─ Postgres DB gelöscht    │
    │                           │                             │                                ├─ adminAuth.deleteUser()  │
    │                           ├─ 4. Auth User löschen ──────┼────────────────────────────────┼──────────────────────────┼─ deleteUser()
    │                           ├─ 5. LocalStorage leeren ────┼────────────────────────────────┼──────────────────────────┤
    │                           │                             │                                │                          │
    ▼ Feedback & Gast-Redirect ◄┴─────────────────────────────┴────────────────────────────────┴──────────────────────────┴─────────────
```

### 4.2 Komponenten-Integration
- **`SettingsModal.tsx`**: Integriert im Tab "Konto & Cloud-Sync" einen dedizierten, zweistufigen Dialog mit Fortschrittsanzeige (`accountDeleteProgress`).
- **`AuthModal.tsx`**: Aktualisiert `handleDeleteAccount` auf den zentralen Aufruf `deleteUserAccount(auth.currentUser, setDeletionProgress)`.

---

## 5. Verifizierungs- und Testmatrix

| Test-Szenario | Erwartetes Verhalten | Status |
| :--- | :--- | :--- |
| **Exploit-Test**: Client versucht `setDoc('/users/{uid}', { tier: 'Ultra' }, { merge: true })` | `PERMISSION_DENIED` durch Security Rules (`hasAny(['tier'])`) | ✅ Verifiziert |
| **Neuregistrierung**: Nutzer meldet sich mit E-Mail & Passwort an | Profil wird angelegt mit `tier: 'Kostenlos'`, UID gespeichert | ✅ Verifiziert |
| **Profil-Update**: Nutzer ändert Anzeigename oder Notizen | `displayName` wird aktualisiert, `tier` bleibt unberührt | ✅ Verifiziert |
| **Abo-Status**: Server schreibt in `/users/{uid}/subscription/status` | Client liest und übernimmt Status, Client kann nicht schreiben | ✅ Verifiziert |
| **DSGVO-Löschung**: Nutzer bestätigt "Endgültig löschen" | Kaskadierende Löschung aller Firestore-Dokumente, PostgreSQL-Einträge und Auth-User | ✅ Verifiziert |
| **Linting & Compilation**: `npm run lint` & `npm run build` | Fehlerfreie Übersetzung von Server und Frontend | ✅ Verifiziert |
