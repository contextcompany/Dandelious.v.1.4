import { RpModule } from '../types';

export const DEFAULT_RP_MODULES: RpModule[] = [
  {
    id: 'rp-shop-cyberpunk',
    title: 'Cyberpunk Shop & Inventar',
    symbol: 'S',
    iconName: 'shopping-bag',
    active: true,
    description: 'Interaktiver Shop & shared Inventar mit Echtzeit Credit-Guthaben.',
    htmlContent: `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body {
    background: #090a0f;
    color: #e2e8f0;
    font-family: system-ui, -apple-system, sans-serif;
    padding: 14px;
    margin: 0;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    padding-bottom: 10px;
    margin-bottom: 14px;
  }
  .title { margin: 0; font-size: 14px; font-weight: 800; color: #fff; }
  .user-badge { font-size: 10px; color: #ec4899; background: rgba(236,72,153,0.15); border: 1px solid rgba(236,72,153,0.3); padding: 2px 8px; border-radius: 12px; }
  .credits {
    background: rgba(245, 158, 11, 0.15);
    color: #fbbf24;
    border: 1px solid rgba(245, 158, 11, 0.3);
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: bold;
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .item-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px;
    padding: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.2s;
  }
  .item-card:hover {
    border-color: rgba(236, 72, 153, 0.4);
    background: rgba(255,255,255,0.06);
  }
  .item-name { font-weight: bold; font-size: 12px; color: #fff; }
  .item-desc { font-size: 10px; color: #94a3b8; margin-top: 2px; }
  .buy-btn {
    background: linear-gradient(135deg, #ec4899, #f43f5e);
    color: #fff;
    border: none;
    padding: 6px 12px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(236, 72, 153, 0.25);
  }
  .buy-btn:hover { opacity: 0.95; transform: translateY(-1px); }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h3 class="title">🛒 Cyberpunk Shop</h3>
      <span class="user-badge">{{USER_NAME}} ({{USER_ROLE}})</span>
    </div>
    <div class="credits">🪙 <span id="credVal">2500</span> CR</div>
  </div>

  <div class="grid">
    <div class="item-card">
      <div>
        <div class="item-name">⚡ Plasma Blaster MK-II</div>
        <div class="item-desc">High-Tech Energie-Waffe • 450 CR</div>
      </div>
      <button class="buy-btn" onclick="buyItem('Plasma Blaster MK-II', 450)">Kaufen</button>
    </div>
    <div class="item-card">
      <div>
        <div class="item-name">🛡️ Nano-Schild Modul</div>
        <div class="item-desc">+100 Schildenergie • 300 CR</div>
      </div>
      <button class="buy-btn" onclick="buyItem('Nano-Schild Modul', 300)">Kaufen</button>
    </div>
    <div class="item-card">
      <div>
        <div class="item-name">💉 Stim-Injektor X</div>
        <div class="item-desc">Starke Heilung • 150 CR</div>
      </div>
      <button class="buy-btn" onclick="buyItem('Stim-Injektor X', 150)">Kaufen</button>
    </div>
  </div>

  <script>
    var currentCredits = {{VAULT_CREDITS}};
    document.getElementById('credVal').innerText = currentCredits;

    // Connect to Dandelious Shared State
    if (window.saphireRp || window.vanguardRp) {
      const rp = window.saphireRp || window.vanguardRp;
      rp.onSharedStateChange(function(state) {
        if (state.vaultCredits !== undefined) {
          currentCredits = state.vaultCredits;
          document.getElementById('credVal').innerText = currentCredits;
        }
      });
    }

    function buyItem(itemName, price) {
      if (currentCredits >= price) {
        currentCredits -= price;
        document.getElementById('credVal').innerText = currentCredits;

        const rp = window.saphireRp || window.vanguardRp;
        if (rp) {
          rp.setSharedState('vaultCredits', currentCredits);
          rp.postAction('[Shop]: {{USER_NAME}} hat "' + itemName + '" für ' + price + ' CR erworben! Restguthaben: ' + currentCredits + ' CR.');
        }
      } else {
        alert('Nicht genügend Credits vorhanden!');
      }
    }
  </script>
</body>
</html>`
  },
  {
    id: 'rp-radar-scifi',
    title: 'Sci-Fi Taktik-Radar',
    symbol: 'M',
    iconName: 'map',
    active: true,
    description: 'Interaktives Taktik-Radar mit Zielkoordinaten und Zielverfolgung.',
    htmlContent: `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { background: #07090e; color: #38bdf8; font-family: monospace; padding: 14px; margin: 0; }
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
  .radar-box { border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 16px; height: 180px; position: relative; background: radial-gradient(circle, rgba(56,189,248,0.1) 0%, transparent 75%); display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .sweep { width: 100%; height: 100%; border-radius: 50%; position: absolute; background: conic-gradient(from 0deg, rgba(56,189,248,0.2), transparent 60deg); animation: rotateSweep 4s linear infinite; pointer-events: none; }
  @keyframes rotateSweep { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .ring { border: 1px dashed rgba(56, 189, 248, 0.3); border-radius: 50%; position: absolute; }
  .ring-1 { width: 130px; height: 130px; }
  .ring-2 { width: 70px; height: 70px; }
  .dot { width: 10px; height: 10px; border-radius: 50%; position: absolute; cursor: pointer; transform: translate(-50%, -50%); transition: all 0.2s; }
  .dot-player { background: #38bdf8; box-shadow: 0 0 10px #38bdf8; }
  .dot-target { background: #ef4444; box-shadow: 0 0 10px #ef4444; }
  .dot-loot { background: #10b981; box-shadow: 0 0 10px #10b981; }
  .scan-btn { background: rgba(56, 189, 248, 0.15); border: 1px solid #38bdf8; color: #fff; padding: 8px 12px; border-radius: 10px; font-size: 11px; font-family: sans-serif; font-weight: bold; cursor: pointer; margin-top: 10px; width: 100%; }
  .scan-btn:hover { background: rgba(56, 189, 248, 0.3); }
</style>
</head>
<body>
  <div class="header">
    <span style="font-weight:bold; color:#fff;">📡 RADAR SEKTOR [{{ROOM_CODE}}]</span>
    <span style="font-size:10px; color:#10b981;">● ONLINE</span>
  </div>
  <div class="radar-box">
    <div class="sweep"></div>
    <div class="ring ring-1"></div>
    <div class="ring ring-2"></div>
    <div class="dot dot-player" style="top:50%; left:50%;" title="{{USER_NAME}} (Zentrum)" onclick="pingLocation('Zentrum Basis')"></div>
    <div class="dot dot-target" style="top:25%; left:75%;" title="Feind-Signal X-9" onclick="pingLocation('Feindsignal Sektor 7 (Gefahr!)')"></div>
    <div class="dot dot-loot" style="top:70%; left:28%;" title="Vorratstruppe" onclick="pingLocation('Außenposten Vorrats-Depot')"></div>
  </div>
  <button class="scan-btn" onclick="sendRadarReport()">📡 Taktischen Radar-Report an Dandelious senden</button>

  <script>
    function pingLocation(targetName) {
      const rp = window.saphireRp || window.vanguardRp;
      if (rp) {
        rp.postAction('[Radar]: {{USER_NAME}} markiert Zielpunkt -> ' + targetName);
      }
    }
    function sendRadarReport() {
      const rp = window.saphireRp || window.vanguardRp;
      if (rp) {
        rp.postAction('[Taktik Scan]: Raum {{ROOM_CODE}} gescannt: 1x Basis, 1x Feindsignal Sektor 7, 1x Vorrats-Depot Delta.');
      }
    }
  </script>
</body>
</html>`
  },
  {
    id: 'rp-char-fantasy',
    title: 'Fantasy Charakterbogen & Mana',
    symbol: 'C',
    iconName: 'shield',
    active: true,
    description: 'Interaktiver Statusbogen mit HP/MP Slidern und Attributen.',
    htmlContent: `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { background: #0c0914; color: #f8fafc; font-family: system-ui, sans-serif; padding: 14px; margin: 0; }
  .title-bar { font-weight: 800; font-size: 14px; color: #c084fc; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; }
  .bar-label { font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between; margin-top: 8px; }
  .bar-bg { background: rgba(255,255,255,0.08); border-radius: 8px; height: 10px; overflow: hidden; margin-top: 4px; }
  .fill-hp { background: linear-gradient(90deg, #ef4444, #dc2626); height: 100%; width: 85%; transition: width 0.3s; }
  .fill-mp { background: linear-gradient(90deg, #3b82f6, #2563eb); height: 100%; width: 65%; transition: width 0.3s; }
  .controls { display: flex; gap: 6px; margin-top: 12px; }
  .btn-sm { flex: 1; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 6px; border-radius: 8px; font-size: 11px; font-weight: bold; cursor: pointer; }
  .btn-sm:hover { background: rgba(255,255,255,0.15); }
  .sync-btn { margin-top: 12px; width: 100%; background: linear-gradient(135deg, #a855f7, #9333ea); border: none; color: #fff; padding: 8px; border-radius: 10px; font-size: 11px; font-weight: bold; cursor: pointer; }
</style>
</head>
<body>
  <div class="title-bar">
    <span>⚔️ {{USER_NAME}}</span>
    <span style="font-size:10px; color:#a855f7; background:rgba(168,85,247,0.15); padding:2px 8px; border-radius:10px;">{{USER_ROLE}}</span>
  </div>

  <div class="bar-label"><span>Gesundheit (HP)</span><span id="hpTxt">85 / 100</span></div>
  <div class="bar-bg"><div id="hpBar" class="fill-hp"></div></div>

  <div class="bar-label"><span>Mana / Energie (MP)</span><span id="mpTxt">65 / 100</span></div>
  <div class="bar-bg"><div id="mpBar" class="fill-mp"></div></div>

  <div class="controls">
    <button class="btn-sm" onclick="adjustHp(-10)">💔 -10 HP</button>
    <button class="btn-sm" onclick="adjustHp(10)">💚 +10 HP</button>
    <button class="btn-sm" onclick="adjustMp(-15)">⚡ -15 MP</button>
  </div>

  <button class="sync-btn" onclick="sendStatsToChat()">⚔️ Status-Update in Chat posten</button>

  <script>
    var hp = 85;
    var mp = 65;

    function adjustHp(val) {
      hp = Math.max(0, Math.min(100, hp + val));
      document.getElementById('hpTxt').innerText = hp + ' / 100';
      document.getElementById('hpBar').style.width = hp + '%';
      syncState();
    }

    function adjustMp(val) {
      mp = Math.max(0, Math.min(100, mp + val));
      document.getElementById('mpTxt').innerText = mp + ' / 100';
      document.getElementById('mpBar').style.width = mp + '%';
      syncState();
    }

    function syncState() {
      const rp = window.saphireRp || window.vanguardRp;
      if (rp) {
        rp.updateSharedState({ playerHp: hp, playerMp: mp });
      }
    }

    function sendStatsToChat() {
      const rp = window.saphireRp || window.vanguardRp;
      if (rp) {
        rp.postAction('[Status {{USER_NAME}}]: HP ' + hp + '/100 | MP ' + mp + '/100.');
      }
    }
  </script>
</body>
</html>`
  },
  {
    id: 'rp-contract-bounty',
    title: 'Interaktiver Kopfgeld-Vertrag',
    symbol: 'V',
    iconName: 'file-text',
    active: true,
    description: 'Digitaler Kopfgeldvertrag mit Signatur und Belohnungsauszahlung.',
    htmlContent: `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { background: #0c0b08; color: #f1f5f9; font-family: system-ui, sans-serif; padding: 14px; margin: 0; }
  .card { background: rgba(255,255,255,0.03); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 16px; padding: 14px; }
  .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px; margin-bottom: 10px; }
  .title { color: #fbbf24; font-weight: 800; font-size: 13px; }
  .badge { background: rgba(245, 158, 11, 0.2); color: #fbbf24; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: bold; }
  .badge-signed { background: rgba(16, 185, 129, 0.2); color: #34d399; }
  .desc { font-size: 11px; color: #94a3b8; line-height: 1.5; }
  .sign-btn { background: linear-gradient(135deg, #f59e0b, #d97706); color: #000; font-weight: 800; border: none; padding: 8px 14px; border-radius: 10px; font-size: 11px; cursor: pointer; width: 100%; margin-top: 12px; }
</style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="title">📜 Belohnungsvertrag #904</div>
      <span id="stBadge" class="badge">OFFEN</span>
    </div>
    <div class="desc">
      <strong>Auftrag:</strong> Söldner-Anführer Vane. Ergreifung im Sektor 7.<br>
      <strong>Belohnung:</strong> 5.000 Credits<br>
      <strong>Auftraggeber:</strong> Dandelious Allianz
    </div>
    <button id="sBtn" class="sign-btn" onclick="signContract()">✒️ Vertrag als {{USER_NAME}} unterzeichnen</button>
  </div>

  <script>
    var isSigned = false;

    function signContract() {
      if (!isSigned) {
        isSigned = true;
        document.getElementById('stBadge').innerText = 'UNTERZEICHNET';
        document.getElementById('stBadge').className = 'badge badge-signed';
        document.getElementById('sBtn').innerText = '✅ Vertrag Aktiviert';
        document.getElementById('sBtn').style.opacity = '0.6';

        const rp = window.saphireRp || window.vanguardRp;
        if (rp) {
          rp.postAction('[Vertrag #904]: Erfolgreich unterzeichnet von {{USER_NAME}} ({{USER_ROLE}})! Belohnung freigeschaltet.');
          rp.setSharedState('contract_904_signed', true);
        }
      }
    }
  </script>
</body>
</html>`
  }
];
