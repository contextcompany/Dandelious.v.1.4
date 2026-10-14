const fs = require('fs');
let content = fs.readFileSync('src/components/GroupChat.tsx', 'utf8');

content = content.replace(/bg-\[#121216\]/g, 'bg-black/40 backdrop-blur-[60px]');
content = content.replace(/bg-\[#0a0a0d\]/g, 'bg-black/30');
content = content.replace(/bg-neutral-950\/20/g, 'bg-black/30 backdrop-blur-xl');
content = content.replace(/bg-black\/80/g, 'bg-black/50');
content = content.replace(/bg-\[#1c1c22\]/g, 'bg-white/10');

fs.writeFileSync('src/components/GroupChat.tsx', content, 'utf8');
