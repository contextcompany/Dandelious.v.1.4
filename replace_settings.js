const fs = require('fs');
const content = fs.readFileSync('src/components/SettingsModal.tsx', 'utf8');

const returnIndex = content.indexOf('  return (\n    <AnimatePresence>');
if (returnIndex === -1) {
  console.log("Could not find return statement");
  process.exit(1);
}

const beforeReturn = content.substring(0, returnIndex);

const newJSX = `  return (
    <AnimatePresence>
      <motion.div
        key="settings-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/60"
        onClick={onClose}
      >
        <motion.div
          key="settings-modal"
          initial={{ opacity: 0, y: 15, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 15, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className="w-full sm:max-w-md h-full sm:h-auto sm:max-h-[90vh] bg-[#1e1e1e] sm:rounded-[28px] flex flex-col text-neutral-100 select-none overflow-y-auto overflow-x-hidden no-scrollbar"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-2 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neutral-700 to-neutral-900 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                {currentUser?.photoURL ? (
                  <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span>{currentUser?.displayName?.charAt(0) || 'V'}</span>
                )}
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">
                  {currentUser?.displayName || 'Vincent Bschor'}
                </h2>
                <p className="text-xs text-neutral-400">
                  {currentUser?.email || 'v.bschor@gmail.com'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-4 pb-6 space-y-4">
            
            {/* Group 1 */}
            <div className="bg-[#121212] rounded-3xl overflow-hidden mt-4">
              <button className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors text-left" onClick={() => onOpenAuth?.()}>
                <User className="w-5 h-5 text-neutral-400" />
                <span className="text-sm font-medium text-white flex-1">Google-Konto verwalten</span>
              </button>
            </div>

            {/* Group 2 */}
            <div className="bg-[#121212] rounded-3xl overflow-hidden">
              <button className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors text-left border-b border-white/5">
                <Zap className="w-5 h-5 text-neutral-400" />
                <span className="text-sm font-medium text-white flex-1">Abo verwalten</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-neutral-300">PLUS</span>
              </button>
              <button className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors text-left">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span className="text-sm font-medium text-white flex-1">Upgrade auf Saphire Pro</span>
              </button>
            </div>

            {/* Group 3 */}
            <div className="bg-[#121212] rounded-3xl overflow-hidden">
              <button className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors text-left border-b border-white/5">
                <RefreshCw className="w-5 h-5 text-neutral-400" />
                <span className="text-sm font-medium text-white flex-1">Nutzungslimits</span>
              </button>
              <button className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors text-left border-b border-white/5">
                <Settings className="w-5 h-5 text-neutral-400" />
                <span className="text-sm font-medium text-white flex-1">Persönlicher Kontext</span>
              </button>
              <button className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors text-left border-b border-white/5">
                <Grid className="w-5 h-5 text-neutral-400" />
                <span className="text-sm font-medium text-white flex-1">Verbundene Apps</span>
              </button>
              <button className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors text-left">
                <Volume2 className="w-5 h-5 text-neutral-400" />
                <span className="text-sm font-medium text-white flex-1">Ton & Benachrichtigungen</span>
              </button>
            </div>
            
            {/* Group 4 */}
            <div className="bg-[#121212] rounded-3xl overflow-hidden">
              <button className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors text-left border-b border-white/5">
                <Cpu className="w-5 h-5 text-neutral-400" />
                <span className="text-sm font-medium text-white flex-1">Engine & Modelle</span>
              </button>
              <button className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors text-left">
                <Download className="w-5 h-5 text-neutral-400" />
                <span className="text-sm font-medium text-white flex-1">Informationen importieren</span>
              </button>
            </div>

            <div className="pt-2 text-center">
              <p className="text-xs text-neutral-500">
                Saphire OS &bull; Datenschutz &bull; Nutzungsbedingungen
              </p>
            </div>

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
`;

fs.writeFileSync('src/components/SettingsModal.tsx', beforeReturn + newJSX);
console.log("Replaced settings UI!");
