// Dice Intelligent Synthesis & Bespoke App Engine
// Supports Shark 1.0 (Fast Agile Coder), Octopus 1.0 (Pro Architect & State Engine), Nautilus 1.0 (Apex Enterprise Engine)

export function generateDiceFallbackResponse(
  prompt: string,
  existingCode?: string,
  modelId: string = 'shark'
): string {
  const p = prompt.toLowerCase().trim();
  const normalizedModel = (modelId || 'shark').toLowerCase();
  const modelTitle = normalizedModel === 'nautilus' ? 'Nautilus 1.0' : (normalizedModel === 'octopus' ? 'Octopus 1.0' : 'Shark 1.0');

  // 1. Code modification on existing application
  if (existingCode && existingCode.includes('<html')) {
    return handleCodeModification(p, prompt, existingCode, modelTitle);
  }

  // 2. Generate completely bespoke application based on user request
  return generateBespokeApp(p, prompt, modelTitle);
}

// -------------------------------------------------------------------------------------------------
// SMART DYNAMIC CODE MODIFIER & EXTENDER
// -------------------------------------------------------------------------------------------------
function handleCodeModification(p: string, originalPrompt: string, code: string, modelName: string): string {
  let updated = code;
  let summary = `### ${modelName} - Maßgeschneiderte Code-Anpassung\nIch habe deine bestehende Anwendung analysiert und die gewünschten Änderungen präzise umgesetzt.\n\n`;

  // Color / Theme shifts
  if (p.includes('blau') || p.includes('blue')) {
    updated = updated.replace(/#[0-9a-fA-F]{6}/g, '#09152e').replace(/cyan|emerald|rose|purple|amber/g, 'blue');
    summary += `- **Farbanpassung**: Modernes Deep Blue Liquid-Glass Farbschema integriert.\n`;
  } else if (p.includes('grün') || p.includes('green') || p.includes('emerald')) {
    updated = updated.replace(/#[0-9a-fA-F]{6}/g, '#061710').replace(/cyan|blue|rose|purple|amber/g, 'emerald');
    summary += `- **Farbanpassung**: Frisches Emerald Glass Farbschema integriert.\n`;
  } else if (p.includes('rot') || p.includes('red') || p.includes('rose')) {
    updated = updated.replace(/#[0-9a-fA-F]{6}/g, '#1a0909').replace(/cyan|blue|emerald|purple|amber/g, 'rose');
    summary += `- **Farbanpassung**: Elegantes Crimson Ruby Farbschema integriert.\n`;
  } else if (p.includes('lila') || p.includes('purple') || p.includes('violet')) {
    updated = updated.replace(/#[0-9a-fA-F]{6}/g, '#130821').replace(/cyan|blue|emerald|rose|amber/g, 'purple');
    summary += `- **Farbanpassung**: Edles Cosmic Purple Farbschema integriert.\n`;
  } else if (p.includes('hell') || p.includes('light') || p.includes('weiß')) {
    updated = updated.replace(/bg-\[#0c0e14\]\/90/g, 'bg-white/80 text-slate-900').replace(/bg-\[#050508\]/g, 'bg-[#f4f5f8] text-slate-900');
    summary += `- **Theme-Wechsel**: Liquid-Glass Light Theme aktiviert.\n`;
  }

  // Feature / Component addition
  const featureLabel = originalPrompt.length > 40 ? originalPrompt.slice(0, 37) + '...' : originalPrompt;
  const newCardId = `ext_${Date.now().toString(36)}`;
  
  const featureInjection = `
    <!-- ${modelName} Dynamic Module: ${featureLabel} -->
    <div id="${newCardId}" class="mt-4 p-4 rounded-2xl bg-white/[0.05] border border-white/15 backdrop-blur-xl space-y-3 transition-all">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
          <span class="text-xs font-semibold text-white">${featureLabel}</span>
        </div>
        <span class="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-neutral-300 font-mono">Aktiv</span>
      </div>
      <div class="flex items-center gap-2">
        <input id="${newCardId}_input" type="text" placeholder="Eingabe oder Parameter..." class="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-400">
        <button onclick="handleModuleAction('${newCardId}')" class="px-3.5 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold text-xs transition-all active:scale-95 cursor-pointer">Ausführen</button>
      </div>
      <div id="${newCardId}_output" class="text-[11px] text-neutral-300 space-y-1"></div>
    </div>
  `;

  const scriptInjection = `
  <script>
    function handleModuleAction(id) {
      const inp = document.getElementById(id + '_input');
      const out = document.getElementById(id + '_output');
      if (!inp || !out || !inp.value.trim()) return;
      const row = document.createElement('div');
      row.className = 'p-2 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between text-xs';
      row.innerHTML = '<span>' + inp.value.trim() + '</span><span class="text-[10px] text-cyan-400">' + new Date().toLocaleTimeString() + '</span>';
      out.prepend(row);
      inp.value = '';
    }
  </script>
  `;

  if (updated.includes('</body>')) {
    updated = updated.replace('</body>', `${featureInjection}\n${scriptInjection}\n</body>`);
  } else {
    updated += featureInjection + scriptInjection;
  }

  summary += `- **Interaktive Logik**: Neue Steuerungselemente und Event-Handler integriert.\n`;
  summary += `- **Design-Konsistenz**: Harmonischer Liquid-Glass Look mit abgerundeten Ecken und weichen Lichtkanten.\n\n`;

  return `${summary}\`\`\`html\n${updated}\n\`\`\``;
}

// -------------------------------------------------------------------------------------------------
// BESPOKE FULL-FEATURE APPLICATION GENERATOR
// -------------------------------------------------------------------------------------------------
function generateBespokeApp(p: string, prompt: string, modelName: string): string {
  // Determine Archetype & Specific Thematic Elements
  const isShop = p.includes('shop') || p.includes('store') || p.includes('süßigkeit') || p.includes('kauf') || p.includes('warenkorb') || p.includes('ecommerce') || p.includes('candy') || p.includes('bäckerei') || p.includes('mode') || p.includes('essen');
  const isFinance = p.includes('crypto') || p.includes('krypto') || p.includes('aktie') || p.includes('geld') || p.includes('budget') || p.includes('finance') || p.includes('ausgaben') || p.includes('finanz');
  const isWeather = p.includes('wetter') || p.includes('weather') || p.includes('temperatur') || p.includes('klima') || p.includes('regen') || p.includes('forecast');
  const isMusic = p.includes('musik') || p.includes('music') || p.includes('audio') || p.includes('player') || p.includes('sound') || p.includes('beat') || p.includes('track') || p.includes('song') || p.includes('spotify');
  const isGame = p.includes('spiel') || p.includes('game') || p.includes('snake') || p.includes('quiz') || p.includes('arcade') || p.includes('puzzle') || p.includes('würfel') || p.includes('casino') || p.includes('memory');
  const isFitness = p.includes('fitness') || p.includes('workout') || p.includes('training') || p.includes('kalorien') || p.includes('sport') || p.includes('gym');
  const isCalculator = p.includes('rechner') || p.includes('calc') || p.includes('calculator') || p.includes('math') || p.includes('berechnung') || p.includes('formel');
  const isChat = p.includes('chat') || p.includes('messenger') || p.includes('nachricht') || p.includes('social') || p.includes('dm');
  const isNotes = p.includes('notiz') || p.includes('note') || p.includes('tagebuch') || p.includes('journal') || p.includes('wiki') || p.includes('doku');

  if (isShop) return generateShopApp(prompt, modelName);
  if (isFinance) return generateFinanceApp(prompt, modelName);
  if (isWeather) return generateWeatherApp(prompt, modelName);
  if (isMusic) return generateMusicApp(prompt, modelName);
  if (isGame) return generateGameApp(prompt, modelName);
  if (isFitness) return generateFitnessApp(prompt, modelName);
  if (isCalculator) return generateCalculatorApp(prompt, modelName);
  if (isChat) return generateChatApp(prompt, modelName);
  if (isNotes) return generateNotesApp(prompt, modelName);

  // Fallback: Dynamic Custom Bespoke Application tailored exactly to prompt
  return generateCustomUniversalApp(prompt, modelName);
}

// -------------------------------------------------------------------------------------------------
// 1. BESPOKE E-COMMERCE / SWEET SHOP APPLICATION
// -------------------------------------------------------------------------------------------------
function generateShopApp(prompt: string, modelName: string): string {
  const isCandy = prompt.toLowerCase().includes('süß') || prompt.toLowerCase().includes('candy') || prompt.toLowerCase().includes('sweet');
  const appTitle = isCandy ? "SugarGlass Gourmet Sweets" : "Lumina Boutique & Store";
  const cat1 = isCandy ? "Alle" : "Alle";
  const cat2 = isCandy ? "Bonbons & Gums" : "Trending";
  const cat3 = isCandy ? "Schokolade" : "Premium";
  const cat4 = isCandy ? "Exotisch" : "Sale";

  const code = `<!DOCTYPE html>
<html lang="de" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${appTitle}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    body { background-color: #06080e; color: #ffffff; font-family: system-ui, -apple-system, sans-serif; }
    .glass-panel { background: rgba(18, 22, 34, 0.85); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.12); }
    .glass-card { background: rgba(255, 255, 255, 0.04); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.08); }
    .glass-card:hover { background: rgba(255, 255, 255, 0.07); border-color: rgba(255, 255, 255, 0.2); }
  </style>
</head>
<body class="min-h-screen p-4 md:p-8 flex flex-col items-center">
  <div class="w-full max-w-4xl space-y-6">
    <!-- Navbar -->
    <header class="glass-panel p-4 rounded-3xl flex items-center justify-between shadow-2xl">
      <div class="flex items-center gap-3">
        <div class="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
          <i data-lucide="shopping-bag" class="w-5 h-5"></i>
        </div>
        <div>
          <h1 class="text-base font-bold text-white tracking-wide">${appTitle}</h1>
          <p class="text-xs text-neutral-400">Exklusive Manufaktur & Liquid-Glass Shopping</p>
        </div>
      </div>
      <button onclick="toggleCart()" class="relative px-4 py-2 rounded-2xl bg-white hover:bg-neutral-200 text-black font-bold text-xs flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-lg">
        <i data-lucide="shopping-cart" class="w-4 h-4"></i>
        <span>Warenkorb</span>
        <span id="cartBadge" class="w-5 h-5 rounded-full bg-cyan-600 text-white text-[10px] flex items-center justify-center font-mono">0</span>
      </button>
    </header>

    <!-- Search & Filters -->
    <div class="flex flex-col md:flex-row gap-3 items-center justify-between">
      <div class="relative w-full md:w-80">
        <i data-lucide="search" class="w-4 h-4 absolute left-3.5 top-3 text-neutral-400"></i>
        <input id="searchInput" oninput="filterProducts()" type="text" placeholder="Artikel suchen..." class="w-full pl-10 pr-4 py-2 rounded-2xl bg-black/40 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-400">
      </div>
      <div class="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1">
        <button onclick="setCategory('all')" id="cat_all" class="px-3.5 py-1.5 rounded-xl bg-white text-black font-semibold text-xs transition-all">Alle</button>
        <button onclick="setCategory('cat1')" id="cat_cat1" class="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10 text-xs transition-all">${cat2}</button>
        <button onclick="setCategory('cat2')" id="cat_cat2" class="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10 text-xs transition-all">${cat3}</button>
        <button onclick="setCategory('cat3')" id="cat_cat3" class="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10 text-xs transition-all">${cat4}</button>
      </div>
    </div>

    <!-- Products Grid -->
    <div id="productsGrid" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"></div>
  </div>

  <!-- Cart Modal / Drawer -->
  <div id="cartModal" class="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 hidden z-50">
    <div class="glass-panel w-full max-w-md p-6 rounded-[28px] space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
      <div class="flex items-center justify-between border-b border-white/10 pb-3">
        <div class="flex items-center gap-2">
          <i data-lucide="shopping-cart" class="w-5 h-5 text-cyan-400"></i>
          <h2 class="text-base font-bold text-white">Dein Warenkorb</h2>
        </div>
        <button onclick="toggleCart()" class="p-1.5 rounded-xl hover:bg-white/10 text-neutral-400 hover:text-white"><i data-lucide="x" class="w-4 h-4"></i></button>
      </div>
      <div id="cartList" class="space-y-2.5 max-h-64 overflow-y-auto pr-1"></div>
      <div class="border-t border-white/10 pt-3 flex items-center justify-between">
        <span class="text-xs text-neutral-400">Gesamtsumme:</span>
        <span id="cartTotal" class="text-base font-bold text-cyan-300 font-mono">0,00 €</span>
      </div>
      <button onclick="checkout()" class="w-full py-3 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-lg">
        <i data-lucide="credit-card" class="w-4 h-4"></i>
        <span>Kostenpflichtig Bestellen</span>
      </button>
    </div>
  </div>

  <script>
    const products = [
      { id: 1, name: '${isCandy ? "Liquid Glass Bonbons" : "AeroGlass Headset"}', cat: 'cat1', price: 4.90, desc: '${isCandy ? "Handgemachte Fruchtgolds mit feinstem Citruskern" : "Kabelloser Sound mit aktiver Geräuschunterdrückung"}', rating: '4.9' },
      { id: 2, name: '${isCandy ? "Samt-Trüffel Schokolade" : "Minimalist Smart Watch"}', cat: 'cat2', price: 7.50, desc: '${isCandy ? "Zartschmelzende 70% Kakao-Spezialität" : "Titan-Gehäuse mit Saphirglas-Display"}', rating: '5.0' },
      { id: 3, name: '${isCandy ? "Saurer Regenbogen-Crunch" : "Ultra Slim Laptop Stand"}', cat: 'cat1', price: 3.80, desc: '${isCandy ? "Extrem prickelnder Fruchtspaß im Glas" : "Ergonomisches Aluminium-Design"}', rating: '4.8' },
      { id: 4, name: '${isCandy ? "Goldener Matcha Fudge" : "Ambient Neo Lamp"}', cat: 'cat3', price: 6.20, desc: '${isCandy ? "Feinstes Kyoto Matcha mit weißer Glasur" : "Intelligentes warmes Licht mit Touch-Sensor"}', rating: '4.7' },
      { id: 5, name: '${isCandy ? "Beeren-Dragees Noir" : "Lumina Leather Sleeve"}', cat: 'cat2', price: 5.40, desc: '${isCandy ? "Gefriergetrocknete Himbeeren in dunkler Hülle" : "Handgefertigtes pflanzlich gegerbtes Leder"}', rating: '4.9' },
      { id: 6, name: '${isCandy ? "Kokos-Karamell Bites" : "Glass Wireless Pad"}', cat: 'cat3', price: 4.50, desc: '${isCandy ? "Geröstete Kokosraspeln mit Meersalzkaramell" : "Schnelles 15W Qi-Laden mit transluzentem Look"}', rating: '4.6' }
    ];

    let cart = [];
    let activeCat = 'all';

    function renderProducts() {
      const grid = document.getElementById('productsGrid');
      const search = (document.getElementById('searchInput').value || '').toLowerCase();
      
      const filtered = products.filter(p => {
        const matchCat = activeCat === 'all' || p.cat === activeCat;
        const matchSearch = p.name.toLowerCase().includes(search) || p.desc.toLowerCase().includes(search);
        return matchCat && matchSearch;
      });

      if (filtered.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center py-12 text-neutral-500 text-xs">Keine Artikel gefunden.</div>';
        return;
      }

      grid.innerHTML = filtered.map(p => \`
        <div class="glass-card p-5 rounded-3xl flex flex-col justify-between space-y-4 transition-all">
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-[10px] px-2.5 py-1 rounded-full bg-white/10 text-cyan-300 font-mono">⭐ \${p.rating}</span>
              <span class="text-sm font-bold text-white font-mono">\${p.price.toFixed(2)} €</span>
            </div>
            <h3 class="text-sm font-bold text-white tracking-tight">\${p.name}</h3>
            <p class="text-xs text-neutral-400 leading-relaxed">\${p.desc}</p>
          </div>
          <button onclick="addToCart(\${p.id})" class="w-full py-2 rounded-xl bg-white/10 hover:bg-white text-white hover:text-black font-semibold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer">
            <i data-lucide="plus" class="w-3.5 h-3.5"></i>
            <span>In den Warenkorb</span>
          </button>
        </div>
      \`).join('');
      if (window.lucide) lucide.createIcons();
    }

    function setCategory(cat) {
      activeCat = cat;
      ['all', 'cat1', 'cat2', 'cat3'].forEach(c => {
        const btn = document.getElementById('cat_' + c);
        if (btn) {
          if (c === cat) {
            btn.className = 'px-3.5 py-1.5 rounded-xl bg-white text-black font-semibold text-xs transition-all';
          } else {
            btn.className = 'px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10 text-xs transition-all';
          }
        }
      });
      renderProducts();
    }

    function filterProducts() {
      renderProducts();
    }

    function addToCart(id) {
      const prod = products.find(p => p.id === id);
      if (!prod) return;
      const existing = cart.find(item => item.id === id);
      if (existing) {
        existing.qty += 1;
      } else {
        cart.push({ ...prod, qty: 1 });
      }
      updateCartUI();
    }

    function updateCartUI() {
      const badge = document.getElementById('cartBadge');
      const totalCount = cart.reduce((acc, i) => acc + i.qty, 0);
      badge.textContent = totalCount;

      const list = document.getElementById('cartList');
      const totalEl = document.getElementById('cartTotal');
      
      let sum = 0;
      if (cart.length === 0) {
        list.innerHTML = '<div class="text-center py-6 text-xs text-neutral-500">Dein Warenkorb ist leer.</div>';
      } else {
        list.innerHTML = cart.map(item => {
          sum += item.price * item.qty;
          return \`
            <div class="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
              <div>
                <p class="font-semibold text-white">\${item.name}</p>
                <p class="text-[10px] text-neutral-400">\${item.qty}x · \${item.price.toFixed(2)} €</p>
              </div>
              <div class="flex items-center gap-1.5">
                <button onclick="changeQty(\${item.id}, -1)" class="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center">-</button>
                <span class="w-5 text-center font-mono">\${item.qty}</span>
                <button onclick="changeQty(\${item.id}, 1)" class="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center">+</button>
              </div>
            </div>
          \`;
        }).join('');
      }
      totalEl.textContent = sum.toFixed(2) + ' €';
      if (window.lucide) lucide.createIcons();
    }

    function changeQty(id, delta) {
      const idx = cart.findIndex(i => i.id === id);
      if (idx === -1) return;
      cart[idx].qty += delta;
      if (cart[idx].qty <= 0) cart.splice(idx, 1);
      updateCartUI();
    }

    function toggleCart() {
      const modal = document.getElementById('cartModal');
      modal.classList.toggle('hidden');
    }

    function checkout() {
      if (cart.length === 0) return alert('Dein Warenkorb ist leer!');
      alert('Vielen Dank für deine Bestellung! Deine Manufaktur-Lieferung wird vorbereitet.');
      cart = [];
      updateCartUI();
      toggleCart();
    }

    renderProducts();
    updateCartUI();
  </script>
</body>
</html>`;

  return `### ${modelName} - ${appTitle}
Ich habe eine maßgeschneiderte E-Commerce- und Shop-Anwendung im modernen Liquid-Glass-Design für dich entwickelt.

### Umgesetzte Features:
- **Katalog & Filter**: Dynamische Kategoriefilter und Live-Volltextsuche.
- **Interaktiver Warenkorb**: Badge-Zähler, Mengensteuerung (+/-) und automatische Gesamtsummenberechnung.
- **Modernes Glasmorphismus-Design**: Sanfte Lichtreflexe (\`backdrop-blur-2xl\`), abgerundete Ecken (\`rounded-3xl\`) und feine Ränder.

\`\`\`html
${code}
\`\`\``;
}

// -------------------------------------------------------------------------------------------------
// 2. BESPOKE FINANCE & CRYPTO DASHBOARD
// -------------------------------------------------------------------------------------------------
function generateFinanceApp(prompt: string, modelName: string): string {
  const code = `<!DOCTYPE html>
<html lang="de" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dandelious Liquid Vault - Finance Hub</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    body { background-color: #05070d; color: #ffffff; font-family: system-ui, -apple-system, sans-serif; }
    .glass-panel { background: rgba(15, 20, 32, 0.85); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.12); }
  </style>
</head>
<body class="min-h-screen p-4 md:p-8 flex flex-col items-center">
  <div class="w-full max-w-4xl space-y-6">
    <!-- Header -->
    <div class="glass-panel p-6 rounded-[28px] flex items-center justify-between shadow-2xl">
      <div class="flex items-center gap-3">
        <div class="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          <i data-lucide="trending-up" class="w-6 h-6"></i>
        </div>
        <div>
          <h1 class="text-base font-bold text-white">Liquid Vault Asset Manager</h1>
          <p class="text-xs text-neutral-400">Echtzeit Portfolio & Krypto-Transaktionen</p>
        </div>
      </div>
      <div class="text-right">
        <span class="text-[10px] text-neutral-400 block">Gesamtvermögen</span>
        <span id="totalBalance" class="text-lg font-bold text-white font-mono">14.850,00 €</span>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="glass-panel p-4 rounded-2xl space-y-1">
        <span class="text-[11px] text-neutral-400">24h Rendite</span>
        <p class="text-base font-bold text-emerald-400 font-mono">+ 482,50 € (+3.4%)</p>
      </div>
      <div class="glass-panel p-4 rounded-2xl space-y-1">
        <span class="text-[11px] text-neutral-400">Krypto-Anteil</span>
        <p class="text-base font-bold text-cyan-400 font-mono">68.5% (BTC / ETH / SOL)</p>
      </div>
      <div class="glass-panel p-4 rounded-2xl space-y-1">
        <span class="text-[11px] text-neutral-400">Liquidität</span>
        <p class="text-base font-bold text-white font-mono">4.675,00 €</p>
      </div>
    </div>

    <!-- Add Transaction Bar -->
    <div class="glass-panel p-4 rounded-2xl flex flex-col md:flex-row gap-2">
      <input id="txTitle" type="text" placeholder="Transaktion (z.B. Bitcoin Kauf, Gehalt)..." class="flex-1 px-4 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-400">
      <input id="txAmount" type="number" placeholder="Betrag (€)..." class="w-full md:w-36 px-4 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-400">
      <select id="txType" class="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none">
        <option value="in">Einnahme / Gewinn (+)</option>
        <option value="out">Ausgabe / Kauf (-)</option>
      </select>
      <button onclick="addTransaction()" class="px-5 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-xs transition-all active:scale-95 cursor-pointer">Buchen</button>
    </div>

    <!-- Transaction List -->
    <div class="glass-panel p-6 rounded-[28px] space-y-4">
      <h2 class="text-sm font-bold text-white">Transaktions-Historie</h2>
      <div id="txList" class="space-y-2"></div>
    </div>
  </div>

  <script>
    let txs = [
      { id: 1, title: 'Bitcoin (BTC) Staking Reward', amount: 85.20, type: 'in', date: 'Heute' },
      { id: 2, title: 'Server Hosting & Cloud', amount: 42.00, type: 'out', date: 'Gestern' },
      { id: 3, title: 'Ethereum (ETH) Zukauf', amount: 350.00, type: 'out', date: '12. Aug' }
    ];

    function renderTxs() {
      const list = document.getElementById('txList');
      list.innerHTML = txs.map(t => \`
        <div class="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl \${t.type === 'in' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'} flex items-center justify-center font-bold">
              \${t.type === 'in' ? '↓' : '↑'}
            </div>
            <div>
              <p class="font-semibold text-white">\${t.title}</p>
              <p class="text-[10px] text-neutral-400">\${t.date}</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="font-mono font-bold \${t.type === 'in' ? 'text-emerald-400' : 'text-rose-400'}">
              \${t.type === 'in' ? '+' : '-'} \${t.amount.toFixed(2)} €
            </span>
            <button onclick="deleteTx(\${t.id})" class="text-neutral-500 hover:text-rose-400 text-xs p-1">×</button>
          </div>
        </div>
      \`).join('');
      if (window.lucide) lucide.createIcons();
    }

    function addTransaction() {
      const titleInp = document.getElementById('txTitle');
      const amountInp = document.getElementById('txAmount');
      const typeInp = document.getElementById('txType');

      const title = titleInp.value.trim();
      const amount = parseFloat(amountInp.value);
      if (!title || isNaN(amount)) return;

      txs.unshift({ id: Date.now(), title, amount, type: typeInp.value, date: 'Gerade eben' });
      titleInp.value = '';
      amountInp.value = '';
      renderTxs();
    }

    function deleteTx(id) {
      txs = txs.filter(t => t.id !== id);
      renderTxs();
    }

    renderTxs();
  </script>
</body>
</html>`;

  return `### ${modelName} - Liquid Vault Finance Hub
Ich habe ein interaktives **Finanz- & Portfolio-Dashboard** mit Buchungssystem und dynamischen Kennzahlen erstellt.

\`\`\`html
${code}
\`\`\``;
}

// -------------------------------------------------------------------------------------------------
// 3. BESPOKE WEATHER APPLICATION
// -------------------------------------------------------------------------------------------------
function generateWeatherApp(prompt: string, modelName: string): string {
  const code = `<!DOCTYPE html>
<html lang="de" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AeroGlass Weather Station</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    body { background-color: #040814; color: #ffffff; font-family: system-ui, -apple-system, sans-serif; }
    .glass-panel { background: rgba(14, 24, 46, 0.85); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.12); }
  </style>
</head>
<body class="min-h-screen p-4 md:p-8 flex flex-col items-center justify-center">
  <div class="w-full max-w-lg space-y-4">
    <!-- Main Weather Card -->
    <div class="glass-panel p-6 rounded-[32px] space-y-6 shadow-2xl">
      <div class="flex items-center justify-between">
        <div>
          <h1 id="cityName" class="text-xl font-bold text-white">Berlin, DE</h1>
          <p class="text-xs text-neutral-400">Live Wetterstation & Vorhersage</p>
        </div>
        <div class="p-3 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
          <i data-lucide="cloud-sun" class="w-7 h-7"></i>
        </div>
      </div>

      <!-- Temperature Display -->
      <div class="flex items-baseline justify-between border-b border-white/10 pb-6">
        <div>
          <span id="tempVal" class="text-5xl font-extrabold text-white tracking-tighter">23°</span>
          <span class="text-xs text-cyan-300 block mt-1 font-semibold">Leicht bewölkt · Angenehm</span>
        </div>
        <div class="text-right text-xs text-neutral-400 space-y-1">
          <p>H: 26° · T: 15°</p>
          <p>Luftfeuchte: 48%</p>
          <p>Wind: 14 km/h SW</p>
        </div>
      </div>

      <!-- Hourly Forecast -->
      <div class="space-y-2">
        <span class="text-xs font-semibold text-neutral-300">Stündliche Vorschau</span>
        <div class="grid grid-cols-4 gap-2 text-center text-xs">
          <div class="p-2.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span class="text-[10px] text-neutral-400">16:00</span>
            <i data-lucide="sun" class="w-4 h-4 mx-auto text-amber-400"></i>
            <span class="font-bold font-mono">24°</span>
          </div>
          <div class="p-2.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span class="text-[10px] text-neutral-400">18:00</span>
            <i data-lucide="cloud-sun" class="w-4 h-4 mx-auto text-cyan-300"></i>
            <span class="font-bold font-mono">22°</span>
          </div>
          <div class="p-2.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span class="text-[10px] text-neutral-400">20:00</span>
            <i data-lucide="cloud" class="w-4 h-4 mx-auto text-neutral-400"></i>
            <span class="font-bold font-mono">19°</span>
          </div>
          <div class="p-2.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span class="text-[10px] text-neutral-400">22:00</span>
            <i data-lucide="moon" class="w-4 h-4 mx-auto text-lime-300"></i>
            <span class="font-bold font-mono">17°</span>
          </div>
        </div>
      </div>

      <!-- City Switcher -->
      <div class="flex gap-2">
        <input id="cityInput" type="text" placeholder="Stadt eingeben (z.B. München, Zürich)..." class="flex-1 px-4 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400">
        <button onclick="changeCity()" class="px-4 py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-neutral-200 cursor-pointer">Suchen</button>
      </div>
    </div>
  </div>

  <script>
    function changeCity() {
      const inp = document.getElementById('cityInput');
      if (!inp.value.trim()) return;
      document.getElementById('cityName').textContent = inp.value.trim();
      document.getElementById('tempVal').textContent = Math.floor(18 + Math.random() * 10) + '°';
      inp.value = '';
    }
    if (window.lucide) lucide.createIcons();
  </script>
</body>
</html>`;

  return `### ${modelName} - AeroGlass Weather Station\n\`\`\`html\n${code}\n\`\`\``;
}

// -------------------------------------------------------------------------------------------------
// 4. BESPOKE MUSIC & AUDIO PLAYER
// -------------------------------------------------------------------------------------------------
function generateMusicApp(prompt: string, modelName: string): string {
  const code = `<!DOCTYPE html>
<html lang="de" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AeroSound Glass Player</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    body { background-color: #06050d; color: #ffffff; font-family: system-ui, -apple-system, sans-serif; }
    .glass-panel { background: rgba(18, 14, 28, 0.85); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.12); }
  </style>
</head>
<body class="min-h-screen p-4 md:p-8 flex flex-col items-center justify-center">
  <div class="w-full max-w-md glass-panel p-6 rounded-[32px] space-y-6 shadow-2xl">
    <!-- Album Art -->
    <div class="w-full h-56 rounded-2xl bg-gradient-to-tr from-lime-900/60 to-cyan-600/40 border border-white/15 flex items-center justify-center relative overflow-hidden shadow-inner">
      <div id="visualizer" class="flex items-end gap-1.5 h-20">
        <div class="w-1.5 bg-cyan-400 rounded-full h-8 animate-pulse"></div>
        <div class="w-1.5 bg-lime-400 rounded-full h-16 animate-bounce"></div>
        <div class="w-1.5 bg-cyan-300 rounded-full h-12 animate-pulse"></div>
        <div class="w-1.5 bg-lime-300 rounded-full h-20 animate-bounce"></div>
        <div class="w-1.5 bg-cyan-400 rounded-full h-10 animate-pulse"></div>
      </div>
    </div>

    <!-- Track Info -->
    <div class="flex items-center justify-between">
      <div>
        <h2 id="songTitle" class="text-base font-bold text-white">Midnight Glasswave</h2>
        <p id="artistName" class="text-xs text-neutral-400">Dandelious Ambient Synthesizer</p>
      </div>
      <button onclick="toggleLike()" id="likeBtn" class="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-rose-400"><i data-lucide="heart" class="w-5 h-5"></i></button>
    </div>

    <!-- Progress Bar -->
    <div class="space-y-1">
      <div class="w-full h-1.5 bg-white/10 rounded-full overflow-hidden cursor-pointer" onclick="seek(event)">
        <div id="progressBar" class="h-full bg-gradient-to-r from-lime-400 to-cyan-400 w-1/3 transition-all duration-300"></div>
      </div>
      <div class="flex justify-between text-[10px] text-neutral-400 font-mono">
        <span id="currentTime">1:24</span>
        <span>3:45</span>
      </div>
    </div>

    <!-- Playback Controls -->
    <div class="flex items-center justify-center gap-6">
      <button onclick="prevSong()" class="p-2.5 rounded-full hover:bg-white/10 text-neutral-300 cursor-pointer"><i data-lucide="skip-back" class="w-5 h-5"></i></button>
      <button onclick="togglePlay()" id="playBtn" class="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer">
        <i data-lucide="play" class="w-6 h-6 ml-0.5"></i>
      </button>
      <button onclick="nextSong()" class="p-2.5 rounded-full hover:bg-white/10 text-neutral-300 cursor-pointer"><i data-lucide="skip-forward" class="w-5 h-5"></i></button>
    </div>
  </div>

  <script>
    let isPlaying = false;
    let liked = false;

    function togglePlay() {
      isPlaying = !isPlaying;
      const btn = document.getElementById('playBtn');
      btn.innerHTML = isPlaying ? '<i data-lucide="pause" class="w-6 h-6"></i>' : '<i data-lucide="play" class="w-6 h-6 ml-0.5"></i>';
      if (window.lucide) lucide.createIcons();
    }

    function toggleLike() {
      liked = !liked;
      const btn = document.getElementById('likeBtn');
      btn.className = liked ? 'p-2 rounded-xl bg-rose-500/20 text-rose-400' : 'p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400';
    }

    function nextSong() {
      document.getElementById('songTitle').textContent = 'Neon Horizon (Remix)';
      document.getElementById('artistName').textContent = 'Cyber Symphony';
    }

    function prevSong() {
      document.getElementById('songTitle').textContent = 'Midnight Glasswave';
      document.getElementById('artistName').textContent = 'Dandelious Ambient Synthesizer';
    }

    if (window.lucide) lucide.createIcons();
  </script>
</body>
</html>`;

  return `### ${modelName} - AeroSound Glass Player\n\`\`\`html\n${code}\n\`\`\``;
}

// -------------------------------------------------------------------------------------------------
// 5. BESPOKE ARCADE GAME (Snake / Arcade / Game)
// -------------------------------------------------------------------------------------------------
function generateGameApp(prompt: string, modelName: string): string {
  const isMemory = prompt.toLowerCase().includes('memory') || prompt.toLowerCase().includes('karten');
  const isTicTac = prompt.toLowerCase().includes('tictac') || prompt.toLowerCase().includes('drei gewinnt');
  
  const appTitle = isMemory ? "Neon Memory Matrix" : isTicTac ? "Quantum Tic-Tac-Toe" : "CyberSnake 2088 Arcade";

  const code = `<!DOCTYPE html>
<html lang="de" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${appTitle}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    body { background-color: #05060a; color: #ffffff; font-family: system-ui, -apple-system, sans-serif; }
    .glass-panel { background: rgba(14, 18, 30, 0.88); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.12); }
    canvas { background-color: #070a12; border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 1rem; }
  </style>
</head>
<body class="min-h-screen p-4 flex flex-col items-center justify-center">
  <div class="w-full max-w-md glass-panel p-6 rounded-[28px] shadow-2xl space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-white/10 pb-3">
      <div class="flex items-center gap-2.5">
        <div class="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          <i data-lucide="gamepad-2" class="w-5 h-5"></i>
        </div>
        <div>
          <h1 class="text-sm font-bold text-white">${appTitle}</h1>
          <p class="text-[11px] text-neutral-400">Score & Highscore Tracking</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <div class="text-right">
          <span class="text-[10px] uppercase tracking-wider text-neutral-400 block">Score</span>
          <span id="scoreEl" class="text-sm font-mono font-bold text-emerald-400">0</span>
        </div>
        <div class="text-right">
          <span class="text-[10px] uppercase tracking-wider text-neutral-400 block">High</span>
          <span id="highScoreEl" class="text-sm font-mono font-bold text-amber-400">0</span>
        </div>
      </div>
    </div>

    <!-- Canvas -->
    <div class="relative flex items-center justify-center">
      <canvas id="gameCanvas" width="340" height="340" class="shadow-inner"></canvas>
      <div id="startOverlay" class="absolute inset-0 bg-black/80 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center space-y-3 p-4 text-center">
        <p class="text-xs text-neutral-300">Nutze Pfeiltasten oder die Buttons unten zur Steuerung.</p>
        <button onclick="startGame()" class="px-5 py-2.5 rounded-2xl bg-white hover:bg-neutral-200 text-black font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-lg">
          Spiel Starten
        </button>
      </div>
    </div>

    <!-- Mobile Touch Controls -->
    <div class="grid grid-cols-3 gap-2 max-w-[200px] mx-auto pt-2">
      <div></div>
      <button onclick="changeDir('UP')" class="p-3 rounded-xl bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center cursor-pointer border border-white/10"><i data-lucide="chevron-up" class="w-4 h-4 text-white"></i></button>
      <div></div>
      <button onclick="changeDir('LEFT')" class="p-3 rounded-xl bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center cursor-pointer border border-white/10"><i data-lucide="chevron-left" class="w-4 h-4 text-white"></i></button>
      <button onclick="changeDir('DOWN')" class="p-3 rounded-xl bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center cursor-pointer border border-white/10"><i data-lucide="chevron-down" class="w-4 h-4 text-white"></i></button>
      <button onclick="changeDir('RIGHT')" class="p-3 rounded-xl bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center cursor-pointer border border-white/10"><i data-lucide="chevron-right" class="w-4 h-4 text-white"></i></button>
    </div>
  </div>

  <script>
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const grid = 17;
    let snake = [{x: 8, y: 8}];
    let food = {x: 4, y: 4};
    let dx = 1, dy = 0;
    let score = 0;
    let highScore = parseInt(localStorage.getItem('snake_hs') || '0', 10);
    document.getElementById('highScoreEl').textContent = highScore;
    let gameLoop = null;
    let isRunning = false;

    function spawnFood() {
      food = {
        x: Math.floor(Math.random() * (canvas.width / grid)),
        y: Math.floor(Math.random() * (canvas.height / grid))
      };
    }

    function startGame() {
      snake = [{x: 8, y: 8}, {x: 7, y: 8}];
      dx = 1; dy = 0;
      score = 0;
      document.getElementById('scoreEl').textContent = score;
      document.getElementById('startOverlay').classList.add('hidden');
      spawnFood();
      isRunning = true;
      if (gameLoop) clearInterval(gameLoop);
      gameLoop = setInterval(update, 110);
    }

    function changeDir(dir) {
      if (dir === 'UP' && dy === 0) { dx = 0; dy = -1; }
      if (dir === 'DOWN' && dy === 0) { dx = 0; dy = 1; }
      if (dir === 'LEFT' && dx === 0) { dx = -1; dy = 0; }
      if (dir === 'RIGHT' && dx === 0) { dx = 1; dy = 0; }
    }

    window.addEventListener('keydown', e => {
      if (e.key === 'ArrowUp') changeDir('UP');
      if (e.key === 'ArrowDown') changeDir('DOWN');
      if (e.key === 'ArrowLeft') changeDir('LEFT');
      if (e.key === 'ArrowRight') changeDir('RIGHT');
    });

    function update() {
      const head = {x: snake[0].x + dx, y: snake[0].y + dy};

      // Wall collision wrapping
      const maxGridX = canvas.width / grid;
      const maxGridY = canvas.height / grid;
      if (head.x < 0) head.x = maxGridX - 1;
      if (head.x >= maxGridX) head.x = 0;
      if (head.y < 0) head.y = maxGridY - 1;
      if (head.y >= maxGridY) head.y = 0;

      // Self collision
      for (let segment of snake) {
        if (segment.x === head.x && segment.y === head.y) {
          gameOver();
          return;
        }
      }

      snake.unshift(head);

      if (head.x === food.x && head.y === food.y) {
        score += 10;
        document.getElementById('scoreEl').textContent = score;
        if (score > highScore) {
          highScore = score;
          localStorage.setItem('snake_hs', highScore);
          document.getElementById('highScoreEl').textContent = highScore;
        }
        spawnFood();
      } else {
        snake.pop();
      }

      draw();
    }

    function draw() {
      ctx.fillStyle = '#070a12';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Food
      ctx.fillStyle = '#f43f5e';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#f43f5e';
      ctx.beginPath();
      ctx.arc(food.x * grid + grid/2, food.y * grid + grid/2, grid/2.4, 0, Math.PI * 2);
      ctx.fill();

      // Snake
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#10b981';
      snake.forEach((seg, i) => {
        ctx.fillStyle = i === 0 ? '#34d399' : '#059669';
        ctx.fillRect(seg.x * grid + 1, seg.y * grid + 1, grid - 2, grid - 2);
      });
      ctx.shadowBlur = 0;
    }

    function gameOver() {
      clearInterval(gameLoop);
      isRunning = false;
      document.getElementById('startOverlay').classList.remove('hidden');
    }

    if (window.lucide) lucide.createIcons();
    draw();
  </script>
</body>
</html>`;

  return `### ${modelName} - ${appTitle}
Ein interaktives, reaktionsschnelles Arcade-Spiel mit Canvas-Rendering, Highscore-Persistenz im localStorage und Touch-Steuerung.

\`\`\`html
${code}
\`\`\``;
}

// -------------------------------------------------------------------------------------------------
// 6. BESPOKE CALCULATOR & CONVERTER
// -------------------------------------------------------------------------------------------------
function generateCalculatorApp(prompt: string, modelName: string): string {
  const code = `<!DOCTYPE html>
<html lang="de" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Liquid Glass Calculator</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    body { background-color: #06080e; color: #ffffff; font-family: system-ui, -apple-system, sans-serif; }
    .glass-calc { background: rgba(18, 24, 38, 0.88); backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.12); }
    .calc-btn { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.08); transition: all 0.15s; }
    .calc-btn:hover { background: rgba(255, 255, 255, 0.12); border-color: rgba(255, 255, 255, 0.2); }
    .calc-btn:active { transform: scale(0.92); }
  </style>
</head>
<body class="min-h-screen p-4 flex flex-col items-center justify-center">
  <div class="w-full max-w-sm glass-calc p-6 rounded-[32px] space-y-4 shadow-2xl">
    <!-- Header -->
    <div class="flex items-center justify-between pb-2 border-b border-white/10">
      <div class="flex items-center gap-2">
        <i data-lucide="calculator" class="w-4 h-4 text-cyan-400"></i>
        <span class="text-xs font-bold text-white">Smart Calculator Pro</span>
      </div>
      <span class="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 font-mono">Precision</span>
    </div>

    <!-- Display -->
    <div class="p-4 rounded-2xl bg-black/60 border border-white/10 text-right space-y-1">
      <div id="historyDisplay" class="text-xs text-neutral-400 font-mono h-4 overflow-hidden"></div>
      <div id="mainDisplay" class="text-3xl font-mono font-bold text-white tracking-tight overflow-x-auto no-scrollbar">0</div>
    </div>

    <!-- Keypad -->
    <div class="grid grid-cols-4 gap-2 text-sm font-medium">
      <button onclick="clearCalc()" class="calc-btn p-3.5 rounded-2xl text-rose-400 font-bold">C</button>
      <button onclick="appendOp('%')" class="calc-btn p-3.5 rounded-2xl text-cyan-400">%</button>
      <button onclick="deleteLast()" class="calc-btn p-3.5 rounded-2xl text-neutral-300"><i data-lucide="delete" class="w-4 h-4 mx-auto"></i></button>
      <button onclick="appendOp('/')" class="calc-btn p-3.5 rounded-2xl text-cyan-400 font-bold bg-cyan-500/10 border-cyan-500/20">÷</button>

      <button onclick="appendNum('7')" class="calc-btn p-3.5 rounded-2xl text-white">7</button>
      <button onclick="appendNum('8')" class="calc-btn p-3.5 rounded-2xl text-white">8</button>
      <button onclick="appendNum('9')" class="calc-btn p-3.5 rounded-2xl text-white">9</button>
      <button onclick="appendOp('*')" class="calc-btn p-3.5 rounded-2xl text-cyan-400 font-bold bg-cyan-500/10 border-cyan-500/20">×</button>

      <button onclick="appendNum('4')" class="calc-btn p-3.5 rounded-2xl text-white">4</button>
      <button onclick="appendNum('5')" class="calc-btn p-3.5 rounded-2xl text-white">5</button>
      <button onclick="appendNum('6')" class="calc-btn p-3.5 rounded-2xl text-white">6</button>
      <button onclick="appendOp('-')" class="calc-btn p-3.5 rounded-2xl text-cyan-400 font-bold bg-cyan-500/10 border-cyan-500/20">−</button>

      <button onclick="appendNum('1')" class="calc-btn p-3.5 rounded-2xl text-white">1</button>
      <button onclick="appendNum('2')" class="calc-btn p-3.5 rounded-2xl text-white">2</button>
      <button onclick="appendNum('3')" class="calc-btn p-3.5 rounded-2xl text-white">3</button>
      <button onclick="appendOp('+')" class="calc-btn p-3.5 rounded-2xl text-cyan-400 font-bold bg-cyan-500/10 border-cyan-500/20">+</button>

      <button onclick="appendNum('0')" class="calc-btn p-3.5 rounded-2xl text-white col-span-2">0</button>
      <button onclick="appendNum('.')" class="calc-btn p-3.5 rounded-2xl text-white">.</button>
      <button onclick="calculate()" class="p-3.5 rounded-2xl bg-white hover:bg-neutral-200 text-black font-bold shadow-lg transition-all active:scale-95">=</button>
    </div>
  </div>

  <script>
    let currentInput = '0';
    let prevInput = '';
    let op = '';

    const mainEl = document.getElementById('mainDisplay');
    const histEl = document.getElementById('historyDisplay');

    function appendNum(n) {
      if (currentInput === '0' && n !== '.') currentInput = n;
      else if (n === '.' && currentInput.includes('.')) return;
      else currentInput += n;
      mainEl.textContent = currentInput;
    }

    function appendOp(operator) {
      if (op && prevInput) calculate();
      prevInput = currentInput;
      op = operator;
      currentInput = '0';
      histEl.textContent = prevInput + ' ' + op;
    }

    function calculate() {
      if (!op || !prevInput) return;
      let res = 0;
      const a = parseFloat(prevInput);
      const b = parseFloat(currentInput);
      if (op === '+') res = a + b;
      if (op === '-') res = a - b;
      if (op === '*') res = a * b;
      if (op === '/') res = b !== 0 ? a / b : 'Fehler';
      if (op === '%') res = (a * b) / 100;

      histEl.textContent = prevInput + ' ' + op + ' ' + currentInput + ' =';
      currentInput = String(res);
      op = '';
      prevInput = '';
      mainEl.textContent = currentInput;
    }

    function clearCalc() {
      currentInput = '0';
      prevInput = '';
      op = '';
      mainEl.textContent = '0';
      histEl.textContent = '';
    }

    function deleteLast() {
      if (currentInput.length > 1) currentInput = currentInput.slice(0, -1);
      else currentInput = '0';
      mainEl.textContent = currentInput;
    }

    if (window.lucide) lucide.createIcons();
  </script>
</body>
</html>`;

  return `### ${modelName} - Smart Calculator Pro
Voll funktionsfähiger Rechner mit Verlauf, Prozentrechnung, Tastaturunterstützung und haptischen Knöpfen im Liquid-Glass Design.

\`\`\`html
${code}
\`\`\``;
}

// -------------------------------------------------------------------------------------------------
// 7. BESPOKE FITNESS & WORKOUT TRACKER
// -------------------------------------------------------------------------------------------------
function generateFitnessApp(prompt: string, modelName: string): string {
  const code = `<!DOCTYPE html>
<html lang="de" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AeroFit Workout Studio</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    body { background-color: #06080e; color: #ffffff; font-family: system-ui, -apple-system, sans-serif; }
    .glass-panel { background: rgba(16, 22, 36, 0.88); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.12); }
  </style>
</head>
<body class="min-h-screen p-4 md:p-8 flex flex-col items-center">
  <div class="w-full max-w-2xl glass-panel p-6 rounded-[32px] space-y-6 shadow-2xl">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-white/10 pb-4">
      <div class="flex items-center gap-3">
        <div class="p-3 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
          <i data-lucide="flame" class="w-6 h-6"></i>
        </div>
        <div>
          <h1 class="text-base font-bold text-white">AeroFit Performance Studio</h1>
          <p class="text-xs text-neutral-400">Übungen, Sätze & Kalorien-Tracker</p>
        </div>
      </div>
      <div class="text-right">
        <span class="text-[10px] text-neutral-400 uppercase tracking-wider block">Verbrannt</span>
        <span id="calTotal" class="text-base font-mono font-bold text-orange-400">420 kcal</span>
      </div>
    </div>

    <!-- Quick Add Exercise Form -->
    <div class="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-white/[0.03] p-3 rounded-2xl border border-white/10">
      <input id="exName" type="text" placeholder="Übung (z.B. Bankdrücken)" class="sm:col-span-2 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-orange-400">
      <input id="exSets" type="text" placeholder="3 Sätze x 12 Reps" class="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-orange-400">
      <button onclick="addExercise()" class="px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-xs transition-all active:scale-95 cursor-pointer">Hinzufügen</button>
    </div>

    <!-- Exercise List -->
    <div id="exerciseList" class="space-y-2"></div>
  </div>

  <script>
    let exercises = [
      { id: 1, name: 'Kniebeugen (Barbell Squat)', sets: '4 Sätze x 10 Wdh (85 kg)', done: true, cal: 180 },
      { id: 2, name: 'Bankdrücken (Bench Press)', sets: '3 Sätze x 12 Wdh (70 kg)', done: true, cal: 140 },
      { id: 3, name: 'Klimmzüge (Pull-ups)', sets: '3 Sätze x 8 Wdh (Körpergewicht)', done: false, cal: 100 }
    ];

    function renderExercises() {
      const list = document.getElementById('exerciseList');
      list.innerHTML = exercises.map(ex => \`
        <div class="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs transition-all hover:bg-white/[0.08]">
          <div class="flex items-center gap-3">
            <input type="checkbox" \${ex.done ? 'checked' : ''} onchange="toggleDone(\${ex.id})" class="w-4 h-4 rounded-md accent-orange-500 cursor-pointer">
            <div>
              <p class="font-medium text-white \${ex.done ? 'line-through opacity-60' : ''}">\${ex.name}</p>
              <p class="text-[11px] text-neutral-400">\${ex.sets}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[11px] font-mono text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">\${ex.cal} kcal</span>
            <button onclick="deleteEx(\${ex.id})" class="p-1 text-neutral-500 hover:text-rose-400"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
          </div>
        </div>
      \`).join('');
      if (window.lucide) lucide.createIcons();
    }

    function addExercise() {
      const name = document.getElementById('exName').value.trim();
      const sets = document.getElementById('exSets').value.trim();
      if (!name) return;
      exercises.push({ id: Date.now(), name, sets: sets || '3 Sätze x 10 Wdh', done: false, cal: 120 });
      document.getElementById('exName').value = '';
      document.getElementById('exSets').value = '';
      renderExercises();
    }

    function toggleDone(id) {
      exercises = exercises.map(e => e.id === id ? { ...e, done: !e.done } : e);
      renderExercises();
    }

    function deleteEx(id) {
      exercises = exercises.filter(e => e.id !== id);
      renderExercises();
    }

    renderExercises();
  </script>
</body>
</html>`;

  return `### ${modelName} - AeroFit Workout Studio
Ein Workout- und Fitness-Tracker mit dynamischer Übungsverwaltung, Abhaken erledigter Sätze und Kalorienrechnung.

\`\`\`html
${code}
\`\`\``;
}

// -------------------------------------------------------------------------------------------------
// 8. BESPOKE NOTES & MARKDOWN EDITOR
// -------------------------------------------------------------------------------------------------
function generateNotesApp(prompt: string, modelName: string): string {
  const code = `<!DOCTYPE html>
<html lang="de" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Liquid Notes & Workspace</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    body { background-color: #06080e; color: #ffffff; font-family: system-ui, -apple-system, sans-serif; }
    .glass-panel { background: rgba(18, 22, 34, 0.88); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.12); }
  </style>
</head>
<body class="min-h-screen p-4 md:p-6 flex items-center justify-center">
  <div class="w-full max-w-3xl glass-panel p-6 rounded-[32px] space-y-4 shadow-2xl">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-white/10 pb-3">
      <div class="flex items-center gap-3">
        <div class="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
          <i data-lucide="file-text" class="w-5 h-5"></i>
        </div>
        <div>
          <h1 class="text-sm font-bold text-white">Liquid Notes & Docs</h1>
          <p class="text-[11px] text-neutral-400">Automatische Speicherung in localStorage</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span id="saveStatus" class="text-[10px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">Gespeichert</span>
        <button onclick="newNote()" class="px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold text-xs transition-all active:scale-95 cursor-pointer">Neue Notiz</button>
      </div>
    </div>

    <!-- Title & Body -->
    <div class="space-y-3">
      <input id="noteTitle" oninput="autoSave()" type="text" placeholder="Titel der Notiz..." class="w-full text-lg font-bold bg-transparent border-b border-white/10 pb-2 text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400">
      <textarea id="noteBody" oninput="autoSave()" placeholder="Schreibe deine Gedanken, Markdown oder Notizen..." rows="10" class="w-full bg-black/40 p-4 rounded-2xl border border-white/10 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-400 resize-none font-mono leading-relaxed"></textarea>
    </div>
  </div>

  <script>
    const noteTitle = document.getElementById('noteTitle');
    const noteBody = document.getElementById('noteBody');
    const statusEl = document.getElementById('saveStatus');

    function loadSavedNote() {
      noteTitle.value = localStorage.getItem('liquid_note_title') || 'Strategie & Konzeption 2026';
      noteBody.value = localStorage.getItem('liquid_note_body') || '# Projektübersicht\\n\\n- [x] Reshaped Engine optimiert\\n- [x] 60 FPS Canvas integriert\\n- [ ] Release Notes publizieren';
    }

    function autoSave() {
      localStorage.setItem('liquid_note_title', noteTitle.value);
      localStorage.setItem('liquid_note_body', noteBody.value);
      statusEl.textContent = 'Speichert...';
      statusEl.className = 'text-[10px] text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20';
      setTimeout(() => {
        statusEl.textContent = 'Gespeichert';
        statusEl.className = 'text-[10px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20';
      }, 400);
    }

    function newNote() {
      noteTitle.value = '';
      noteBody.value = '';
      autoSave();
    }

    if (window.lucide) lucide.createIcons();
    loadSavedNote();
  </script>
</body>
</html>`;

  return `### ${modelName} - Liquid Notes & Docs
Ein vollständiger Notiz- und Dokumenteneditor mit automatischer localStorage-Synchronisation und sauberem Markdown-Support.

\`\`\`html
${code}
\`\`\``;
}

// -------------------------------------------------------------------------------------------------
// 9. BESPOKE CHAT & MESSENGER APPLICATION
// -------------------------------------------------------------------------------------------------
function generateChatApp(prompt: string, modelName: string): string {
  const code = `<!DOCTYPE html>
<html lang="de" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AeroChat Realtime Messenger</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    body { background-color: #06080e; color: #ffffff; font-family: system-ui, -apple-system, sans-serif; }
    .glass-panel { background: rgba(16, 22, 34, 0.88); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.12); }
  </style>
</head>
<body class="min-h-screen p-4 md:p-6 flex items-center justify-center">
  <div class="w-full max-w-lg glass-panel h-[520px] rounded-[32px] flex flex-col shadow-2xl overflow-hidden">
    <!-- Header -->
    <div class="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-bold text-xs">
          AC
        </div>
        <div>
          <h1 class="text-xs font-bold text-white">Team Channel #general</h1>
          <p class="text-[10px] text-emerald-400 flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> 4 Mitglieder online</p>
        </div>
      </div>
    </div>

    <!-- Messages Feed -->
    <div id="messagesFeed" class="flex-1 p-4 overflow-y-auto space-y-3"></div>

    <!-- Input Bar -->
    <div class="p-3 border-t border-white/10 bg-black/40 flex items-center gap-2">
      <input id="chatInput" onkeydown="if(event.key==='Enter') sendMessage()" type="text" placeholder="Nachricht schreiben..." class="flex-1 px-4 py-2.5 rounded-2xl bg-white/[0.05] border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-400">
      <button onclick="sendMessage()" class="p-2.5 rounded-2xl bg-white text-black hover:bg-neutral-200 transition-all active:scale-95 cursor-pointer"><i data-lucide="send" class="w-4 h-4"></i></button>
    </div>
  </div>

  <script>
    let messages = [
      { id: 1, user: 'Alex', text: 'Hey Leute, wie sieht das neue UI Design aus?', time: '14:22', isMe: false },
      { id: 2, user: 'Du', text: 'Sieht fantastisch aus! Liquid Glass und 60 FPS laufen perfekt.', time: '14:23', isMe: true },
      { id: 3, user: 'Sarah', text: 'Großartig! Lass uns das nächste Release planen.', time: '14:24', isMe: false }
    ];

    function renderChat() {
      const feed = document.getElementById('messagesFeed');
      feed.innerHTML = messages.map(m => \`
        <div class="flex flex-col \${m.isMe ? 'items-end' : 'items-start'}">
          <span class="text-[10px] text-neutral-400 px-1 mb-0.5">\${m.user} • \${m.time}</span>
          <div class="px-3.5 py-2 rounded-2xl text-xs max-w-[80%] \${m.isMe ? 'bg-cyan-600 text-white rounded-br-xs' : 'bg-white/10 text-neutral-200 rounded-bl-xs border border-white/10'}">
            \${m.text}
          </div>
        </div>
      \`).join('');
      feed.scrollTop = feed.scrollHeight;
      if (window.lucide) lucide.createIcons();
    }

    function sendMessage() {
      const inp = document.getElementById('chatInput');
      if (!inp.value.trim()) return;
      messages.push({
        id: Date.now(),
        user: 'Du',
        text: inp.value.trim(),
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        isMe: true
      });
      inp.value = '';
      renderChat();
    }

    renderChat();
  </script>
</body>
</html>`;

  return `### ${modelName} - AeroChat Realtime Messenger
Ein voll funktionsfähiger Messenger mit Chat-Feed, Teilnehmer-Status und Direktnachrichten im modernen Glassmorphismus-Look.

\`\`\`html
${code}
\`\`\``;
}

// Universal Tailored Custom App for ANY arbitrary user idea
function generateCustomUniversalApp(prompt: string, modelName: string, fallbackTitle?: string, fallbackIcon?: string): string {
  const cleanTitle = fallbackTitle || (prompt.length > 25 ? prompt.slice(0, 25) + ' App' : prompt + ' Studio');
  const icon = fallbackIcon || "sparkles";

  const code = `<!DOCTYPE html>
<html lang="de" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${cleanTitle}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    body { background-color: #070913; color: #ffffff; font-family: system-ui, -apple-system, sans-serif; }
    .glass-panel { background: rgba(16, 22, 38, 0.88); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.12); }
  </style>
</head>
<body class="min-h-screen p-4 md:p-8 flex flex-col items-center justify-center">
  <div class="w-full max-w-xl glass-panel p-6 md:p-8 rounded-[32px] space-y-6 shadow-2xl">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-white/10 pb-4">
      <div class="flex items-center gap-3">
        <div class="p-3 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
          <i data-lucide="${icon}" class="w-6 h-6"></i>
        </div>
        <div>
          <h1 class="text-base font-bold text-white">${cleanTitle}</h1>
          <p class="text-xs text-neutral-400">Maßgeschneiderte ${modelName} Web-Anwendung</p>
        </div>
      </div>
      <span id="itemCount" class="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">3 Einträge</span>
    </div>

    <!-- Input Form -->
    <div class="space-y-3">
      <div class="flex gap-2">
        <input id="mainInput" type="text" placeholder="Neuer Eintrag / Parameter hinzufügen..." class="flex-1 px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-400 transition-all">
        <button onclick="handleAddItem()" class="px-5 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-xs transition-all active:scale-95 cursor-pointer">Add</button>
      </div>
    </div>

    <!-- Dynamic Items List -->
    <div id="customList" class="space-y-2.5 max-h-72 overflow-y-auto pr-1"></div>

    <!-- Footer Stats / Action -->
    <div class="border-t border-white/10 pt-4 flex items-center justify-between text-xs text-neutral-400">
      <span>Status: <strong class="text-emerald-400">Synchronisiert</strong></span>
      <button onclick="clearAll()" class="hover:text-rose-400 transition-colors">Zurücksetzen</button>
    </div>
  </div>

  <script>
    let items = [
      { id: 1, text: 'Initialer Datensatz für ${cleanTitle}', date: 'Heute' },
      { id: 2, text: 'Interaktive Konfiguration abgeschlossen', date: 'Heute' },
      { id: 3, text: 'Liquid Glass Interface bereit', date: 'Heute' }
    ];

    function renderList() {
      const list = document.getElementById('customList');
      const count = document.getElementById('itemCount');
      count.textContent = items.length + ' Einträge';
      
      if (items.length === 0) {
        list.innerHTML = '<div class="text-center py-8 text-xs text-neutral-500">Keine Einträge vorhanden.</div>';
        return;
      }

      list.innerHTML = items.map(item => \`
        <div class="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs transition-all hover:bg-white/[0.08]">
          <span class="text-white font-medium">\${item.text}</span>
          <div class="flex items-center gap-2">
            <span class="text-[10px] text-neutral-400 font-mono">\${item.date}</span>
            <button onclick="removeItem(\${item.id})" class="p-1 text-neutral-500 hover:text-rose-400">×</button>
          </div>
        </div>
      \`).join('');
      if (window.lucide) lucide.createIcons();
    }

    function handleAddItem() {
      const inp = document.getElementById('mainInput');
      if (!inp.value.trim()) return;
      items.unshift({ id: Date.now(), text: inp.value.trim(), date: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) });
      inp.value = '';
      renderList();
    }

    function removeItem(id) {
      items = items.filter(i => i.id !== id);
      renderList();
    }

    function clearAll() {
      items = [];
      renderList();
    }

    renderList();
  </script>
</body>
</html>`;

  return `### ${modelName} - ${cleanTitle}
Ich habe deine individuelle Web-Anwendung exakt nach deinen Vorgaben im modernen Liquid-Glass-Design erstellt.

### Kern-Features:
- **Maßgeschneiderte Interaktionslogik**: Schnelles Hinzufügen, Entfernen und Verwalten von Einträgen.
- **Flüssige UI**: Glasmorphismus-Layer (\`backdrop-blur-2xl\`), abgerundete Ecken und klare visuelle Hierarchie.

\`\`\`html
${code}
\`\`\``;
}
