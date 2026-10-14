const fs = require('fs');

let content = fs.readFileSync('src/components/SettingsModal.tsx', 'utf8');

// 1. Add 'instruction' to SubPage
content = content.replace(/\| 'personalisierung'/, "| 'personalisierung'\n  | 'instruction'");

// 2. Fix activeSubPage === 'allgemein' -> 'engine'
content = content.replace(/activeSubPage === 'allgemein' \|\| activeSubPage === 'api' \|\| activeSubPage === 'engine'/, "activeSubPage === 'engine' || activeSubPage === 'api' || activeSubPage === 'allgemein'");

// 3. Separate Engine and Instruction in the view
// First, let's find the Engine Parameters block and extract it into a new subpage block.
const engineBlockRegex = /\{\/\* Engine Parameters \*\/\}(.|\n)*?<\/div>\n\s*<\/div>/;
const engineMatch = content.match(engineBlockRegex);
if (engineMatch) {
  content = content.replace(engineBlockRegex, ''); // Remove it from 'engine'
  
  const instructionView = `
    // =========================================================================
    // SYSTEM-INSTRUKTION
    // =========================================================================
    if (activeSubPage === 'instruction') {
      return (
        <div className="p-4 sm:p-6 space-y-6 font-['Plus_Jakarta_Sans'] text-neutral-100">
          <div className="space-y-1">
            <h3 className="text-xl font-normal text-white tracking-tight">
              System-Instruktion
            </h3>
            <p className="text-xs text-neutral-400">
              Passe das Grundverhalten und den Charakter von Saphire an.
            </p>
          </div>
          ${engineMatch[0]}
        </div>
      );
    }
  `;
  // Insert instructionView before "SPRACH- & AUDIOEINSTELLUNGEN"
  content = content.replace(/\/\/ =========================================================================\n\s*\/\/ SPRACH- & AUDIOEINSTELLUNGEN/, instructionView + '\n    // =========================================================================\n    // SPRACH- & AUDIOEINSTELLUNGEN');
}

// 4. Update the KI-Engine button and add Instruction button
const engineButton = `
          {/* Allgemein & KI Engine */}
          <motion.button
            whileHover={{ x: 3 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setActiveSubPage('allgemein')}
            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[#1a1a1a] transition-colors text-left border-b border-[#222222] cursor-pointer"
          >
            <Globe className="w-[22px] h-[22px] text-neutral-200 stroke-[1.8] shrink-0" />
            <span className="text-[15px] font-medium text-white">KI-Engine & System-Instruktion</span>
          </motion.button>
`;
const newButtons = `
          {/* KI-Engine */}
          <motion.button
            whileHover={{ x: 3 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setActiveSubPage('engine')}
            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[#1a1a1a] transition-colors text-left border-b border-[#222222] cursor-pointer"
          >
            <Globe className="w-[22px] h-[22px] text-neutral-200 stroke-[1.8] shrink-0" />
            <span className="text-[15px] font-medium text-white">KI-Engine (API-Key)</span>
          </motion.button>

          {/* System-Instruktion */}
          <motion.button
            whileHover={{ x: 3 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setActiveSubPage('instruction')}
            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[#1a1a1a] transition-colors text-left border-b border-[#222222] cursor-pointer"
          >
            <Edit2 className="w-[22px] h-[22px] text-neutral-200 stroke-[1.8] shrink-0" />
            <span className="text-[15px] font-medium text-white">System-Instruktion</span>
          </motion.button>
`;
content = content.replace(engineButton.trim(), newButtons.trim());

// 5. Update Import text logic
content = content.replace(
`                  onClick={() => {
                    if (!newDocContent) return;
                    setKnowledgeDocs(prev => [...prev, { id: Date.now(), title: 'Importierte Information', rawContent: newDocContent }]);
                    setNewDocContent('');
                    playSound('chime', localSettings.enableSoundEffects ?? true);
                    alert("Information erfolgreich hinzugefügt!");
                  }}`,
`                  onClick={() => {
                    if (!newDocContent) return;
                    
                    // Speichere in echten Erinnerungen (Memory Graph)
                    addOrUpdateMemoryTopic('Importierte Information ' + new Date().toLocaleTimeString(), newDocContent);
                    
                    setKnowledgeDocs(prev => [...prev, { id: Date.now(), title: 'Importierte Information', rawContent: newDocContent }]);
                    setNewDocContent('');
                    playSound('chime', localSettings.enableSoundEffects ?? true);
                    alert("Information erfolgreich zu Erinnerungen hinzugefügt!");
                  }}`
);

// 6. Fix Export & Delete Data
const oldDataVerwalten = `             <div className="flex items-center gap-3 pt-2">
               <button className="px-4 py-2 bg-white text-black hover:bg-neutral-200 rounded-xl text-xs font-bold transition-all shadow-sm">
                 Daten exportieren
               </button>
               <button className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl text-xs font-bold transition-all">
                 Alle Daten löschen
               </button>
             </div>`;
const newDataVerwalten = `             <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
               <button 
                 onClick={() => {
                   const data = JSON.stringify({
                     memories: loadMemoryTopics(),
                     settings: localSettings,
                     activities: []
                   });
                   const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(data);
                   const downloadAnchorNode = document.createElement('a');
                   downloadAnchorNode.setAttribute("href", dataStr);
                   downloadAnchorNode.setAttribute("download", "saphire_export.json");
                   document.body.appendChild(downloadAnchorNode);
                   downloadAnchorNode.click();
                   downloadAnchorNode.remove();
                   playSound('chime', localSettings.enableSoundEffects ?? true);
                 }}
                 className="w-full sm:w-auto px-4 py-2 bg-white text-black hover:bg-neutral-200 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
               >
                 Daten exportieren
               </button>
               <button 
                 onClick={() => {
                   if (window.confirm("Bist du sicher, dass du alle lokalen Daten und Erinnerungen unwiderruflich löschen möchtest?")) {
                     localStorage.clear();
                     saveMemoryTopics([]);
                     alert("Alle Daten wurden gelöscht.");
                     window.location.reload();
                   }
                 }}
                 className="w-full sm:w-auto px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl text-xs font-bold transition-all cursor-pointer"
               >
                 Alle Daten löschen
               </button>
             </div>`;
content = content.replace(oldDataVerwalten, newDataVerwalten);

fs.writeFileSync('src/components/SettingsModal.tsx', content);
console.log('Update script completed');
