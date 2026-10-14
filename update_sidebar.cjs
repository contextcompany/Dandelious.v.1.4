const fs = require('fs');

let content = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

// The profile block at the bottom
const profileBlockStart = content.indexOf('{/* Footer: User Profile & Settings */}');
const profileBlockEnd = content.indexOf('</div>', profileBlockStart); // wait, it's a bit complex.

// Let's just do a big regex replacement for the sidebar content structure.
const newSidebarContent = `          {/* Full-Height Docked Container */}
          <div className="w-full h-full flex flex-col relative overflow-hidden no-scrollbar bg-black">
            
            {/* Header: Saphire Title & Close X Button */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <h1 className="text-[20px] font-medium text-white">
                Saphire
              </h1>
              <button
                type="button"
                onClick={() => {
                  playSound('click', enableSoundEffects);
                  onToggleOpen();
                }}
                className="w-9 h-9 rounded-full hover:bg-white/10 text-neutral-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                title="Menü schließen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable List container */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-3 space-y-1 pb-24">
              
              {/* Neuer Chat Pill */}
              <div className="py-2">
                <button
                  type="button"
                  data-tour-target="new-chat-button"
                  onClick={() => {
                    playSound('click', enableSoundEffects);
                    onNewChat();
                  }}
                  className="w-full py-3.5 px-5 rounded-full bg-[#1a1a1a] hover:bg-[#252525] text-white font-medium text-[15px] flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <PenSquare className="w-[18px] h-[18px] text-white" />
                  <span>Neuer Chat</span>
                </button>
              </div>

              {/* Chats durchsuchen */}
              <button
                type="button"
                onClick={() => {
                  playSound('click', enableSoundEffects);
                  setShowSearchInput(!showSearchInput);
                }}
                className="w-full py-3 px-3 rounded-2xl bg-transparent hover:bg-white/5 text-neutral-200 hover:text-white text-[15px] flex items-center gap-4 transition-colors cursor-pointer"
              >
                <Search className="w-5 h-5 text-neutral-200" />
                <span>Chats durchsuchen</span>
              </button>
              
              {showSearchInput && (
                <div className="px-3 pt-1 pb-2">
                  <input
                    type="text"
                    placeholder="Suchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[#1a1a1a] text-sm text-white placeholder-neutral-500 rounded-xl px-3.5 py-2 focus:outline-none"
                    autoFocus
                  />
                </div>
              )}

              {/* ARC Chat */}
              <button
                type="button"
                onClick={() => {
                  playSound('click', enableSoundEffects);
                  if (onSelectView) onSelectView('arc');
                }}
                className="w-full py-3 px-3 rounded-2xl bg-transparent hover:bg-white/5 text-neutral-200 hover:text-white text-[15px] flex items-center gap-4 transition-colors cursor-pointer"
              >
                <MessageSquare className="w-5 h-5 text-neutral-200" />
                <span>ARC Chat</span>
              </button>

              {/* Dice */}
              <button
                type="button"
                onClick={() => {
                  playSound('click', enableSoundEffects);
                  if (onSelectView) onSelectView('dice');
                }}
                className="w-full py-3 px-3 rounded-2xl bg-transparent hover:bg-white/5 text-neutral-200 hover:text-white text-[15px] flex items-center gap-4 transition-colors cursor-pointer"
              >
                <Square className="w-5 h-5 text-neutral-200" />
                <span>Dice</span>
              </button>

              {/* Section Header: Letzte */}
              <div className="pt-6 pb-2 px-3">
                <span className="text-[13px] font-medium text-neutral-500">Letzte</span>
              </div>

              {/* Chats List */}
              <div className="space-y-0.5">
                {isSelectionMode && (
                  <div className="flex items-center justify-between px-3 py-2 bg-blue-500/10 rounded-xl mb-2 border border-blue-500/20">
                    <span className="text-xs font-medium text-blue-400">{selectedSessionIds.length} ausgewählt</span>
                    <div className="flex items-center gap-2">
                      <button onClick={handleSelectAll} className="text-xs text-blue-400 hover:text-blue-300">Alle</button>
                      <button onClick={handleDeleteSelected} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"><Trash2 className="w-3 h-3"/> Löschen</button>
                      <button onClick={() => { setIsSelectionMode(false); setSelectedSessionIds([]); }} className="text-xs text-neutral-400 hover:text-neutral-300">Abbrechen</button>
                    </div>
                  </div>
                )}
                
                {filteredSessions.length === 0 ? (
                  <div className="text-center py-6 text-sm text-neutral-500">
                    Keine Chats gefunden.
                  </div>
                ) : (
                  <>
                    {heute.length > 0 && heute.map(renderChatItem)}
                    {gestern.length > 0 && gestern.map(renderChatItem)}
                    {dreissigTage.length > 0 && dreissigTage.map(renderChatItem)}
                  </>
                )}
              </div>
            </div>

            {/* Footer: User Profile & Settings */}
            <div className="absolute bottom-0 left-0 w-full bg-black p-3 shrink-0">
              <div className="flex items-center justify-between px-2 py-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neutral-700 to-neutral-800 flex items-center justify-center text-white font-bold overflow-hidden">
                    {currentUser?.photoURL ? (
                      <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span>{currentUser?.displayName?.charAt(0) || 'V'}</span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[15px] font-medium text-neutral-200 leading-tight">
                      {currentUser?.displayName || 'Vincent Bschor'}
                    </span>
                    <span className="text-[11px] text-neutral-500 tracking-wide uppercase font-semibold">
                      Plus
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playSound('click', enableSoundEffects);
                    onOpenSettings();
                  }}
                  className="w-10 h-10 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="Einstellungen"
                >
                  <Settings className="w-[22px] h-[22px]" />
                </button>
              </div>
            </div>
          </div>`;

// Replace everything between {/* Full-Height Docked Container */} and {/* Resizable Sidebar Right Handle */}
const startMarker = '{/* Full-Height Docked Container */}';
const endMarker = '{/* Resizable Sidebar Right Handle */}';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + newSidebarContent + "\n          " + content.substring(endIndex);
  fs.writeFileSync('src/components/Sidebar.tsx', content);
  console.log("Updated Sidebar.tsx");
} else {
  console.log("Could not find markers in Sidebar.tsx");
}

