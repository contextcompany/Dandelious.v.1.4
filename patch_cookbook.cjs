const fs = require('fs');
let content = fs.readFileSync('src/components/CookbookView.tsx', 'utf8');

content = content.replace(/bg-neutral-950\/80/g, 'bg-black/60 backdrop-blur-[80px]');
content = content.replace(/bg-neutral-950\/60/g, 'bg-black/60 backdrop-blur-[60px]');
content = content.replace(/bg-neutral-950\/50/g, 'bg-black/40 backdrop-blur-3xl');
content = content.replace(/bg-\[#141416\]/g, 'bg-white/10');
content = content.replace(/bg-black\/50 backdrop-blur-md/g, 'bg-black/30 backdrop-blur-md');

fs.writeFileSync('src/components/CookbookView.tsx', content, 'utf8');
