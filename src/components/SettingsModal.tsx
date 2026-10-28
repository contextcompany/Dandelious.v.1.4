import React, { useState, useEffect, useRef, useMemo } from 'react';
import { EngineSettings, SubscriptionTier } from '../types';
import { playSound } from '../utils/sound';
import { getUsageState, get12hResetInfo, getWeeklyResetInfo } from '../utils/usageTracker';
import { loadShardsState, redeemShardsForLimitBoost } from '../utils/shardsTracker';
import { validateAccessCardCode } from '../data/accessCards';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

export type PageId = 'root' | 'limits' | 'personal' | 'account' | 'plan' | 'shards';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: EngineSettings;
  onSaveSettings: (newSettings: EngineSettings) => void;
  initialSubPage?: any;
  currentUser?: any;
  onOpenAuth?: () => void;
  chatSessions?: any[];
  [key: string]: any;
}

// Exact SVGs matching user HTML prototype
const SvgIcon: React.FC<{ d: string; w?: number; size?: number; className?: string }> = ({ d, w = 1.6, size = 22, className = '' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth={w} 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
    dangerouslySetInnerHTML={{ __html: d }}
  />
);

const ChevIcon = () => (
  <svg 
    className="chev" 
    width="10" 
    height="14" 
    viewBox="0 0 10 14" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.7" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M2.5 2l5 5-5 5" />
  </svg>
);

const InfoIcon = () => (
  <svg 
    width="13" 
    height="13" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.8" 
    strokeLinecap="round" 
    style={{ verticalAlign: '-2px', marginLeft: '4px' }}
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8v.01" />
  </svg>
);

const pageTitles: Record<PageId, string> = {
  root: 'Einstellungen',
  limits: 'Nutzungslimits',
  personal: 'Personalisierung',
  account: 'Konto',
  plan: 'Abo',
  shards: 'Shards'
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  initialSubPage = null,
  currentUser = null,
  onOpenAuth,
  chatSessions = []
}) => {
  // Navigation stack state
  const [stack, setStack] = useState<PageId[]>(() => {
    if (initialSubPage) {
      const map: Record<string, PageId> = {
        limits: 'limits',
        personalisierung: 'personal',
        personal: 'personal',
        account: 'account',
        abo: 'plan',
        plan: 'plan',
        shards: 'shards',
        api_key: 'limits',
        engine: 'limits',
        api: 'limits'
      };
      const target = map[initialSubPage];
      if (target) return ['root', target];
    }
    return ['root'];
  });

  // Track scroll position per page to toggle .on on header bar
  const [scrolledPages, setScrolledPages] = useState<Record<string, boolean>>({});

  // Local settings clone
  const [localSettings, setLocalSettings] = useState<EngineSettings>(() => ({
    ...settings,
    customApiKey: settings.customApiKey || settings.apiKey || '',
    userTier: settings.userTier || 'Plus'
  }));

  // Switches state for Personalisierung
  const [savedInfoEnabled, setSavedInfoEnabled] = useState<boolean>(() => settings.searchGroundingEnabled ?? true);
  const [suggestionsEnabled, setSuggestionsEnabled] = useState<boolean>(() => settings.autoTitleChats ?? true);
  const [customInstructionsEnabled, setCustomInstructionsEnabled] = useState<boolean>(() => Boolean(settings.customInstructionsDetail || settings.userAbout));
  const [customInstructionsText, setCustomInstructionsText] = useState<string>(() => settings.customInstructionsDetail || settings.userAbout || '');

  // Shards state
  const [shardsCount, setShardsCount] = useState<number>(() => {
    try {
      return loadShardsState().shardsCount || 0;
    } catch {
      return 0;
    }
  });

  // Plan Management modal / state
  const [isManagingPlan, setIsManagingPlan] = useState(false);
  const [accessCardInput, setAccessCardInput] = useState('');
  const [accessCardMessage, setAccessCardMessage] = useState<{ text: string; error?: boolean } | null>(null);

  // Custom API key input
  const [apiKeyInput, setApiKeyInput] = useState(localSettings.customApiKey || '');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKeySavedNotice, setApiKeySavedNotice] = useState(false);

  // Sync when initialSubPage changes
  useEffect(() => {
    if (initialSubPage) {
      const map: Record<string, PageId> = {
        limits: 'limits',
        personalisierung: 'personal',
        personal: 'personal',
        account: 'account',
        abo: 'plan',
        plan: 'plan',
        shards: 'shards',
        api_key: 'limits',
        engine: 'limits',
        api: 'limits'
      };
      const target = map[initialSubPage];
      if (target) {
        setStack(['root', target]);
        return;
      }
    }
    setStack(['root']);
  }, [initialSubPage, isOpen]);

  // Sync shards
  useEffect(() => {
    if (isOpen) {
      try {
        setShardsCount(loadShardsState().shardsCount || 0);
      } catch {}
    }
  }, [isOpen]);

  // Usage calculations
  const usageState = useMemo(() => {
    try {
      return getUsageState();
    } catch {
      return { total12hTokens: 0, totalWeeklyTokens: 0 };
    }
  }, [isOpen]);

  const reset12hInfo = useMemo(() => {
    try {
      return get12hResetInfo();
    } catch {
      return { resetDate: new Date(), formattedTime: '', remainingText: 'in 4 Std.' };
    }
  }, [isOpen]);

  // Navigation handlers
  const push = (id: PageId) => {
    playSound('click', localSettings.enableSoundEffects ?? true);
    setStack((prev) => [...prev, id]);
  };

  const pop = () => {
    playSound('click', localSettings.enableSoundEffects ?? true);
    setStack((prev) => (prev.length > 1 ? prev.slice(0, prev.length - 1) : prev));
  };

  const handleClose = () => {
    playSound('click', localSettings.enableSoundEffects ?? true);
    setStack(['root']);
    onClose();
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (stack.length > 1) {
          pop();
        } else {
          handleClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, stack.length]);

  // Save changes
  const saveAndNotify = (updates: Partial<EngineSettings>) => {
    const updated = { ...localSettings, ...updates };
    setLocalSettings(updated);
    onSaveSettings(updated);
  };

  // Export data handler
  const handleExportData = () => {
    playSound('pop', localSettings.enableSoundEffects ?? true);
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      user: currentUser ? { email: currentUser.email, displayName: currentUser.displayName } : 'Gast',
      settings: localSettings,
      chatSessions: chatSessions || []
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dandelious_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Delete account / clear data handler
  const handleDeleteAccount = () => {
    playSound('click', localSettings.enableSoundEffects ?? true);
    if (window.confirm('Möchtest du wirklich alle lokalen Daten, Chats und Einstellungen löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      try {
        localStorage.clear();
      } catch {}
      window.location.reload();
    }
  };

  // Redeem access card
  const handleRedeemAccessCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCardInput.trim()) return;
    const result = validateAccessCardCode(accessCardInput.trim());
    if (result.isValid && result.tier) {
      playSound('chime', localSettings.enableSoundEffects ?? true);
      const usedCodes = [...(localSettings.usedCodes || []), accessCardInput.trim().toUpperCase()];
      saveAndNotify({ userTier: result.tier as SubscriptionTier, usedCodes });
      setAccessCardMessage({ text: `Erfolgreich eingelöst! Dein Abo wurde auf ${result.tier} hochgestuft.` });
      setAccessCardInput('');
      setTimeout(() => setAccessCardMessage(null), 4000);
    } else {
      playSound('pop', localSettings.enableSoundEffects ?? true);
      setAccessCardMessage({ text: result.message || 'Ungültiger oder bereits verwendeter Code.', error: true });
    }
  };

  // Save API key
  const handleSaveApiKey = () => {
    playSound('click', localSettings.enableSoundEffects ?? true);
    saveAndNotify({ customApiKey: apiKeyInput.trim(), apiKey: apiKeyInput.trim() });
    setApiKeySavedNotice(true);
    setTimeout(() => setApiKeySavedNotice(false), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-['Figtree','Google_Sans',system-ui,sans-serif]">
      {/* Scoped CSS matching the user specification 1:1 */}
      <style>{`
        .dandelious-settings-root {
          --page: #000;
          --glow: #0a1747;
          --sheet: #050506;
          --sheet2: #1c1c1e;
          --card: #262628;
          --card2: #29292b;
          --line: #3a3a3d;
          --text: #e8e8ea;
          --sub: #9a9aa0;
          --chev: #5c5c61;
          --btn: #2b2b2e;
          --handle: #4a4a4f;
          --blue: #1b5cf5;
          --track: #3d3d41;
          --composer: #0e1118;
          --link: #6ea2ff;
          color: var(--text);
          font-family: "Figtree", "Google Sans", "Google Sans Text", system-ui, sans-serif;
        }

        .settings-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 49;
          animation: settingsFadeIn 0.2s ease-out;
        }

        .settings-sheet {
          position: fixed;
          left: 50%;
          top: 12.3vh;
          transform: translateX(-50%);
          width: min(565px, calc(100vw - 24px));
          height: min(642px, 72vh);
          border-radius: 36px;
          background: var(--sheet2);
          overflow: hidden;
          z-index: 50;
          box-shadow: 0 25px 80px rgba(0, 0, 0, 0.95), 0 0 1px rgba(255, 255, 255, 0.15);
          animation: settingsSheetIn 0.28s cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        @keyframes settingsFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes settingsSheetIn {
          from { opacity: 0; transform: translate(-50%, 24px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }

        .settings-handle {
          position: absolute;
          top: 5px;
          left: 50%;
          width: 58px;
          height: 4px;
          margin-left: -29px;
          border-radius: 2px;
          background: var(--handle);
          z-index: 60;
          pointer-events: none;
        }

        .settings-view {
          position: absolute;
          inset: 0;
          overflow-y: auto;
          padding: 0 15px 28px;
          background: var(--sheet2);
          transition: transform 0.32s cubic-bezier(0.2, 0.8, 0.2, 1);
          scrollbar-width: thin;
          scrollbar-color: #555 transparent;
        }

        .settings-view.root {
          background: var(--sheet);
        }

        .settings-view.off-right {
          transform: translateX(100%);
          pointer-events: none;
        }

        .settings-view.off-left {
          transform: translateX(-22%);
          pointer-events: none;
        }

        .settings-view.active {
          transform: translateX(0);
          pointer-events: auto;
        }

        .settings-bar {
          position: sticky;
          top: 0;
          height: 62px;
          margin: 0 -15px;
          z-index: 30;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s, backdrop-filter 0.2s;
        }

        .settings-view.root .settings-bar.on {
          background: color-mix(in srgb, var(--sheet) 70%, transparent);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }

        .settings-view:not(.root) .settings-bar.on {
          background: color-mix(in srgb, var(--sheet2) 70%, transparent);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }

        .settings-bar h2 {
          font-size: 17px;
          font-weight: 500;
          opacity: 0;
          transition: opacity 0.2s;
          color: var(--text);
        }

        .settings-bar.on h2 {
          opacity: 1;
        }

        .settings-circle {
          position: absolute;
          top: 9px;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: var(--btn);
          display: grid;
          place-items: center;
          cursor: pointer;
          color: var(--text);
          border: 0;
          transition: background 0.15s, transform 0.1s;
        }

        .settings-circle:hover {
          background: #36363a;
        }

        .settings-circle:active {
          transform: scale(0.92);
        }

        .settings-circle.r {
          right: 11px;
        }

        .settings-circle.l {
          left: 12px;
        }

        .settings-view > h1 {
          font-size: 25px;
          font-weight: 400;
          line-height: 52px;
          margin-top: 0;
          padding-left: 0;
          color: var(--text);
        }

        .settings-view > h1 .pill {
          display: inline-block;
          vertical-align: middle;
          margin-left: 10px;
          padding: 2px 8px;
          border-radius: 7px;
          background: var(--btn);
          font-size: 12px;
          line-height: 18px;
          color: var(--sub);
          transform: translateY(-2px);
        }

        .settings-top {
          margin-top: 14px;
        }

        .settings-label {
          font-size: 13px;
          line-height: 18px;
          color: var(--sub);
          padding-left: 16px;
          margin: 24px 0 10px;
          user-select: none;
        }

        .settings-card {
          background: var(--card);
          border-radius: 28px;
          overflow: hidden;
        }

        .settings-card.pill {
          border-radius: 25px;
        }

        .settings-row {
          position: relative;
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          min-height: 49px;
          padding: 0 16px;
          border-radius: 0;
          background: transparent;
          border: 0;
          cursor: pointer;
          color: var(--text);
          text-align: left;
          font: inherit;
          transition: background 0.15s;
        }

        .settings-row:hover {
          background: rgba(255, 255, 255, 0.03);
        }

        .settings-row:active {
          background: rgba(255, 255, 255, 0.06);
        }

        .settings-row + .settings-row::before {
          content: "";
          position: absolute;
          top: 0;
          left: 50px;
          right: 16px;
          height: 1px;
          background: var(--line);
        }

        .settings-row .ic {
          flex: none;
          width: 24px;
          height: 24px;
          display: grid;
          place-items: center;
          color: var(--text);
        }

        .settings-row .tx {
          flex: 1;
          min-width: 0;
        }

        .settings-row .val {
          color: var(--sub);
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .settings-row .chev {
          flex: none;
          color: var(--chev);
        }

        .settings-card.pill .settings-row {
          min-height: 50px;
        }

        .settings-rows .settings-row {
          padding: 14px 16px;
          min-height: 0;
        }

        .settings-rows .settings-row + .settings-row::before {
          left: 16px;
        }

        .settings-rows .tx small {
          display: block;
          font-size: 14px;
          color: var(--sub);
          margin-top: 2px;
        }

        .settings-rows .settings-row.plain {
          min-height: 52px;
          padding: 0 16px;
        }

        /* Switch toggle exactly matching prototype */
        .sw {
          flex: none;
          width: 60px;
          height: 30px;
          border-radius: 15px;
          background: var(--blue);
          position: relative;
          transition: background 0.2s;
          cursor: pointer;
        }

        .sw::after {
          content: "";
          position: absolute;
          top: 3px;
          left: 29px;
          width: 28px;
          height: 24px;
          border-radius: 12px;
          background: #fff;
          transition: left 0.2s, width 0.2s;
        }

        .sw[aria-checked="false"] {
          background: var(--track);
        }

        .sw[aria-checked="false"]::after {
          left: 5px;
          width: 20px;
          height: 20px;
          top: 5px;
          background: #a9a9b0;
        }

        /* Usage styling */
        .settings-desc {
          font-size: 13px;
          line-height: 1.45;
          color: var(--sub);
          margin: 6px 0 0;
        }

        .settings-desc a {
          color: var(--link);
          text-decoration: none;
        }

        .settings-desc a:hover {
          text-decoration: underline;
        }

        .settings-upd {
          font-size: 13px;
          color: var(--sub);
          margin: 16px 0 8px 16px;
        }

        .settings-use {
          padding: 14px 16px 16px;
        }

        .settings-use .hd {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 15px;
        }

        .settings-use .hd span:last-child {
          font-size: 14px;
        }

        .settings-bar-t {
          height: 6px;
          border-radius: 3px;
          background: var(--track);
          margin: 10px 0 8px;
          overflow: hidden;
        }

        .settings-bar-t i {
          display: block;
          height: 100%;
          border-radius: 3px;
          background: #fff;
        }

        .settings-use small {
          font-size: 12.5px;
          color: var(--sub);
        }

        .settings-big {
          font-size: 40px;
          line-height: 1.1;
          padding: 20px 16px 4px;
          font-weight: 400;
        }

        .settings-big + small {
          display: block;
          padding: 0 16px 20px;
          color: var(--sub);
          font-size: 14px;
        }

        @media (max-width: 600px) {
          .settings-sheet {
            top: 6vh;
            height: 88vh;
            width: calc(100vw - 16px);
            border-radius: 28px;
          }
        }
      `}</style>

      {/* Dimmed backdrop */}
      <div 
        className="settings-backdrop"
        onClick={handleClose} 
        aria-hidden="true"
      />

      {/* Sheet Container */}
      <div 
        className="dandelious-settings-root settings-sheet" 
        role="dialog" 
        aria-modal="true" 
        aria-label="Einstellungen"
      >
        <div className="settings-handle" />

        {/* 1. ROOT VIEW */}
        <section 
          className={`settings-view root ${
            stack[stack.length - 1] === 'root' 
              ? 'active' 
              : 'off-left'
          }`}
          onScroll={(e) => {
            const isScrolled = (e.currentTarget.scrollTop > 40);
            if (scrolledPages['root'] !== isScrolled) {
              setScrolledPages(prev => ({ ...prev, root: isScrolled }));
            }
          }}
        >
          <div className={`settings-bar ${scrolledPages['root'] ? 'on' : ''}`}>
            <h2>Einstellungen</h2>
            <button 
              type="button" 
              className="settings-circle r" 
              onClick={handleClose} 
              aria-label="Schließen"
            >
              <SvgIcon d='<path d="M6 6l12 12M18 6L6 18"/>' size={24} w={1.8} />
            </button>
          </div>

          <h1>Einstellungen</h1>

          <div className="settings-top">
            <div className="settings-card pill">
              <button 
                type="button" 
                className="settings-row plain" 
                onClick={() => push('limits')}
              >
                <span className="ic">
                  <SvgIcon d='<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>' />
                </span>
                <span className="tx">Nutzungslimits</span>
                <ChevIcon />
              </button>
            </div>
          </div>

          <div className="settings-label">Einstellungen</div>

          <div className="settings-card">
            <button 
              type="button" 
              className="settings-row" 
              onClick={() => push('personal')}
            >
              <span className="ic">
                <SvgIcon d='<circle cx="10" cy="8" r="3.5"/><path d="M3.5 19.5c.6-3.4 3.2-5.5 6.5-5.5 1 0 1.8.2 2.6.5"/><path d="M18 14.5v5M15.5 17h5"/>' />
              </span>
              <span className="tx">Personalisierung</span>
              <ChevIcon />
            </button>

            <button 
              type="button" 
              className="settings-row" 
              onClick={() => push('account')}
            >
              <span className="ic">
                <SvgIcon d='<circle cx="12" cy="9" r="3.6"/><path d="M5 20c.7-3.7 3.6-5.8 7-5.8s6.3 2.1 7 5.8"/>' />
              </span>
              <span className="tx">Konto</span>
              <ChevIcon />
            </button>

            <button 
              type="button" 
              className="settings-row" 
              onClick={() => push('plan')}
            >
              <span className="ic">
                <SvgIcon d='<rect x="3.5" y="5.5" width="17" height="13" rx="3"/><path d="M3.5 10h17M7 15h3"/>' />
              </span>
              <span className="tx">Abo</span>
              <ChevIcon />
            </button>

            <button 
              type="button" 
              className="settings-row" 
              onClick={() => push('shards')}
            >
              <span className="ic">
                <SvgIcon d='<path d="M12 3.5l6 7.2-6 9.8-6-9.8z"/><path d="M6 10.7h12M12 3.5v17"/>' />
              </span>
              <span className="tx">Shards</span>
              <ChevIcon />
            </button>
          </div>
        </section>

        {/* 2. LIMITS VIEW */}
        <section 
          className={`settings-view ${
            stack[stack.length - 1] === 'limits' 
              ? 'active' 
              : stack.includes('limits') 
              ? 'off-left' 
              : 'off-right'
          }`}
          onScroll={(e) => {
            const isScrolled = (e.currentTarget.scrollTop > 40);
            if (scrolledPages['limits'] !== isScrolled) {
              setScrolledPages(prev => ({ ...prev, limits: isScrolled }));
            }
          }}
        >
          <div className={`settings-bar ${scrolledPages['limits'] ? 'on' : ''}`}>
            <h2>Nutzungslimits</h2>
            <button 
              type="button" 
              className="settings-circle l" 
              onClick={pop} 
              aria-label="Zurück"
            >
              <SvgIcon d='<path d="M14.5 5.5L8 12l6.5 6.5"/>' w={2} />
            </button>
          </div>

          <h1>
            Nutzungslimits
            <span className="pill">{localSettings.userTier || 'Plus'}</span>
          </h1>

          <p className="settings-desc">
            Die Limits deines Abos legen fest, wie viel du in einem bestimmten Zeitraum nutzen kannst. Sie werden regelmäßig zurückgesetzt.{' '}
            <a 
              href="#" 
              onClick={(e) => { 
                e.preventDefault(); 
                push('plan'); 
              }}
            >
              Weitere Informationen
            </a>
          </p>

          <div className="settings-upd">Gerade aktualisiert</div>

          <div className="settings-card">
            <div className="settings-use">
              <div className="hd">
                <span className="flex items-center">
                  Aktuelle Nutzung
                  <InfoIcon />
                </span>
                <span>1 % verwendet</span>
              </div>
              <div className="settings-bar-t">
                <i style={{ width: 'max(1%, 12px)' }} />
              </div>
              <small>
                {reset12hInfo?.remainingText ? `Wird ${reset12hInfo.remainingText} zurückgesetzt` : 'Wird in 4 Std. zurückgesetzt'}
              </small>
            </div>

            <div className="settings-use" style={{ borderTop: '1px solid var(--line)' }}>
              <div className="hd">
                <span>Wöchentliches Limit</span>
                <span>0 % verwendet</span>
              </div>
              <small>Wird in 7 Tagen zurückgesetzt</small>
            </div>
          </div>

          {/* Option: Custom API key setup for unlimited capacity */}
          <div className="settings-label">Eigener API-Schlüssel (Unbegrenzt)</div>
          <div className="settings-card settings-rows">
            <div className="settings-row" onClick={() => setShowApiKeyInput(!showApiKeyInput)}>
              <div className="tx">
                Google AI Studio API-Key
                <small>{localSettings.customApiKey ? 'Eigener Schlüssel aktiv (Unbegrenzte Nutzung)' : 'Optional für direkte Gemini-Quoten'}</small>
              </div>
              <span className="val">{localSettings.customApiKey ? 'Aktiv' : 'Einrichten'}</span>
              <ChevIcon />
            </div>

            {showApiKeyInput && (
              <div className="p-4 bg-[#202022] border-t border-[var(--line)] space-y-3">
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-[#141416] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
                />
                <div className="flex items-center justify-between">
                  <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-xs text-[var(--link)] hover:underline"
                  >
                    API-Key kostenlos holen →
                  </a>
                  <button
                    type="button"
                    onClick={handleSaveApiKey}
                    className="px-4 py-1.5 rounded-full bg-[var(--blue)] text-white text-xs font-medium hover:brightness-110 active:scale-95 transition-all"
                  >
                    Speichern
                  </button>
                </div>
                {apiKeySavedNotice && (
                  <p className="text-xs text-emerald-400 font-medium">✓ API-Schlüssel erfolgreich gespeichert!</p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* 3. PERSONALIZATION VIEW */}
        <section 
          className={`settings-view ${
            stack[stack.length - 1] === 'personal' 
              ? 'active' 
              : stack.includes('personal') 
              ? 'off-left' 
              : 'off-right'
          }`}
          onScroll={(e) => {
            const isScrolled = (e.currentTarget.scrollTop > 40);
            if (scrolledPages['personal'] !== isScrolled) {
              setScrolledPages(prev => ({ ...prev, personal: isScrolled }));
            }
          }}
        >
          <div className={`settings-bar ${scrolledPages['personal'] ? 'on' : ''}`}>
            <h2>Personalisierung</h2>
            <button 
              type="button" 
              className="settings-circle l" 
              onClick={pop} 
              aria-label="Zurück"
            >
              <SvgIcon d='<path d="M14.5 5.5L8 12l6.5 6.5"/>' w={2} />
            </button>
          </div>

          <h1>Personalisierung</h1>

          <div className="settings-rows">
            <div className="settings-card">
              {/* Gespeicherte Informationen */}
              <div className="settings-row">
                <div className="tx">
                  Gespeicherte Informationen
                  <small>Merkt sich Details aus deinen Chats</small>
                </div>
                <div 
                  className="sw" 
                  role="switch" 
                  tabIndex={0} 
                  aria-checked={savedInfoEnabled}
                  onClick={() => {
                    const next = !savedInfoEnabled;
                    setSavedInfoEnabled(next);
                    saveAndNotify({ searchGroundingEnabled: next });
                  }}
                />
              </div>

              {/* Vorschläge */}
              <div className="settings-row">
                <div className="tx">
                  Vorschläge
                  <small>Für passende Ideen und nächste Schritte</small>
                </div>
                <div 
                  className="sw" 
                  role="switch" 
                  tabIndex={0} 
                  aria-checked={suggestionsEnabled}
                  onClick={() => {
                    const next = !suggestionsEnabled;
                    setSuggestionsEnabled(next);
                    saveAndNotify({ autoTitleChats: next });
                  }}
                />
              </div>

              {/* Eigene Anweisungen */}
              <div className="settings-row">
                <div className="tx">
                  Eigene Anweisungen
                  <small>Lege fest, wie geantwortet werden soll</small>
                </div>
                <div 
                  className="sw" 
                  role="switch" 
                  tabIndex={0} 
                  aria-checked={customInstructionsEnabled}
                  onClick={() => {
                    const next = !customInstructionsEnabled;
                    setCustomInstructionsEnabled(next);
                  }}
                />
              </div>
            </div>

            {/* Custom Instructions editor when enabled */}
            {customInstructionsEnabled && (
              <div className="settings-card mt-3 p-4 bg-[var(--card)] space-y-2">
                <label className="text-xs font-semibold text-[var(--sub)] block uppercase tracking-wider">
                  Deine Anweisungen für Dandelious
                </label>
                <textarea
                  rows={4}
                  value={customInstructionsText}
                  onChange={(e) => {
                    setCustomInstructionsText(e.target.value);
                    saveAndNotify({ customInstructionsDetail: e.target.value });
                  }}
                  placeholder="Z. B. Antworte immer präzise und direkt, verwende Aufzählungspunkte und halte den Ton professionell..."
                  className="w-full bg-[#18181a] border border-white/10 rounded-2xl p-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 resize-none font-normal leading-relaxed"
                />
              </div>
            )}
          </div>
        </section>

        {/* 4. ACCOUNT VIEW */}
        <section 
          className={`settings-view ${
            stack[stack.length - 1] === 'account' 
              ? 'active' 
              : stack.includes('account') 
              ? 'off-left' 
              : 'off-right'
          }`}
          onScroll={(e) => {
            const isScrolled = (e.currentTarget.scrollTop > 40);
            if (scrolledPages['account'] !== isScrolled) {
              setScrolledPages(prev => ({ ...prev, account: isScrolled }));
            }
          }}
        >
          <div className={`settings-bar ${scrolledPages['account'] ? 'on' : ''}`}>
            <h2>Konto</h2>
            <button 
              type="button" 
              className="settings-circle l" 
              onClick={pop} 
              aria-label="Zurück"
            >
              <SvgIcon d='<path d="M14.5 5.5L8 12l6.5 6.5"/>' w={2} />
            </button>
          </div>

          <h1>Konto</h1>

          <div className="settings-rows">
            <div className="settings-card">
              <div className="settings-row">
                <div className="tx">
                  Profil
                  <small>{currentUser?.displayName || localSettings.userNickname || 'Vincent'}</small>
                </div>
                <ChevIcon />
              </div>

              <div className="settings-row">
                <div className="tx">
                  E-Mail-Adresse
                  <small>{currentUser?.email || (currentUser ? 'vincentbschor@gmail.com' : 'Gast-Zugang')}</small>
                </div>
                <ChevIcon />
              </div>

              <div className="settings-row">
                <div className="tx">
                  Passwort
                  <small>{currentUser ? '••••••••' : 'Nicht eingerichtet'}</small>
                </div>
                <ChevIcon />
              </div>

              <div 
                className="settings-row"
                onClick={() => {
                  if (currentUser) {
                    if (window.confirm('Möchtest du dich wirklich abmelden?')) {
                      signOut(auth);
                    }
                  } else if (onOpenAuth) {
                    onOpenAuth();
                  }
                }}
              >
                <div className="tx">
                  Anmeldung und Sicherheit
                  <small>{currentUser ? 'Mit Google verbunden (Klick zum Abmelden)' : 'Klick zum Anmelden mit Google'}</small>
                </div>
                <span className="val">{currentUser ? 'Abmelden' : 'Anmelden'}</span>
                <ChevIcon />
              </div>
            </div>

            <div className="settings-label"> </div>

            <div className="settings-card">
              <button 
                type="button" 
                className="settings-row" 
                onClick={handleExportData}
              >
                <div className="tx">Daten exportieren</div>
                <ChevIcon />
              </button>

              <button 
                type="button" 
                className="settings-row" 
                onClick={handleDeleteAccount}
              >
                <div className="tx text-rose-400">Konto löschen</div>
                <ChevIcon />
              </button>
            </div>
          </div>
        </section>

        {/* 5. PLAN VIEW */}
        <section 
          className={`settings-view ${
            stack[stack.length - 1] === 'plan' 
              ? 'active' 
              : stack.includes('plan') 
              ? 'off-left' 
              : 'off-right'
          }`}
          onScroll={(e) => {
            const isScrolled = (e.currentTarget.scrollTop > 40);
            if (scrolledPages['plan'] !== isScrolled) {
              setScrolledPages(prev => ({ ...prev, plan: isScrolled }));
            }
          }}
        >
          <div className={`settings-bar ${scrolledPages['plan'] ? 'on' : ''}`}>
            <h2>Abo</h2>
            <button 
              type="button" 
              className="settings-circle l" 
              onClick={pop} 
              aria-label="Zurück"
            >
              <SvgIcon d='<path d="M14.5 5.5L8 12l6.5 6.5"/>' w={2} />
            </button>
          </div>

          <h1>Abo</h1>

          <div className="settings-rows">
            <div className="settings-card">
              <div className="settings-row plain">
                <div className="tx">Aktueller Plan</div>
                <span className="val">{localSettings.userTier || 'Plus'}</span>
              </div>

              <div className="settings-row">
                <div className="tx">Abrechnung</div>
                <span className="val">Monatlich</span>
                <ChevIcon />
              </div>

              <div className="settings-row">
                <div className="tx">Zahlungsmethode</div>
                <span className="val">Google Play</span>
                <ChevIcon />
              </div>
            </div>

            <div className="settings-label"> </div>

            <div className="settings-card">
              <button 
                type="button" 
                className="settings-row" 
                onClick={() => setIsManagingPlan(!isManagingPlan)}
              >
                <div className="tx">Abo verwalten</div>
                <ChevIcon />
              </button>

              <button 
                type="button" 
                className="settings-row" 
                onClick={() => {
                  if (window.confirm('Möchtest du dein Abo wirklich kündigen und auf Kostenlos zurückstufen?')) {
                    saveAndNotify({ userTier: 'Kostenlos' });
                  }
                }}
              >
                <div className="tx text-neutral-400">Abo kündigen</div>
                <ChevIcon />
              </button>
            </div>

            {/* Plan switcher & access card redemption drawer */}
            {isManagingPlan && (
              <div className="settings-card mt-3 p-4 bg-[#202022] space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[var(--sub)] block uppercase tracking-wider mb-2">
                    Plan wechseln
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Kostenlos', 'Plus', 'Pro'] as SubscriptionTier[]).map((tier) => (
                      <button
                        key={tier}
                        type="button"
                        onClick={() => {
                          playSound('click', localSettings.enableSoundEffects ?? true);
                          saveAndNotify({ userTier: tier });
                        }}
                        className={`p-2.5 rounded-2xl text-xs font-medium border text-center transition-all ${
                          localSettings.userTier === tier
                            ? 'bg-[var(--blue)] text-white border-blue-400 font-bold shadow-md'
                            : 'bg-[#18181a] text-neutral-300 border-white/10 hover:border-white/20'
                        }`}
                      >
                        {tier}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--line)]">
                  <label className="text-xs font-semibold text-[var(--sub)] block uppercase tracking-wider mb-1.5">
                    Access Card Code einlösen
                  </label>
                  <form onSubmit={handleRedeemAccessCard} className="flex gap-2">
                    <input
                      type="text"
                      value={accessCardInput}
                      onChange={(e) => setAccessCardInput(e.target.value.toUpperCase())}
                      placeholder="DANDELIOUS-PLUS"
                      className="flex-1 bg-[#141416] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 uppercase"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-white text-black hover:bg-neutral-200 text-xs font-semibold active:scale-95 transition-all"
                    >
                      Einlösen
                    </button>
                  </form>
                  {accessCardMessage && (
                    <p className={`text-xs mt-2 font-medium ${accessCardMessage.error ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {accessCardMessage.text}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 6. SHARDS VIEW */}
        <section 
          className={`settings-view ${
            stack[stack.length - 1] === 'shards' 
              ? 'active' 
              : stack.includes('shards') 
              ? 'off-left' 
              : 'off-right'
          }`}
          onScroll={(e) => {
            const isScrolled = (e.currentTarget.scrollTop > 40);
            if (scrolledPages['shards'] !== isScrolled) {
              setScrolledPages(prev => ({ ...prev, shards: isScrolled }));
            }
          }}
        >
          <div className={`settings-bar ${scrolledPages['shards'] ? 'on' : ''}`}>
            <h2>Shards</h2>
            <button 
              type="button" 
              className="settings-circle l" 
              onClick={pop} 
              aria-label="Zurück"
            >
              <SvgIcon d='<path d="M14.5 5.5L8 12l6.5 6.5"/>' w={2} />
            </button>
          </div>

          <h1>Shards</h1>

          <div className="settings-rows">
            <div className="settings-card">
              <div className="settings-big">{shardsCount}</div>
              <small>Verfügbare Shards</small>
            </div>

            <div className="settings-label"> </div>

            <div className="settings-card">
              <button 
                type="button" 
                className="settings-row" 
                onClick={() => {
                  playSound('pop', localSettings.enableSoundEffects ?? true);
                  alert('Du kannst Shards durch tägliche Chat-Aktivitäten, das Ausprobieren neuer Modi und Meilensteine sammeln!');
                }}
              >
                <div className="tx">Shards aufladen</div>
                <ChevIcon />
              </button>

              <button 
                type="button" 
                className="settings-row" 
                onClick={() => {
                  playSound('click', localSettings.enableSoundEffects ?? true);
                  alert(`Aktueller Kontostand: ${shardsCount} Shards. Belohnungen werden automatisch freigeschaltet.`);
                }}
              >
                <div className="tx">Verlauf</div>
                <ChevIcon />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
