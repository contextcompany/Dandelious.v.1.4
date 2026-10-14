const fs = require('fs');
let content = fs.readFileSync('src/components/ChatWindow.tsx', 'utf8');

content = content.replace(/bg-\[#0c0c10\]\/95/g, 'bg-black/40');
content = content.replace(/bg-neutral-950\/25/g, 'bg-black/30 backdrop-blur-[40px]');
content = content.replace(/bg-\[#1c1c20\]/g, 'bg-white/10 backdrop-blur-lg');
content = content.replace(/bg-\[#181920\]\/95/g, 'bg-black/40 backdrop-blur-2xl');
content = content.replace(/bg-neutral-950\/20/g, 'bg-black/30 backdrop-blur-xl');
content = content.replace(/bg-\[#1e1e24\]/g, 'bg-black/50 backdrop-blur-2xl');
content = content.replace(/bg-\[#18181c\]/g, 'bg-black/50 backdrop-blur-2xl');
content = content.replace(/bg-\[#222228\]/g, 'bg-white/10');
content = content.replace(/bg-\[#121215\]/g, 'bg-black/40');

fs.writeFileSync('src/components/ChatWindow.tsx', content, 'utf8');
