const fs = require('fs');

const content = fs.readFileSync('src/components/PlannerView.tsx', 'utf8');

const listStartStr = 'filteredShopping.map((item) => (';
const listEndStr = `
                    </button>
                  </div>
                ))`; // We need to match the end of the map properly. 

const parts = content.split('filteredShopping.map((item) => (');
if (parts.length < 2) {
  console.log('Could not find filteredShopping.map');
  process.exit(1);
}

const beforeList = parts[0];
const rest = parts[1];

// Find the end of the map function
const endOfMapIndex = rest.indexOf('))');
const afterList = rest.substring(endOfMapIndex + 2); // +2 for '))'

const newGrid = `filteredShopping.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => handleToggleShoppingItem(item.id)}
                    className={\`group relative flex flex-col items-center justify-center p-4 rounded-[24px] cursor-pointer transition-all border \${
                      item.completed 
                        ? 'bg-neutral-800/30 border-white/5 opacity-50 grayscale hover:opacity-100 hover:grayscale-0'
                        : 'bg-neutral-900 border-white/10 hover:border-white/20 hover:bg-neutral-800 shadow-md'
                    }\`}
                  >
                    <div className="text-4xl mb-3 drop-shadow-md">{guessEmoji(item.name)}</div>
                    <div className={\`text-xs font-bold text-center line-clamp-2 break-words \${
                      item.completed ? 'text-neutral-400 line-through' : 'text-white'
                    }\`}>
                      {item.name}
                    </div>
                    
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteShoppingItem(item.id);
                      }}
                      className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-red-400 hover:border-red-400 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))`;

// we also need to change the wrapping div from space-y-2 to a grid.
// Let's find the wrapping div for the shopping list items.
// It might be `<div className="space-y-2">`
// Let's do a string replace on `beforeList`.

let modifiedBefore = beforeList.replace(
  '<div className="space-y-2 max-h-[500px] overflow-y-auto no-scrollbar pr-2 pb-6">', 
  '<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[500px] overflow-y-auto no-scrollbar p-2 pb-6">'
);

if (modifiedBefore === beforeList) {
   // maybe it doesn't have max-h-[500px] exactly as I thought.
   // Let's find the actual wrapper.
}

fs.writeFileSync('src/components/PlannerView.tsx', modifiedBefore + newGrid + afterList, 'utf8');

