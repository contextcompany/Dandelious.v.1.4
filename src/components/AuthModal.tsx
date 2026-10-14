import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Mail, 
  Lock, 
  User as UserIcon, 
  ShieldCheck, 
  LogOut, 
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  Check,
  Copy,
  Edit2,
  Send,
  Database
} from 'lucide-react';
import { 
  auth, 
  googleProvider, 
  microsoftProvider,
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  deleteUser,
  signOut, 
  updateProfile,
  User 
} from '../lib/firebase';
import { 
  createOrUpdateUserProfile, 
  getUserProfile, 
  updateUserProfile, 
  deleteUserAccount,
  UserProfileDocument 
} from '../services/userService';
import { playSound } from '../utils/sound';
import { DotMatrixWaveLoader } from './DotMatrixWaveLoader';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  enableSound?: boolean;
  initialMode?: 'signin' | 'signup' | 'reset';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  enableSound = true,
  initialMode = 'signin'
}) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Profile state for logged-in user
  const [userProfile, setUserProfile] = useState<UserProfileDocument | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const [copiedUid, setCopiedUid] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletionProgress, setDeletionProgress] = useState<string | null>(null);

  // Sync mode with initialMode prop when opening
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
      setErrorType(null);
      setSuccessMsg(null);
    }
  }, [isOpen, initialMode]);

  // Load Firestore profile if user is logged in
  useEffect(() => {
    if (currentUser) {
      getUserProfile(currentUser.uid).then(profile => {
        if (profile) {
          setUserProfile(profile);
          setEditNameValue(profile.displayName || currentUser.displayName || '');
        } else {
          // If profile doc not yet created, create it now
          createOrUpdateUserProfile(currentUser).then(p => {
            setUserProfile(p);
            setEditNameValue(p.displayName || currentUser.displayName || '');
          });
        }
      });
    } else {
      setUserProfile(null);
    }
  }, [currentUser]);

  if (!isOpen) return null;

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'Zu kurz', color: 'bg-neutral-600' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: 'Schwach', color: 'bg-rose-500' };
    if (score <= 3) return { score: 2, label: 'Mittel', color: 'bg-amber-400' };
    return { score: 3, label: 'Stark', color: 'bg-[#cfe45a]' };
  };

  const passwordStrength = getPasswordStrength(password);

  const translateFirebaseError = (err: any): { message: string; type?: string } => {
    const code = err?.code || '';
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
        return { message: 'Die E-Mail-Adresse oder das Passwort ist nicht korrekt.' };
      case 'auth/user-not-found':
        return { message: 'Zu dieser E-Mail-Adresse wurde kein Konto gefunden.' };
      case 'auth/email-already-in-use':
        return { 
          message: 'Diese E-Mail-Adresse ist bereits registriert. Bitte melde dich an oder setze dein Passwort zurück.',
          type: 'email_exists'
        };
      case 'auth/weak-password':
        return { message: 'Das Passwort ist zu schwach. Verwende mindestens 6 Zeichen.' };
      case 'auth/invalid-email':
        return { message: 'Bitte gib eine gültige E-Mail-Adresse ein.' };
      case 'auth/too-many-requests':
        return { message: 'Zu viele fehlerhafte Anmeldeversuche. Bitte warte einen Augenblick.' };
      case 'auth/network-request-failed':
        return { message: 'Netzwerkfehler: Bitte überprüfe deine Internetverbindung.' };
      case 'auth/popup-blocked':
        return { message: 'Das Anmeldefenster wurde vom Browser blockiert. Bitte Pop-ups erlauben.' };
      default:
        return { message: err?.message || 'Ein Authentifizierungsfehler ist aufgetreten.' };
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setErrorType(null);
    setLoading(true);
    playSound('click', enableSound);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        // Securely ensure user doc exists in Firestore
        await createOrUpdateUserProfile(result.user, {
          displayName: result.user.displayName || 'Google-Nutzer',
          photoURL: result.user.photoURL || null
        });
      }
      setSuccessMsg('Erfolgreich mit Google angemeldet!');
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1000);
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        return;
      }
      const { message, type } = translateFirebaseError(err);
      setError(message);
      if (type) setErrorType(type);
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoftSignIn = async () => {
    setError(null);
    setErrorType(null);
    setLoading(true);
    playSound('click', enableSound);
    try {
      const result = await signInWithPopup(auth, microsoftProvider);
      if (result.user) {
        await createOrUpdateUserProfile(result.user, {
          displayName: result.user.displayName || 'Microsoft-Nutzer',
          photoURL: result.user.photoURL || null
        });
      }
      setSuccessMsg('Erfolgreich mit Microsoft angemeldet!');
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1000);
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        return;
      }
      const { message, type } = translateFirebaseError(err);
      setError(message);
      if (type) setErrorType(type);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Bitte gib deine E-Mail-Adresse ein.');
      return;
    }

    setError(null);
    setErrorType(null);
    setLoading(true);
    playSound('click', enableSound);

    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      setSuccessMsg(`Ein sicherer Link zum Zurücksetzen deines Passworts wurde an ${cleanEmail} gesendet. Prüfe auch deinen Spam-Ordner.`);
    } catch (err: any) {
      console.error('Password reset error:', err);
      const { message } = translateFirebaseError(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrorType(null);
    playSound('click', enableSound);

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError('Bitte eine gültige E-Mail-Adresse eingeben.');
      return;
    }

    if (!password) {
      setError('Bitte dein Passwort eingeben.');
      return;
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        setError('Das Passwort muss mindestens 6 Zeichen lang sein.');
        return;
      }
      if (confirmPassword && password !== confirmPassword) {
        setError('Die Passwörter stimmen nicht überein.');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        // Create user in Firebase Auth
        const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        const nameToUse = displayName.trim() || 'Dandelious-Nutzer';
        
        if (credential.user) {
          await updateProfile(credential.user, { displayName: nameToUse });
          
          // Securely store initial user profile in Cloud Firestore `/users/{uid}`
          await createOrUpdateUserProfile(credential.user, {
            displayName: nameToUse,
            email: cleanEmail,
            tier: 'Kostenlos'
          });
        }
        
        setSuccessMsg('Konto erfolgreich erstellt & Daten sicher in der Cloud gespeichert!');
      } else {
        // Sign in with Firebase Auth
        const credential = await signInWithEmailAndPassword(auth, cleanEmail, password);
        
        if (credential.user) {
          // Sync login timestamp and profile doc in Firestore
          await createOrUpdateUserProfile(credential.user);
        }
        
        setSuccessMsg('Erfolgreich angemeldet!');
      }

      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Auth error:', err);
      const { message, type } = translateFirebaseError(err);
      setError(message);
      if (type) setErrorType(type);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    playSound('click', enableSound);
    try {
      await signOut(auth);
      setSuccessMsg('Erfolgreich abgemeldet.');
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 800);
    } catch (err: any) {
      setError('Fehler beim Abmelden.');
    }
  };

  const handleSaveName = async () => {
    if (!currentUser || !editNameValue.trim()) return;
    playSound('click', enableSound);
    try {
      await updateProfile(currentUser, { displayName: editNameValue.trim() });
      await updateUserProfile(currentUser.uid, { displayName: editNameValue.trim() });
      setUserProfile(prev => prev ? { ...prev, displayName: editNameValue.trim() } : null);
      setIsEditingName(false);
      setSuccessMsg('Name erfolgreich aktualisiert!');
      setTimeout(() => setSuccessMsg(null), 2500);
    } catch (err) {
      setError('Fehler beim Speichern des Namens.');
    }
  };

  const handleSendResetEmailToLoggedInUser = async () => {
    if (!currentUser?.email) return;
    playSound('click', enableSound);
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, currentUser.email);
      setSuccessMsg(`Passwort-Reset-Link an ${currentUser.email} versendet!`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      const { message } = translateFirebaseError(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!auth.currentUser) return;
    playSound('pop', enableSound);
    setLoading(true);
    setError(null);
    setDeletionProgress('Initialisiere Kaskadenlöschung...');
    try {
      await deleteUserAccount(auth.currentUser, (step) => {
        setDeletionProgress(step);
      });
      setSuccessMsg('Konto und alle personenbezogenen Cloud-Daten wurden DSGVO-konform gelöscht.');
      setShowDeleteConfirm(false);
      setDeletionProgress(null);
      setTimeout(() => {
        setSuccessMsg(null);
        setMode('signup');
      }, 2500);
    } catch (err: any) {
      console.error('Delete account error:', err);
      setDeletionProgress(null);
      if (err.code === 'auth/requires-recent-login') {
        setError('Sicherheits-Hinweis: Bitte melde dich kurz erneut an und klicke dann erneut auf "Konto löschen".');
      } else {
        setError(err.message || 'Fehler beim Löschen des Kontos.');
      }
    } finally {
      setLoading(false);
    }
  };

  const copyUidToClipboard = () => {
    if (currentUser?.uid) {
      navigator.clipboard.writeText(currentUser.uid);
      setCopiedUid(true);
      playSound('click', enableSound);
      setTimeout(() => setCopiedUid(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 14 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-[480px] bg-[#161d14] border border-[#2b3627] rounded-[28px] sm:rounded-[32px] p-6 sm:p-7 shadow-[0_25px_80px_rgba(0,0,0,0.95)] overflow-hidden text-[#eef2e4]"
        >
          {/* Subtle Accent Glow */}
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-[#cfe45a]/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-[#cfe45a]/5 rounded-full blur-[90px] pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={() => {
              playSound('click', enableSound);
              onClose();
            }}
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-[#1e271b] hover:bg-[#283424] border border-[#2b3627] flex items-center justify-center text-[#9aa58f] hover:text-[#eef2e4] transition-colors cursor-pointer"
            title="Schließen"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="flex items-center gap-3.5 mb-5 pr-10">
            <div className="w-11 h-11 rounded-2xl bg-[#1e271b] border border-[#2b3627] flex items-center justify-center shadow-inner shrink-0 text-[#cfe45a]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-['Bricolage_Grotesque'] text-[#eef2e4] tracking-tight">
                {currentUser 
                  ? 'Benutzerkonto' 
                  : mode === 'signin' 
                  ? 'Anmelden' 
                  : mode === 'signup' 
                  ? 'Konto erstellen' 
                  : 'Passwort zurücksetzen'}
              </h2>
              <p className="text-xs text-[#9aa58f] font-['DM_Sans'] mt-0.5">
                {currentUser 
                  ? 'Sicher authentifiziert über Firebase Cloud' 
                  : mode === 'reset'
                  ? 'Wir senden dir einen Link per E-Mail'
                  : 'Synchronisiere Chats & Shards geräteübergreifend'}
              </p>
            </div>
          </div>

          {/* Segmented Control Mode Switcher (if not logged in) */}
          {!currentUser && (
            <div className="grid grid-cols-3 gap-1 p-1 bg-[#0e130c] border border-[#2b3627] rounded-2xl mb-5 text-xs font-['DM_Sans']">
              <button
                type="button"
                onClick={() => {
                  playSound('click', enableSound);
                  setMode('signin');
                  setError(null);
                  setErrorType(null);
                }}
                className={`py-2 px-2 rounded-xl text-center font-medium transition-all cursor-pointer ${
                  mode === 'signin'
                    ? 'bg-[#1e271b] text-[#cfe45a] shadow-sm font-semibold border border-[#2b3627]'
                    : 'text-[#9aa58f] hover:text-[#eef2e4]'
                }`}
              >
                Anmelden
              </button>
              <button
                type="button"
                onClick={() => {
                  playSound('click', enableSound);
                  setMode('signup');
                  setError(null);
                  setErrorType(null);
                }}
                className={`py-2 px-2 rounded-xl text-center font-medium transition-all cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-[#1e271b] text-[#cfe45a] shadow-sm font-semibold border border-[#2b3627]'
                    : 'text-[#9aa58f] hover:text-[#eef2e4]'
                }`}
              >
                Registrieren
              </button>
              <button
                type="button"
                onClick={() => {
                  playSound('click', enableSound);
                  setMode('reset');
                  setError(null);
                  setErrorType(null);
                }}
                className={`py-2 px-2 rounded-xl text-center font-medium transition-all cursor-pointer truncate ${
                  mode === 'reset'
                    ? 'bg-[#1e271b] text-[#cfe45a] shadow-sm font-semibold border border-[#2b3627]'
                    : 'text-[#9aa58f] hover:text-[#eef2e4]'
                }`}
              >
                Passwort vergessen
              </button>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3.5 rounded-2xl bg-rose-950/40 border border-rose-600/30 text-rose-200 text-xs font-['DM_Sans'] space-y-2"
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>
              {errorType === 'email_exists' && (
                <div className="pt-2 border-t border-rose-500/20 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      playSound('click', enableSound);
                      setMode('signin');
                      setError(null);
                      setErrorType(null);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#cfe45a] text-[#1a2307] font-bold text-xs hover:bg-[#b9d047] transition-colors cursor-pointer"
                  >
                    Jetzt anmelden
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playSound('click', enableSound);
                      setMode('reset');
                      setError(null);
                      setErrorType(null);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#1e271b] text-[#eef2e4] font-medium text-xs border border-[#2b3627] hover:bg-[#283424] transition-colors cursor-pointer"
                  >
                    Passwort zurücksetzen
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-xs font-['DM_Sans'] flex items-start gap-2.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="leading-snug">{successMsg}</span>
            </motion.div>
          )}

          {/* Content Area */}
          {currentUser ? (
            /* Logged In User View */
            <div className="space-y-4 font-['DM_Sans']">
              {/* User Identity Card */}
              <div className="p-4 rounded-2xl bg-[#1e271b] border border-[#2b3627] space-y-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-13 h-13 rounded-full bg-[#2b3627] border border-[#cfe45a]/40 flex items-center justify-center font-bold text-[#cfe45a] text-lg shrink-0 overflow-hidden">
                    {currentUser.photoURL ? (
                      <img src={currentUser.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      (currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    {isEditingName ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={editNameValue}
                          onChange={(e) => setEditNameValue(e.target.value)}
                          className="h-8 px-2.5 rounded-xl bg-[#0e130c] border border-[#2b3627] text-xs text-[#eef2e4] focus:outline-none focus:border-[#cfe45a] w-full"
                          placeholder="Dein Anzeigename"
                        />
                        <button
                          type="button"
                          onClick={handleSaveName}
                          className="px-2.5 h-8 rounded-xl bg-[#cfe45a] text-[#1a2307] font-bold text-xs hover:bg-[#b9d047] cursor-pointer"
                        >
                          OK
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-[#eef2e4] truncate">
                          {userProfile?.displayName || currentUser.displayName || 'Dandelious-Nutzer'}
                        </h3>
                        <button
                          type="button"
                          onClick={() => setIsEditingName(true)}
                          className="text-[#9aa58f] hover:text-[#cfe45a] transition-colors p-1"
                          title="Name bearbeiten"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-[#9aa58f] truncate mt-0.5">{currentUser.email}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-[10.5px] px-2.5 py-0.5 rounded-full bg-[#cfe45a]/15 text-[#cfe45a] font-semibold border border-[#cfe45a]/30">
                        <Check className="w-3 h-3" />
                        {userProfile?.tier || 'Kostenlos'} Tier
                      </span>
                      <span className="text-[10px] text-[#9aa58f] px-2 py-0.5 rounded-full bg-[#0e130c] border border-[#2b3627]">
                        Auth: {userProfile?.authProvider || 'Firebase'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Firestore Database sync indicator */}
                <div className="pt-2.5 border-t border-[#2b3627] flex items-center justify-between text-xs text-[#9aa58f]">
                  <div className="flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-[#cfe45a]" />
                    <span>Firestore: <code className="text-[11px] text-[#eef2e4]">/users/{currentUser.uid.slice(0, 8)}...</code></span>
                  </div>
                  <button
                    type="button"
                    onClick={copyUidToClipboard}
                    className="flex items-center gap-1 text-[11px] text-[#9aa58f] hover:text-[#cfe45a] transition-colors cursor-pointer"
                  >
                    {copiedUid ? <Check className="w-3 h-3 text-[#cfe45a]" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedUid ? 'Kopiert' : 'UID kopieren'}</span>
                  </button>
                </div>
              </div>

              {/* Password Reset Action for Logged In User */}
              {currentUser.email && (
                <button
                  type="button"
                  onClick={handleSendResetEmailToLoggedInUser}
                  disabled={loading}
                  className="w-full py-2.5 px-3.5 rounded-2xl bg-[#1e271b] hover:bg-[#283424] border border-[#2b3627] text-xs text-[#eef2e4] flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-[#cfe45a]" />
                    <span>Passwort-Reset-Link an {currentUser.email} anfordern</span>
                  </div>
                  <Send className="w-3.5 h-3.5 text-[#9aa58f]" />
                </button>
              )}

              {/* Sign Out Button */}
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full py-3 px-4 rounded-2xl bg-[#1e271b] hover:bg-[#283424] text-[#eef2e4] border border-[#2b3627] text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-[#9aa58f]" />
                <span>Abmelden</span>
              </button>

              {/* Account Deletion */}
              <div className="pt-2">
                {!showDeleteConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full py-2 text-center text-[11.5px] text-rose-400/80 hover:text-rose-300 transition-colors cursor-pointer"
                  >
                    Konto & Firestore-Daten endgültig löschen
                  </button>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-600/30 text-center space-y-2.5">
                    <p className="text-xs text-rose-200">
                      Möchtest du dein Konto wirklich unwiderruflich löschen? Alle synchronisierten Einstellungen, Chatverläufe und Profildaten werden DSGVO-konform kaskadierend gelöscht.
                    </p>
                    {deletionProgress && (
                      <div className="text-[11px] text-amber-300 flex items-center justify-center gap-1.5 py-1">
                        <DotMatrixWaveLoader variant="mini" hideText={true} />
                        <span>{deletionProgress}</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleDeleteAccount}
                        disabled={loading}
                        className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {loading ? 'Wird gelöscht...' : 'Ja, DSGVO-konform löschen'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={loading}
                        className="px-3.5 py-2 rounded-xl bg-[#1e271b] text-[#9aa58f] hover:text-[#eef2e4] text-xs font-medium border border-[#2b3627] transition-colors cursor-pointer"
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : loading ? (
            <div className="py-10 flex flex-col items-center justify-center">
              <DotMatrixWaveLoader
                label={mode === 'signup' ? 'Erstelle sicheres Benutzerkonto...' : 'Authentifizierung läuft...'}
                sublabel="Sichere Firebase & Firestore Verbindung"
                variant="card"
              />
            </div>
          ) : mode === 'reset' ? (
            /* Reset Password Form */
            <form onSubmit={handleResetPassword} className="space-y-4 font-['DM_Sans']">
              <div>
                <label className="block text-xs font-medium text-[#9aa58f] mb-1.5 ml-1">
                  Registrierte E-Mail-Adresse
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 w-4 h-4 text-[#9aa58f]" />
                  <input
                    type="email"
                    required
                    placeholder="name@beispiel.de"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 bg-[#0e130c] border border-[#2b3627] rounded-2xl pl-11 pr-4 text-xs sm:text-sm text-[#eef2e4] placeholder-[#5f6856] focus:outline-none focus:border-[#cfe45a] transition-all"
                  />
                </div>
                <p className="text-[11px] text-[#9aa58f] mt-1.5 ml-1 leading-relaxed">
                  Wir senden dir einen autorisierten Link zur Vergabe eines neuen Passworts.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full h-12 rounded-2xl bg-[#cfe45a] hover:bg-[#b9d047] text-[#1a2307] text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-lg disabled:opacity-50 mt-2 active:scale-[0.98]"
              >
                Passwort-Link anfordern
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    playSound('click', enableSound);
                    setMode('signin');
                    setError(null);
                  }}
                  className="text-xs text-[#9aa58f] hover:text-[#cfe45a] transition-colors cursor-pointer"
                >
                  Zurück zur Anmeldung
                </button>
              </div>
            </form>
          ) : (
            /* Sign In or Sign Up Form */
            <div className="space-y-4 font-['DM_Sans']">
              {/* Social Login Buttons */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="h-11 px-3 rounded-2xl bg-[#1e271b] hover:bg-[#283424] border border-[#2b3627] text-[#eef2e4] text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  onClick={handleMicrosoftSignIn}
                  disabled={loading}
                  className="h-11 px-3 rounded-2xl bg-[#1e271b] hover:bg-[#283424] border border-[#2b3627] text-[#eef2e4] text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 23 23">
                    <path fill="#f35325" d="M1 1h10v10H1z"/>
                    <path fill="#81bc06" d="M12 1h10v10H1z"/>
                    <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                    <path fill="#ffba08" d="M12 12h10v10H12z"/>
                  </svg>
                  <span>Microsoft</span>
                </button>
              </div>

              <div className="relative flex items-center my-3">
                <div className="flex-grow border-t border-[#2b3627]"></div>
                <span className="shrink-0 px-3 text-[10.5px] uppercase font-semibold text-[#9aa58f] tracking-wider">
                  oder mit E-Mail
                </span>
                <div className="flex-grow border-t border-[#2b3627]"></div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs font-medium text-[#9aa58f] mb-1 ml-1">
                      Rufname / Anzeigename
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-3.5 w-4 h-4 text-[#9aa58f]" />
                      <input
                        type="text"
                        placeholder="Dein Vorname oder Nickname"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full h-11 bg-[#0e130c] border border-[#2b3627] rounded-2xl pl-11 pr-4 text-xs sm:text-sm text-[#eef2e4] placeholder-[#5f6856] focus:outline-none focus:border-[#cfe45a] transition-all"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-[#9aa58f] mb-1 ml-1">
                    E-Mail Adresse
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 w-4 h-4 text-[#9aa58f]" />
                    <input
                      type="email"
                      required
                      placeholder="name@beispiel.de"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-11 bg-[#0e130c] border border-[#2b3627] rounded-2xl pl-11 pr-4 text-xs sm:text-sm text-[#eef2e4] placeholder-[#5f6856] focus:outline-none focus:border-[#cfe45a] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1 ml-1 mr-1">
                    <label className="block text-xs font-medium text-[#9aa58f]">
                      Passwort
                    </label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => {
                          playSound('click', enableSound);
                          setMode('reset');
                          setError(null);
                        }}
                        className="text-[11px] text-[#9aa58f] hover:text-[#cfe45a] transition-colors cursor-pointer"
                      >
                        Passwort vergessen?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 w-4 h-4 text-[#9aa58f]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Mindestens 6 Zeichen"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-11 bg-[#0e130c] border border-[#2b3627] rounded-2xl pl-11 pr-11 text-xs sm:text-sm text-[#eef2e4] placeholder-[#5f6856] focus:outline-none focus:border-[#cfe45a] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-[#9aa58f] hover:text-[#eef2e4] transition-colors cursor-pointer"
                      title={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Strength Indicator during Signup */}
                  {mode === 'signup' && password.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-[#9aa58f]">
                        <span>Passwortstärke:</span>
                        <span className={`font-semibold ${
                          passwordStrength.score === 3 ? 'text-[#cfe45a]' :
                          passwordStrength.score === 2 ? 'text-amber-400' : 'text-rose-400'
                        }`}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 h-1.5 w-full">
                        <div className={`rounded-full transition-all ${passwordStrength.score >= 1 ? passwordStrength.color : 'bg-[#2b3627]'}`} />
                        <div className={`rounded-full transition-all ${passwordStrength.score >= 2 ? passwordStrength.color : 'bg-[#2b3627]'}`} />
                        <div className={`rounded-full transition-all ${passwordStrength.score >= 3 ? passwordStrength.color : 'bg-[#2b3627]'}`} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password during Signup */}
                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs font-medium text-[#9aa58f] mb-1 ml-1">
                      Passwort bestätigen
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-3.5 w-4 h-4 text-[#9aa58f]" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        placeholder="Passwort wiederholen"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`w-full h-11 bg-[#0e130c] border rounded-2xl pl-11 pr-11 text-xs sm:text-sm text-[#eef2e4] placeholder-[#5f6856] focus:outline-none transition-all ${
                          confirmPassword && confirmPassword !== password 
                            ? 'border-rose-500/60 focus:border-rose-400' 
                            : 'border-[#2b3627] focus:border-[#cfe45a]'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-3.5 text-[#9aa58f] hover:text-[#eef2e4] transition-colors cursor-pointer"
                        title={showConfirmPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {confirmPassword && confirmPassword !== password && (
                      <p className="text-[11px] text-rose-400 mt-1 ml-1">
                        Die Passwörter stimmen nicht überein.
                      </p>
                    )}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-2xl bg-[#cfe45a] hover:bg-[#b9d047] text-[#1a2307] font-['Bricolage_Grotesque'] font-bold text-sm transition-all cursor-pointer shadow-lg disabled:opacity-50 mt-4 active:scale-[0.98]"
                >
                  {loading 
                    ? 'Bitte warten...' 
                    : mode === 'signin' 
                    ? 'Anmelden' 
                    : 'Konto kostenlos registrieren'}
                </button>
              </form>

              {/* Mode Toggle Footer */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    playSound('click', enableSound);
                    setMode(mode === 'signin' ? 'signup' : 'signin');
                    setError(null);
                    setErrorType(null);
                  }}
                  className="text-xs text-[#9aa58f] hover:text-[#eef2e4] transition-colors cursor-pointer"
                >
                  {mode === 'signin' ? (
                    <span>Noch kein Konto? <strong className="text-[#cfe45a] font-semibold underline underline-offset-4">Jetzt kostenlos registrieren</strong></span>
                  ) : (
                    <span>Bereits registriert? <strong className="text-[#cfe45a] font-semibold underline underline-offset-4">Jetzt anmelden</strong></span>
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
