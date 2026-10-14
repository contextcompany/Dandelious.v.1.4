const fs = require('fs');

let content = fs.readFileSync('src/components/SettingsModal.tsx', 'utf8');

// The main goal is to properly clean up the renderContent block.
const startMarker = 'const renderContent = () => {';
// The actual end of renderContent is right before the main component return statement:
const endMarker = '  return (\n    <AnimatePresence>';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
    const newRenderContent = `const renderContent = () => {
    if (activeSubPage === 'allgemein') {
      return (
        <div className="p-4 space-y-4">
          <h3 className="text-lg font-medium text-white mb-2">Allgemein & KI</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Saphire API-Schlüssel</label>
              <input 
                type="password"
                placeholder="sk-..."
                value={localSettings.apiKey || ''}
                onChange={(e) => setLocalSettings({...localSettings, apiKey: e.target.value})}
                className="w-full bg-[#121212] border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
              <p className="text-xs text-neutral-400">Wird benötigt, um Anfragen an das KI-Modell zu senden.</p>
            </div>

            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl mt-4">
              <span className="text-white text-sm">Automatischer Spell-Check</span>
              <button 
                onClick={() => setLocalSettings({...localSettings, autoSpellCheck: !localSettings.autoSpellCheck})}
                className={\`w-11 h-6 rounded-full transition-colors relative \${localSettings.autoSpellCheck ? 'bg-blue-500' : 'bg-neutral-600'}\`}
              >
                <div className={\`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform \${localSettings.autoSpellCheck ? 'translate-x-5' : 'translate-x-0.5'}\`} />
              </button>
            </div>
          </div>
          
          <button onClick={handleSave} className="w-full py-3 mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors">
            Speichern
          </button>
        </div>
      );
    }
    
    if (activeSubPage === 'abo') {
      return (
        <div className="p-4 space-y-4">
          <h3 className="text-lg font-medium text-white mb-2">Abo & Zugriffsrechte</h3>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Aktueller Tarif</label>
            <div className="grid grid-cols-2 gap-2">
              {['Kostenlos', 'Plus', 'Pro', 'Extreme'].map((tier) => (
                <div key={tier} className={\`p-3 rounded-xl border text-center cursor-pointer transition-all \${tier === 'Plus' ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10'}\`}>
                  <span className="text-sm font-medium">{tier}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 mt-6">
            <label className="text-sm font-medium text-white">Access Card einlösen</label>
            <div className="flex gap-2">
              <input 
                type="text"
                placeholder="XXXX-XXXX-XXXX-XXXX"
                className="flex-1 bg-[#121212] border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-blue-500 uppercase tracking-widest"
              />
              <button className="px-4 bg-white hover:bg-neutral-200 text-black font-medium rounded-xl text-sm transition-colors">
                Einlösen
              </button>
            </div>
            <p className="text-xs text-neutral-400">Gib deinen Access Card Code ein, um dein Abo upzugraden.</p>
          </div>
        </div>
      );
    }

    if (activeSubPage === 'plugins') {
      return (
        <div className="p-4">
          <h3 className="text-lg font-medium text-white mb-4">Plugins</h3>
          <p className="text-sm text-neutral-400">Hier können in Zukunft Plugins und Integrationen verwaltet werden.</p>
        </div>
      );
    }
    
    if (activeSubPage === 'sicherheit') {
      return (
        <div className="p-4">
          <h3 className="text-lg font-medium text-white mb-4">Sicherheit & Datenschutz</h3>
          <p className="text-sm text-neutral-400">Deine Daten werden sicher verwahrt.</p>
        </div>
      );
    }
    
    if (activeSubPage === 'ueber') {
      return (
        <div className="p-4 space-y-4">
          <div className="flex justify-center mb-6 mt-4">
            <div className="w-20 h-20 bg-gradient-to-br from-neutral-700 to-neutral-900 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">S</span>
            </div>
          </div>
          <h3 className="text-xl font-medium text-white text-center">Saphire AI</h3>
          <p className="text-sm text-neutral-400 text-center leading-relaxed">
            Ein Produkt der Context Design Company.<br/>
            Besuche uns auf <a href="https://context.ai.studio/" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">context.ai.studio</a>
          </p>
        </div>
      );
    }

    // Default main menu
    return (
      <div className="px-4 space-y-2 pb-6">
        {/* User Profile Block */}
        <div className="bg-[#121212] rounded-3xl p-4 flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neutral-700 to-neutral-900 flex items-center justify-center text-white text-lg font-bold overflow-hidden">
              {currentUser?.photoURL ? (
                <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span>{currentUser?.displayName?.charAt(0) || 'V'}</span>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#2c2c2c] border border-[#1e1e1e] rounded-full flex items-center justify-center">
              <Edit2 className="w-2.5 h-2.5 text-neutral-300" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-medium text-white truncate">
              {currentUser?.displayName || 'Vincent Bschor'}
            </h3>
            <p className="text-sm text-neutral-400 truncate">
              {currentUser?.email || 'v.bschor@gmail.com'}
            </p>
            <div className="mt-1">
              <span className="text-[10px] uppercase font-semibold tracking-wide px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">
                Plus
              </span>
            </div>
          </div>
        </div>

        {/* Abo & Pro */}
        <div className="bg-[#121212] rounded-3xl overflow-hidden mt-2">
          <button onClick={() => setActiveSubPage('abo')} className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors text-left border-b border-white/5">
            <Zap className="w-5 h-5 text-neutral-400" />
            <span className="text-sm font-medium text-white flex-1">Abo verwalten</span>
            <span className="text-[10px] font-mono tracking-wider px-2 py-0.5 rounded bg-white/10 text-neutral-300 uppercase">PLUS</span>
          </button>
        </div>

        {/* General Settings */}
        <div className="bg-[#121212] rounded-3xl overflow-hidden mt-2">
          <button onClick={() => setActiveSubPage('allgemein')} className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors text-left border-b border-white/5">
            <Globe className="w-5 h-5 text-neutral-400" />
            <span className="text-sm font-medium text-white flex-1">Allgemein & KI</span>
          </button>
          <button onClick={() => setActiveSubPage('plugins')} className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors text-left border-b border-white/5">
            <Layers className="w-5 h-5 text-neutral-400" />
            <span className="text-sm font-medium text-white flex-1">Plugins & Werkzeuge</span>
          </button>
          <button onClick={() => setActiveSubPage('sicherheit')} className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors text-left border-b border-white/5">
            <Shield className="w-5 h-5 text-neutral-400" />
            <span className="text-sm font-medium text-white flex-1">Sicherheit & Datenschutz</span>
          </button>
          <button onClick={() => setActiveSubPage('ueber')} className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors text-left">
            <Info className="w-5 h-5 text-neutral-400" />
            <span className="text-sm font-medium text-white flex-1">Über Saphire</span>
          </button>
        </div>
      </div>
    );
  };

`;
    
    content = content.substring(0, startIndex) + newRenderContent + content.substring(endIndex);
    fs.writeFileSync('src/components/SettingsModal.tsx', content);
    console.log("Fixed SettingsModal.tsx");
} else {
    console.log("Could not find boundaries");
}
