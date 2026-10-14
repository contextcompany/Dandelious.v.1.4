const fs = require('fs');
const content = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

const targetStr = `{/* Section Header: Letzte (matching Bild 3) */}`;
const replaceStr = `
              {/* Added Modules */}
              <div className="space-y-1 pb-3">
                <button
                  type="button"
                  onClick={() => {
                    playSound('click', enableSoundEffects);
                    if (onSelectView) onSelectView('arc');
                  }}
                  className="w-full py-2.5 px-4 rounded-2xl bg-transparent hover:bg-white/5 text-neutral-300 hover:text-white text-sm flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-neutral-400" />
                  <span className="text-[14px]">ARC Chat</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playSound('click', enableSoundEffects);
                    if (onSelectView) onSelectView('dice');
                  }}
                  className="w-full py-2.5 px-4 rounded-2xl bg-transparent hover:bg-white/5 text-neutral-300 hover:text-white text-sm flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <Square className="w-4 h-4 text-neutral-400" />
                  <span className="text-[14px]">Dice</span>
                </button>
              </div>

              {/* Section Header: Letzte (matching Bild 3) */}`;

const newContent = content.replace(targetStr, replaceStr);
fs.writeFileSync('src/components/Sidebar.tsx', newContent);
console.log("Replaced sidebar!");
