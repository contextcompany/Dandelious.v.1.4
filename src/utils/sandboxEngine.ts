/**
 * Universal High-Stability Sandbox Engine v3.5 (Dice Sandbox Kernel)
 * Transforms generated HTML, JavaScript, React/JSX/TSX, or SVG code into a rock-solid,
 * fully isolated interactive iframe environment with error catching, console interception,
 * top-level navigation shields, Tailwind CSS, React 18, Babel runtime, Lucide icons, Chart.js, and Confetti.
 */

function extractLucideIcons(codeStr: string): string[] {
  const icons = new Set<string>([
    'Search', 'Plus', 'Minus', 'X', 'Check', 'CheckCircle', 'CheckCircle2', 'AlertCircle', 
    'Trash', 'Trash2', 'Edit', 'Edit2', 'Settings', 'User', 'Users', 'Home', 'Mail', 
    'Phone', 'Calendar', 'Clock', 'Star', 'Heart', 'Share', 'Download', 'Upload', 
    'Filter', 'Layers', 'Layout', 'Eye', 'EyeOff', 'Lock', 'Unlock', 'Key', 'RefreshCw', 
    'RotateCw', 'RotateCcw', 'ChevronDown', 'ChevronUp', 'ChevronLeft', 'ChevronRight', 
    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Play', 'Pause', 'Volume2', 
    'VolumeX', 'Sparkles', 'Wand2', 'Terminal', 'FileCode', 'Code', 'Code2', 'Monitor', 
    'Tablet', 'Smartphone', 'Send', 'Copy', 'Maximize2', 'Minimize2', 'BarChart', 
    'LineChart', 'PieChart', 'Activity', 'Zap', 'Cpu', 'Globe', 'ExternalLink', 'Menu', 
    'Grid', 'List', 'Folder', 'File', 'Image', 'Database', 'Server', 'Shield', 'Info',
    'Sun', 'Moon', 'CreditCard', 'BookOpen', 'Sliders', 'Wrench', 'Lightbulb', 'MessageSquare'
  ]);

  const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"]/gi;
  let match;
  while ((match = importRegex.exec(codeStr)) !== null) {
    if (match[1]) {
      match[1].split(',').forEach(s => {
        const cleaned = s.trim().split(/\s+as\s+/)[0].trim();
        if (cleaned && /^[A-Z][a-zA-Z0-9_]*$/.test(cleaned)) {
          icons.add(cleaned);
        }
      });
    }
  }

  return Array.from(icons);
}

