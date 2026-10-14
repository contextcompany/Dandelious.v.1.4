const fs = require('fs');
let content = fs.readFileSync('src/components/ChatWindow.tsx', 'utf8');

const targetStr = `                  <button
                    type="button"
                    onClick={() => {
                      playSound("click", soundEnabled);
                      setInputPrompt("Hallo Saphire!");
                      textareaRef.current?.focus();
                    }}
                    className="w-10 h-10 rounded-full hover:bg-[#34407b] text-white flex items-center justify-center transition-all cursor-pointer bg-[#24337b]"
                    title="Voice Modus"
                  >
                    <AudioLines className="w-5 h-5 text-blue-400" />
                  </button>`;

content = content.replace(targetStr, '');
fs.writeFileSync('src/components/ChatWindow.tsx', content);
console.log("Removed voice button.");
