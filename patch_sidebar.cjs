const fs = require('fs');
let content = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

// Replace solid dark colors with glassy ones
content = content.replace(/bg-\[#1c1c1e\]/g, 'bg-white/15 shadow-sm');
content = content.replace(/bg-neutral-950\/20 backdrop-blur-md/g, 'bg-black/20 backdrop-blur-[40px]');
content = content.replace(/bg-\[#141416\]\/95/g, 'bg-black/60');
content = content.replace(/backdrop-blur-3xl/g, 'backdrop-blur-[60px]');
content = content.replace(/bg-\[#18181b\]/g, 'bg-white/5');

fs.writeFileSync('src/components/Sidebar.tsx', content, 'utf8');
