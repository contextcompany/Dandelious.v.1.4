const fs = require('fs');
const content = fs.readFileSync('src/components/PlannerView.tsx', 'utf8');

const overviewGrid = `
      {activeTab === 'overview' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <button 
            type="button"
            onClick={() => setActiveTab('scans')}
            className="flex flex-col text-left p-6 rounded-[28px] bg-neutral-950/40 hover:bg-neutral-900/60 border border-white/10 transition-colors cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
              <Camera className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Kühlschrank-Vorräte</h3>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Erfasse deinen Kühlschrank per Foto, erhalte KI-Empfehlungen und prüfe die Haltbarkeit.
            </p>
          </button>
          
          <button 
            type="button"
            onClick={() => setActiveTab('shopping')}
            className="flex flex-col text-left p-6 rounded-[28px] bg-neutral-950/40 hover:bg-neutral-900/60 border border-white/10 transition-colors cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-6 h-6 text-cyan-400" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-bold text-white">Einkaufsliste</h3>
              {openCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                  {openCount} offen
                </span>
              )}
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Deine intelligente Einkaufsliste, synchronisiert mit deinem aktuellen Haushaltsbedarf.
            </p>
          </button>
        </div>
      ) : (
        <div className="space-y-6 flex flex-col h-full">
          <button 
            type="button"
            onClick={() => setActiveTab('overview')}
            className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer w-max"
          >
            ← Zurück zur Übersicht
          </button>
`;

const tabsEnd = `
        </div>
      )}
`;

// Start at 630 (Tages-verlauf)
// End at 1111 (closing of grid)

const parts = content.split('      {/* ========================================================================= */}\n      {/* TAGES-VERLAUF / SCANS TABS ("Pro Tag ein neues Bild oder so") */}');

const before = parts[0];
const rest = parts[1];

const parts2 = rest.split('      {/* ========================================================================= */}\n      {/* LIVE KAMERA MODAL: Echte Kamera mit Sucher & Auslöser */}');

const middle = parts2[0];
const after = parts2[1];

// Inside middle, we need to split left column and right column
// left col starts around 693: {/* LINKE SPALTE: Kühlschrank-Foto & KI-Ergebnisse (7 Spalten) */}
// right col starts around 929: {/* RECHTE SPALTE: Interaktive Einkaufsliste (5 Spalten) */}

const leftSplit = middle.split('{/* LINKE SPALTE: Kühlschrank-Foto & KI-Ergebnisse (7 Spalten) */}');
const topMiddle = leftSplit[0];
const restMiddle = leftSplit[1];

const rightSplit = restMiddle.split('{/* RECHTE SPALTE: Interaktive Einkaufsliste (5 Spalten) */}');
const leftColHtml = rightSplit[0];
const rightColHtml = rightSplit[1];

// topMiddle has the TAGES-VERLAUF and the starting of the grid: <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">\n        \n        
// So topMiddle contains `<div className="flex items-center justify-between gap-3 overflow-x-auto no-scrollbar py-1">` etc.

// leftColHtml is `\n        <div className="lg:col-span-7 space-y-6">...` up to `</div>\n\n        ` (closing of col-span-7)

// rightColHtml is `\n        <div className="lg:col-span-5 space-y-6">...` up to `</div>\n\n      </div>\n\n` (closing of col-span-5 and grid)

// We want to reconstruct it:

const reconstructed = `
${overviewGrid}

          {activeTab === 'scans' && (
            <div className="space-y-6">
              {/* TAGES-VERLAUF / SCANS TABS ("Pro Tag ein neues Bild oder so") */}
${topMiddle.replace('<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">', '').replace('        \n        ', '')}
              {/* Kühlschrank-Foto & KI-Ergebnisse */}
${leftColHtml.replace('<div className="lg:col-span-7 space-y-6">', '<div className="space-y-6 max-w-4xl mx-auto">').trim().slice(0, -6)}
            </div>
          )}

          {activeTab === 'shopping' && (
            <div className="space-y-6">
              {/* Interaktive Einkaufsliste */}
${rightColHtml.replace('<div className="lg:col-span-5 space-y-6">', '<div className="space-y-6 max-w-4xl mx-auto h-full">').replace('      </div>\n\n', '')}
          )}
${tabsEnd}
      {/* ========================================================================= */}
      {/* LIVE KAMERA MODAL: Echte Kamera mit Sucher & Auslöser */}
${after}`;

fs.writeFileSync('src/components/PlannerView.tsx', before + reconstructed, 'utf8');
