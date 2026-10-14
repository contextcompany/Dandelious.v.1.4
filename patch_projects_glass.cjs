const fs = require('fs');
let content = fs.readFileSync('src/components/Projects.tsx', 'utf8');

content = content.replace(/bg-black\/50 backdrop-blur-\[60px\]/g, 'bg-white/[0.04] backdrop-blur-[80px] border border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.05)]');
content = content.replace(/bg-white\/10 backdrop-blur-xl/g, 'bg-white/15 backdrop-blur-2xl border border-white/20');
content = content.replace(/bg-white\/20/g, 'bg-white/25');
content = content.replace(/bg-black\/40 backdrop-blur-md/g, 'bg-black/50 backdrop-blur-xl');

fs.writeFileSync('src/components/Projects.tsx', content, 'utf8');
