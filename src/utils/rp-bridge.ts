export interface RpBridgeOptions {
  userName?: string;
  userRole?: string;
  roomCode?: string;
  vaultCredits?: number;
  sharedState?: Record<string, any>;
}

export function injectRpBridge(htmlContent: string, options: RpBridgeOptions = {}): string {
  const userName = options.userName || 'Spieler';
  const userRole = options.userRole || 'Mitglied';
  const roomCode = options.roomCode || 'ARC-001';
  const vaultCredits = options.vaultCredits !== undefined ? options.vaultCredits : 2500;
  const initialSharedState = options.sharedState ? JSON.stringify(options.sharedState) : '{}';

  // Perform dynamic variable tag substitutions
  let processedHtml = htmlContent
    .replace(/\{\{USER_NAME\}\}/g, userName)
    .replace(/\{\{USER_ROLE\}\}/g, userRole)
    .replace(/\{\{ROOM_CODE\}\}/g, roomCode)
    .replace(/\{\{VAULT_CREDITS\}\}/g, String(vaultCredits));

  // Bridge JS snippet to inject inside HTML modules
  const bridgeScript = `
<script>
(function() {
  window.__SAPHIRE_SHARED_STATE__ = ${initialSharedState};
  window.__VANGUARD_SHARED_STATE__ = window.__SAPHIRE_SHARED_STATE__;
  var stateListeners = [];

  var api = {
    userName: "${userName.replace(/"/g, '\\"')}",
    userRole: "${userRole.replace(/"/g, '\\"')}",
    roomCode: "${roomCode.replace(/"/g, '\\"')}",
    vaultCredits: ${vaultCredits},

    // 1. Send chat message from module
    postAction: function(text) {
      if (window.parent) {
        window.parent.postMessage({ type: 'RP_CHAT_ACTION', text: text }, '*');
      }
    },

    // 2. Multi-user shared state access
    getSharedState: function(key) {
      if (key !== undefined) {
        return window.__SAPHIRE_SHARED_STATE__[key];
      }
      return Object.assign({}, window.__SAPHIRE_SHARED_STATE__);
    },

    setSharedState: function(key, val) {
      window.__SAPHIRE_SHARED_STATE__[key] = val;
      if (window.parent) {
        window.parent.postMessage({ type: 'RP_STATE_UPDATE', key: key, value: val }, '*');
      }
    },

    updateSharedState: function(patchObj) {
      Object.assign(window.__SAPHIRE_SHARED_STATE__, patchObj);
      if (window.parent) {
        window.parent.postMessage({ type: 'RP_STATE_UPDATE_PATCH', patch: patchObj }, '*');
      }
    },

    onSharedStateChange: function(fn) {
      if (typeof fn === 'function') {
        stateListeners.push(fn);
      }
    },

    // 3. Send module state to Dandelious AI as system context
    sendStateToAi: function(moduleTitle, stateSummary) {
      if (window.parent) {
        window.parent.postMessage({ 
          type: 'RP_SEND_STATE_TO_AI', 
          moduleTitle: moduleTitle || 'RP Modul', 
          stateSummary: stateSummary || window.__SAPHIRE_SHARED_STATE__ 
        }, '*');
      }
    },

    // 4. Quick dice roll probe
    rollDice: function(expression) {
      if (window.parent) {
        window.parent.postMessage({ type: 'RP_ROLL_DICE', expression: expression || '1d20' }, '*');
      }
    }
  };

  window.saphireRp = api;
  window.vanguardRp = api;

  // Listen for sync events from parent window
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'RP_SHARED_STATE_SYNC') {
      window.__SAPHIRE_SHARED_STATE__ = Object.assign({}, e.data.state || {});
      window.__VANGUARD_SHARED_STATE__ = window.__SAPHIRE_SHARED_STATE__;
      stateListeners.forEach(function(listener) {
        try { listener(window.__SAPHIRE_SHARED_STATE__); } catch(err) { console.error(err); }
      });
    }
  });
})();
</script>
`;

  if (processedHtml.includes('</body>')) {
    return processedHtml.replace('</body>', `${bridgeScript}\n</body>`);
  }
  return processedHtml + bridgeScript;
}
