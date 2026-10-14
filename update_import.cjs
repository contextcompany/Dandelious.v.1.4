const fs = require('fs');
let content = fs.readFileSync('src/components/SettingsModal.tsx', 'utf8');

const oldImportButton = `            <button
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.zip,.json,.txt';
                input.onchange = (e: any) => {
                  if (e.target.files?.[0]) {
                    playSound('chime', localSettings.enableSoundEffects ?? true);
                    alert(\`Datei "\${e.target.files[0].name}" erfolgreich importiert!\`);
                  }
                };
                input.click();
              }}
              className="px-4 py-2 bg-[#222222] hover:bg-[#38383c] text-white rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer border border-white/10"
            >`;

const newImportButton = `            <button
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json,.txt';
                input.onchange = (e: any) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const text = event.target?.result as string;
                      addOrUpdateMemoryTopic('Import: ' + file.name, text);
                      playSound('chime', localSettings.enableSoundEffects ?? true);
                      alert(\`Datei "\${file.name}" erfolgreich importiert und zu deinen Erinnerungen hinzugefügt!\`);
                    };
                    reader.readAsText(file);
                  }
                };
                input.click();
              }}
              className="px-4 py-2 bg-[#222222] hover:bg-[#38383c] text-white rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer border border-white/10"
            >`;

content = content.replace(oldImportButton, newImportButton);
fs.writeFileSync('src/components/SettingsModal.tsx', content);
console.log('Done import update');
