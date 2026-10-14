const fs = require('fs');

const content = fs.readFileSync('src/components/PlannerView.tsx', 'utf8');

// We will replace the entire header and overview tab up to the activeTab === 'scans' part.
const parts = content.split('{/* HEADER: Nordlicht Glass Banner */}');
if (parts.length < 2) {
  console.log('Could not find HEADER');
  process.exit(1);
}

const beforeHeader = parts[0];
const afterHeader = parts[1];

const scansTabParts = afterHeader.split("{/* ========================================================================= */}\n      {/* TAGES-VERLAUF / SCANS TABS");
if (scansTabParts.length < 2) {
  console.log('Could not find TAGES-VERLAUF');
  process.exit(1);
}

const afterTabs = scansTabParts[1];

// We also need to add a helper function for the emojis.
// We can add it outside the component.
const emojiHelper = `
function guessEmoji(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('milch') || n.includes('milk')) return '🥛';
  if (n.includes('käse') || n.includes('cheese')) return '🧀';
  if (n.includes('apfel') || n.includes('äpfel') || n.includes('apple')) return '🍎';
  if (n.includes('brot') || n.includes('bread')) return '🍞';
  if (n.includes('ei') || n.includes('eier') || n.includes('egg')) return '🥚';
  if (n.includes('banane') || n.includes('banana')) return '🍌';
  if (n.includes('zwiebel') || n.includes('onion')) return '🧅';
  if (n.includes('kartoffel') || n.includes('potato')) return '🥔';
  if (n.includes('tomate') || n.includes('tomato')) return '🍅';
  if (n.includes('gurke') || n.includes('cucumber')) return '🥒';
  if (n.includes('möhre') || n.includes('karotte') || n.includes('carrot')) return '🥕';
  if (n.includes('nudel') || n.includes('pasta')) return '🍝';
  if (n.includes('reis') || n.includes('rice')) return '🍚';
  if (n.includes('salat') || n.includes('salad')) return '🥗';
  if (n.includes('wasser') || n.includes('water')) return '💧';
  if (n.includes('wurst') || n.includes('sausage')) return '🌭';
  if (n.includes('fleisch') || n.includes('meat')) return '🥩';
  if (n.includes('fisch') || n.includes('fish')) return '🐟';
  if (n.includes('huhn') || n.includes('hähnchen') || n.includes('chicken')) return '🍗';
  if (n.includes('kaffee') || n.includes('coffee')) return '☕';
  if (n.includes('tee') || n.includes('tea')) return '🍵';
  if (n.includes('wein') || n.includes('wine')) return '🍷';
  if (n.includes('bier') || n.includes('beer')) return '🍺';
  if (n.includes('saft') || n.includes('juice')) return '🧃';
  if (n.includes('butter')) return '🧈';
  if (n.includes('schokolade') || n.includes('chocolate')) return '🍫';
  if (n.includes('eis') || n.includes('ice')) return '🍦';
  return '📦';
}
`;

const newHeader = `
      {/* HEADER: Minimalist Top Bar */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between p-4 sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5 mb-6">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center p-1 bg-neutral-900 rounded-full border border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab('shopping')}
            className={\`px-4 py-1.5 rounded-full text-sm font-bold transition-all \${
              activeTab === 'shopping' 
                ? 'bg-neutral-700 text-white shadow-md' 
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }\`}
          >
            Einkaufsliste
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('scans')}
            className={\`px-4 py-1.5 rounded-full text-sm font-bold transition-all \${
              activeTab === 'scans' 
                ? 'bg-neutral-700 text-white shadow-md' 
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }\`}
          >
            Kühlschrank
          </button>
        </div>

        <div className="w-10 h-10 flex items-center justify-center">
          {/* HAUSHALTSGRÖSSE / PERSONENANZAHL */}
          <div className="group relative">
            <button className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </button>
            <div className="absolute right-0 top-full mt-2 w-48 p-3 rounded-2xl bg-neutral-900 border border-white/10 shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
              <div className="text-xs text-neutral-400 mb-2">Personen im Haushalt</div>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handlePeopleChange(peopleCount - 1)}
                  disabled={peopleCount <= 1}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 border border-white/10 flex items-center justify-center text-white font-bold transition-transform active:scale-95 cursor-pointer"
                >
                  -
                </button>
                <div className="text-sm font-bold text-white">
                  {peopleCount}
                </div>
                <button
                  type="button"
                  onClick={() => handlePeopleChange(peopleCount + 1)}
                  disabled={peopleCount >= 20}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 border border-white/10 flex items-center justify-center text-white font-bold transition-transform active:scale-95 cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAGES-VERLAUF / SCANS TABS`;

// we need to insert the emoji helper outside the component.
const importIndex = beforeHeader.lastIndexOf('import ');
const importEndIndex = beforeHeader.indexOf('\n', importIndex);
const beforeComponent = beforeHeader.substring(0, importEndIndex + 1) + emojiHelper + beforeHeader.substring(importEndIndex + 1);

let finalContent = beforeComponent + newHeader + afterTabs;
fs.writeFileSync('src/components/PlannerView.tsx', finalContent, 'utf8');