function pascalToKebab(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

export function buildUniversalSandboxSrcDoc(rawCode: string, language: string = 'html'): string {
  const code = (rawCode || '').trim();

  // 1. SVG rendering
  if (language === 'svg' || (code.startsWith('<svg') && code.endsWith('</svg>'))) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background-color: #050508; overflow: hidden; }
    svg { max-width: 90vw; max-height: 90vh; height: auto; }
  </style>
</head>
<body>${code}</body>
</html>`;
  }

  // Ultra-strict Console capture, Navigation Shield, Universal Interaction Bridge & Error Defense Script
  const consoleAndErrorShield = `
    <script>
      (function() {
        // 1. Shield top-level navigation hijacks: lock window.top and window.parent to self
        try {
          Object.defineProperty(window, 'top', { get: function() { return window; } });
          Object.defineProperty(window, 'parent', { get: function() { return window; } });
        } catch(e) {}

        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;

        function sendToParent(type, args) {
          try {
            window.parent.postMessage({
              source: 'dice-iframe-console',
              type: type,
              message: Array.from(args).map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '),
              timestamp: Date.now()
            }, '*');
          } catch(e){}
        }

        console.log = function() { sendToParent('log', arguments); originalLog.apply(console, arguments); };
        console.error = function() { sendToParent('error', arguments); originalError.apply(console, arguments); };
        console.warn = function() { sendToParent('warn', arguments); originalWarn.apply(console, arguments); };

        window.onerror = function(msg, url, lineNo, columnNo, error) {
          sendToParent('error', ['[Laufzeitfehler]', msg, 'Zeile: ' + lineNo]);
          const errDiv = document.getElementById('dice-runtime-error-banner');
          if (errDiv) {
            errDiv.style.display = 'flex';
            errDiv.innerHTML = '<span>Laufzeitfehler: ' + String(msg).replace(/</g, '&lt;') + '</span><span style="font-size:10px;opacity:0.8;">Zeile ' + lineNo + '</span>';
          }
          return true;
        };

        window.onunhandledrejection = function(e) {
          const reason = e.reason ? (e.reason.message || e.reason) : 'Unhandled Rejection';
          sendToParent('error', ['[Promise Rejection]', reason]);
        };

        // 2. Beautiful In-App Alert & Toast System (Never blocks or crashes in iframe)
        let audioCtx = null;
        function playHapticSound(type) {
          try {
            if (!audioCtx || audioCtx.state === 'closed') {
              const AudioContextClass = window.AudioContext || window.webkitAudioContext;
              if (AudioContextClass) {
                try {
                  audioCtx = new AudioContextClass();
                } catch {
                  audioCtx = null;
                }
              }
            }
            if (!audioCtx || audioCtx.state === 'closed') return;
            if (audioCtx.state === 'suspended') {
              audioCtx.resume().catch(function() {});
            }
            const now = audioCtx.currentTime;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            if (type === 'buy' || type === 'success') {
              osc.type = 'sine';
              osc.frequency.setValueAtTime(587.33, now); // D5
              osc.frequency.exponentialRampToValueAtTime(880, now + 0.08); // A5
              gain.gain.setValueAtTime(0.08, now);
              gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
              osc.start(now);
              osc.stop(now + 0.16);
            } else {
              osc.type = 'sine';
              osc.frequency.setValueAtTime(440, now);
              gain.gain.setValueAtTime(0.05, now);
              gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
              osc.start(now);
              osc.stop(now + 0.05);
            }
          } catch(e){}
        }

        window.showToast = function(text, iconName) {
          let container = document.getElementById('dice-toast-container');
          if (!container) {
            container = document.createElement('div');
            container.id = 'dice-toast-container';
            container.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:999999;display:flex;flex-direction:column;align-items:center;gap:8px;pointer-events:none;';
            document.body.appendChild(container);
          }

          const toast = document.createElement('div');
          toast.style.cssText = 'background:rgba(12,14,20,0.92);color:#ffffff;padding:10px 18px;border-radius:9999px;font-family:system-ui,-apple-system,sans-serif;font-size:13px;font-weight:600;border:1px solid rgba(255,255,255,0.2);box-shadow:0 16px 40px rgba(0,0,0,0.8),0 0 20px rgba(255,255,255,0.1);backdrop-filter:blur(16px);display:flex;align-items:center;gap:8px;pointer-events:auto;transition:all 0.3s cubic-bezier(0.16,1,0.3,1);opacity:0;transform:translateY(12px) scale(0.95);';
          toast.innerHTML = (iconName ? '<span style="font-size:14px;">' + iconName + '</span>' : '') + '<span>' + text + '</span>';
          container.appendChild(toast);

          requestAnimationFrame(function() {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0) scale(1)';
          });

          setTimeout(function() {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(8px) scale(0.95)';
            setTimeout(function() { toast.remove(); }, 300);
          }, 2400);
        };

        // In-App Alert Replacement
        window.alert = function(msg) {
          console.log('[Dice Alert]:', msg);
          const modal = document.createElement('div');
          modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);backdrop-filter:blur(12px);z-index:9999999;display:flex;align-items:center;justify-content:center;padding:16px;animation:diceFadeIn 0.2s ease-out;';
          modal.innerHTML = \`
            <div style="background:#0c0d12;border:1px solid rgba(255,255,255,0.18);border-radius:24px;padding:24px;max-width:380px;width:100%;box-shadow:0 25px 60px rgba(0,0,0,0.9);text-align:center;color:#fff;font-family:system-ui,-apple-system,sans-serif;">
              <div style="width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;margin:0 auto 16px auto;border:1px solid rgba(255,255,255,0.15);">
                <i data-lucide="bell" style="width:20px;height:20px;color:#fff;"></i>
              </div>
              <h3 style="font-size:15px;font-weight:700;margin:0 0 8px 0;">Mitteilung</h3>
              <p style="font-size:13px;color:#9ca3af;margin:0 0 20px 0;line-height:1.5;">\${String(msg).replace(/</g, '&lt;')}</p>
              <button id="dice-alert-ok-btn" style="width:100%;padding:12px;border-radius:14px;background:#ffffff;color:#000000;font-weight:700;font-size:13px;border:none;cursor:pointer;transition:transform 0.1s;" onmousedown="this.style.transform='scale(0.97)'" onmouseup="this.style.transform='scale(1)'">Verstanden</button>
            </div>
          \`;
          document.body.appendChild(modal);
          if (window.lucide) try { window.lucide.createIcons(); } catch(e){}
          modal.querySelector('#dice-alert-ok-btn').onclick = function() {
            modal.remove();
          };
          modal.onclick = function(e) {
            if (e.target === modal) modal.remove();
          };
        };

        // 3. Intercept native programmatic form.submit()
        if (typeof HTMLFormElement !== 'undefined') {
          HTMLFormElement.prototype.submit = function() {
            console.log('[Dice Studio] Formularübermittlung abgefangen (Navigation verhindert).');
            const event = new Event('submit', { bubbles: true, cancelable: true });
            this.dispatchEvent(event);
          };
        }

        // 4. CAPTURE PHASE EVENT LISTENERS: Prevent outer top-level page navigation without blocking local JS events
        document.addEventListener('submit', function(e) {
          e.preventDefault();
          console.log('[Dice Studio] Formular-Absendung lokal verarbeitet.');
        }, false);

        document.addEventListener('click', function(e) {
          const a = e.target && e.target.closest ? e.target.closest('a') : null;
          if (a) {
            const href = a.getAttribute('href');
            // Prevent top-level external navigation while allowing local # links or JS clicks
            if (href && (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//'))) {
              e.preventDefault();
              console.log('[Dice Studio] Externe Navigation verhindert:', href);
            }
          }
        }, false);

        // Lock window unload navigation
        try {
          window.onbeforeunload = function() { return false; };
        } catch(e){}

        // 5. UNIVERSAL INTERACTION & STATE ENGINE (Guarantees every Button, Tab, Cart, and Counter works seamlessly)
        let totalCartCount = 0;

        function attachSmartButtonListeners() {
          // A) Universal Category Tab / Filter Pills switcher
          const allButtons = Array.from(document.querySelectorAll('button, [role="button"], [role="tab"], .tab-btn, .cat-btn'));
          
          // Identify button pill groups
          allButtons.forEach(function(btn) {
            if (btn.hasAttribute('data-dice-bound')) return;
            btn.setAttribute('data-dice-bound', 'true');

            btn.addEventListener('click', function(e) {
              playHapticSound('click');
              const text = (btn.innerText || '').trim();
              const lowerText = text.toLowerCase();

              // 1. Is this a Category / Filter Tab?
              const isTabLike = btn.getAttribute('role') === 'tab' || 
                                btn.classList.contains('cat-btn') || 
                                btn.classList.contains('tab-btn') || 
                                btn.parentElement.classList.contains('filter-bar') ||
                                (btn.parentElement && Array.from(btn.parentElement.children).filter(c => c.tagName === 'BUTTON').length >= 3);

              if (isTabLike && !lowerText.includes('kauf') && !lowerText.includes('cart') && !lowerText.includes('warenkorb') && !lowerText.includes('neu') && !lowerText.includes('export')) {
                const siblings = Array.from(btn.parentElement.children).filter(c => c.tagName === 'BUTTON' || c.getAttribute('role') === 'button');
                if (siblings.length >= 2) {
                  // Find what styling was active on previous active button
                  siblings.forEach(s => {
                    s.classList.remove('bg-white', 'text-black', 'bg-pink-600', 'bg-cyan-500', 'bg-lime-600', 'bg-blue-600', 'shadow-md', 'shadow-lg');
                    if (!s.className.includes('bg-white/')) {
                      s.classList.add('bg-white/5', 'text-neutral-300', 'text-neutral-400');
                    }
                  });
                  // Activate clicked tab
                  btn.classList.remove('bg-white/5', 'bg-white/10', 'text-neutral-300', 'text-neutral-400');
                  btn.classList.add('bg-white', 'text-black', 'font-semibold', 'shadow-md');

                  // Filter visible cards/products on page
                  const cards = Array.from(document.querySelectorAll('.product-card, [data-category], .group.rounded-2xl, .grid > div'));
                  if (cards.length > 0) {
                    const filterTerm = lowerText.replace(/alle\s*sorten|alle|all/g, '').trim();
                    cards.forEach(card => {
                      if (!filterTerm || filterTerm.length === 0) {
                        card.style.display = '';
                      } else {
                        const cardText = (card.innerText || '').toLowerCase();
                        const cardCat = (card.getAttribute('data-category') || '').toLowerCase();
                        if (cardText.includes(filterTerm) || cardCat.includes(filterTerm)) {
                          card.style.display = '';
                        } else {
                          card.style.display = 'none';
                        }
                      }
                    });
                  }
                }
              }

              // 2. Is this an "In den Warenkorb" / "Kaufen" / "Add to Cart" button?
              if (lowerText.includes('warenkorb') || lowerText.includes('kaufen') || lowerText.includes('add to cart') || lowerText.includes('bestell') || lowerText.includes('buy') || (btn.querySelector('[data-lucide="shopping-bag"]') || btn.querySelector('[data-lucide="shopping-cart"]')) && !lowerText.includes('0')) {
                playHapticSound('buy');
                totalCartCount++;
                
                // Find or update cart count badges on page
                const badges = document.querySelectorAll('#cartCount, #cartBadge, #cartCountBadge, .cart-count, [data-cart-count]');
                badges.forEach(b => {
                  b.innerText = String(totalCartCount);
                  b.classList.remove('hidden');
                  b.style.transform = 'scale(1.3)';
                  setTimeout(() => { b.style.transform = 'scale(1)'; }, 200);
                });

                // Extract product title if inside a card
                let prodTitle = 'Artikel';
                const card = btn.closest('.product-card, .rounded-2xl, .p-4, .p-5, .p-6');
                if (card) {
                  const h = card.querySelector('h2, h3, h4, .font-bold, .title');
                  if (h) prodTitle = h.innerText.trim();
                }

                window.showToast('✨ ' + prodTitle + ' in den Warenkorb gelegt!', '🛒');
              }

              // 3. Is this a Cart Drawer / Modal Opener?
              if ((btn.id && btn.id.toLowerCase().includes('cart')) || btn.classList.contains('cart-toggle') || (btn.querySelector('[data-lucide="shopping-cart"]') && !lowerText.includes('kauf'))) {
                const drawer = document.getElementById('cartDrawer') || document.getElementById('cartModal') || document.querySelector('[data-modal="cart"]');
                if (drawer) {
                  drawer.classList.toggle('hidden');
                  if (!drawer.classList.contains('hidden')) {
                    drawer.style.display = 'flex';
                  } else {
                    drawer.style.display = 'none';
                  }
                }
              }

              // 4. Is this a Close button?
              if (btn.classList.contains('close-btn') || btn.querySelector('[data-lucide="x"]') || lowerText === 'x' || lowerText === 'schließen') {
                const modal = btn.closest('#cartDrawer, #cartModal, .fixed, [role="dialog"]');
                if (modal && modal !== document.body) {
                  modal.classList.add('hidden');
                  modal.style.display = 'none';
                }
              }

              // 5. Quantity Stepper (+ / -)
              if (text === '+' || text === '−' || text === '-') {
                const parent = btn.parentElement;
                if (parent) {
                  const numEl = parent.querySelector('span, input, .qty-val');
                  if (numEl) {
                    let currentVal = parseInt(numEl.value || numEl.innerText || '1', 10);
                    if (isNaN(currentVal)) currentVal = 1;
                    if (text === '+') currentVal++;
                    else if (currentVal > 1) currentVal--;
                    if (numEl.tagName === 'INPUT') numEl.value = currentVal;
                    else numEl.innerText = currentVal;
                  }
                }
              }

              // 6. Favorite / Heart Icon Toggle
              const heart = btn.querySelector('[data-lucide="heart"]');
              if (heart) {
                const isLiked = heart.classList.contains('text-rose-500') || heart.classList.contains('fill-rose-500');
                if (isLiked) {
                  heart.classList.remove('text-rose-500', 'fill-rose-500');
                  heart.classList.add('text-neutral-400');
                } else {
                  heart.classList.add('text-rose-500', 'fill-rose-500');
                  heart.classList.remove('text-neutral-400');
                  window.showToast('Zu Favoriten hinzugefügt', '❤️');
                }
              }
            });
          });

          // B) Search Bar Live Auto-Filter
          const searchInputs = document.querySelectorAll('input[type="text"], input[type="search"], #searchInput, #storeSearch, .search-input');
          searchInputs.forEach(input => {
            if (input.hasAttribute('data-dice-search-bound')) return;
            input.setAttribute('data-dice-search-bound', 'true');
            input.addEventListener('input', function() {
              const q = (input.value || '').toLowerCase().trim();
              const cards = Array.from(document.querySelectorAll('.product-card, .group.rounded-2xl, .grid > div'));
              cards.forEach(card => {
                if (!q) {
                  card.style.display = '';
                } else {
                  const cText = (card.innerText || '').toLowerCase();
                  if (cText.includes(q)) {
                    card.style.display = '';
                  } else {
                    card.style.display = 'none';
                  }
                }
              });
            });
          });
        }

        // Run scanner on load and dynamically
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', attachSmartButtonListeners);
        } else {
          attachSmartButtonListeners();
        }
        setInterval(attachSmartButtonListeners, 500);

        // Periodic scanner to initialize Lucide icons rendered dynamically in HTML
        setInterval(function() {
          if (window.lucide && document.querySelector('[data-lucide]:not([data-lucide-init])')) {
            document.querySelectorAll('[data-lucide]:not([data-lucide-init])').forEach(function(el) {
              el.setAttribute('data-lucide-init', 'true');
            });
            try { window.lucide.createIcons(); } catch(e){}
          }
        }, 500);
      })();
    </script>
  `;

  const errorBannerHtml = `
    <div id="dice-runtime-error-banner" style="display:none; position:fixed; bottom:12px; left:12px; right:12px; z-index:999999; padding:10px 16px; background:rgba(18,18,20,0.95); color:#fff; font-family:system-ui,-apple-system,sans-serif; font-size:12px; border-radius:12px; backdrop-filter:blur(12px); box-shadow:0 10px 25px rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.2); align-items:center; justify-content:space-between;"></div>
  `;

  // Standard CDN libraries for modern web apps
  const cdnLibraries = `
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>
    <script src="https://unpkg.com/framer-motion@10.16.4/dist/framer-motion.js"></script>
    <script>
      tailwind.config = {
        darkMode: 'class',
        theme: {
          extend: {
            fontFamily: {
              sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
              mono: ['Fira Code', 'monospace'],
            }
          }
        }
      };
    </script>
  `;

  // Detect if code is a React component / JSX / TSX
  const isReactCode = 
    code.includes('import React') ||
    code.includes('useState') ||
    code.includes('React.useState') ||
    code.includes('export default function') ||
    code.includes('export default App') ||
    (code.includes('function App') && code.includes('return')) ||
    (code.includes('const App') && code.includes('return'));

  if (isReactCode) {
    // Extract Lucide icons to define React wrapper components
    const lucideIconNames = extractLucideIcons(code);
    const lucideComponentDefs = lucideIconNames.map(iconName => {
      const kebab = pascalToKebab(iconName);
      return `const ${iconName} = ({ size = 18, className = "", color, ...props }) => <IconFallback name="${kebab}" size={size} className={className} {...props} />;`;
    }).join('\n    ');

    // Sanitize ESM imports and export statements for in-browser Babel execution
    const cleanReactCode = code
      .replace(/import\s+[\s\S]*?\s+from\s+['"][^'"]+['"];?/g, '') // remove ESM imports
      .replace(/export\s+default\s+/g, '') // remove export default
      .replace(/export\s+/g, ''); // remove export

    return `<!DOCTYPE html>
<html lang="de" class="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dice Studio Sandbox</title>
  ${cdnLibraries}
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  ${consoleAndErrorShield}
  <style>
    *, ::before, ::after { box-sizing: border-box; }
    body { background-color: #050508; color: #ffffff; font-family: 'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif; margin: 0; padding: 0; min-height: 100vh; }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 99px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
  </style>
</head>
<body>
  <div id="root"></div>
  ${errorBannerHtml}

  <script type="text/babel">
    const { useState, useEffect, useRef, useMemo, useCallback, useLayoutEffect, createContext, useContext } = React;

    // Helper for Lucide Icons inside React Babel standalone
    const IconFallback = ({ name, size = 18, className = "" }) => {
      const spanRef = useRef(null);
      useEffect(() => {
        if (spanRef.current && window.lucide) {
          spanRef.current.innerHTML = \`<i data-lucide="\${name || 'code'}" class="\${className}" style="width:\${size}px;height:\${size}px;display:inline-block;vertical-align:middle;"></i>\`;
          try { window.lucide.createIcons(); } catch(e){}
        }
      }, [name, className, size]);
      return <span ref={spanRef} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} />;
    };

    // Auto-defined Lucide Icons for Babel standalone scope
    ${lucideComponentDefs}

    // Framer Motion fallbacks
    const motion = typeof window !== 'undefined' && window.FramerMotion ? window.FramerMotion.motion : new Proxy({}, {
      get: (target, prop) => (props) => React.createElement(prop || 'div', props)
    });
    const AnimatePresence = ({ children }) => <>{children}</>;

    ${cleanReactCode}

    // Auto-Mount App with error boundary fallback
    try {
      const TargetComponent = typeof App !== 'undefined' ? App : (typeof MainApp !== 'undefined' ? MainApp : null);
      if (TargetComponent) {
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<TargetComponent />);
      } else {
        document.getElementById('root').innerHTML = '<div style="padding:24px;color:#ffffff;font-family:sans-serif;background:#050508;min-height:100vh;">Keine Haupt-Komponente (App) im Code gefunden.</div>';
      }
    } catch (err) {
      console.error('React Mount Exception:', err);
      document.getElementById('root').innerHTML = '<div style="padding:24px;color:#ffffff;font-family:sans-serif;background:#050508;min-height:100vh;">React Mount Fehler: ' + err.message + '</div>';
    }
  </script>
</body>
</html>`;
  }

  // Standard HTML / JS code
  let fullHtml = code;

  // Ensure CDN libraries are present if missing
  if (!fullHtml.includes('tailwindcss.com') && !fullHtml.includes('<style>')) {
    if (fullHtml.includes('<head>')) {
      fullHtml = fullHtml.replace('<head>', `<head>${cdnLibraries}`);
    } else {
      fullHtml = `${cdnLibraries}${fullHtml}`;
    }
  }

  // Inject console interceptor, Lucide initializer, and error banner
  if (fullHtml.includes('<head>')) {
    fullHtml = fullHtml.replace('<head>', `<head>${consoleAndErrorShield}`);
  } else if (fullHtml.includes('<html')) {
    fullHtml = fullHtml.replace('<html', `<html${consoleAndErrorShield}`);
  } else {
    fullHtml = `<!DOCTYPE html>
<html lang="de" class="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${cdnLibraries}
  ${consoleAndErrorShield}
  <style>
    *, ::before, ::after { box-sizing: border-box; }
    body { background-color: #050508; color: #ffffff; font-family: 'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif; padding: 16px; margin: 0; min-height: 100vh; }
  </style>
</head>
<body>
  ${fullHtml}
  ${errorBannerHtml}
  <script>
    if (window.lucide) window.lucide.createIcons();
  </script>
</body>
</html>`;
    return fullHtml;
  }

  if (fullHtml.includes('</body>')) {
    fullHtml = fullHtml.replace('</body>', `${errorBannerHtml}<script>if(window.lucide) window.lucide.createIcons();</script></body>`);
  } else {
    fullHtml += `${errorBannerHtml}<script>if(window.lucide) window.lucide.createIcons();</script>`;
  }

  return fullHtml;
}
