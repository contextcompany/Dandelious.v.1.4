const fs = require('fs');
let content = fs.readFileSync('src/components/ChatWindow.tsx', 'utf8');

// Make chat input glassier
content = content.replace(/bg-black\/30 backdrop-blur-\[40px\]/g, 'bg-white/[0.04] backdrop-blur-[60px] border border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.05)]');
content = content.replace(/bg-white\/10 backdrop-blur-lg/g, 'bg-white/15 backdrop-blur-xl border border-white/20');
content = content.replace(/bg-black\/40 backdrop-blur-2xl/g, 'bg-white/[0.04] backdrop-blur-[60px] shadow-[0_0_30px_rgba(255,255,255,0.05)] border-white/10');
content = content.replace(/bg-black\/30 backdrop-blur-xl/g, 'bg-white/[0.05] backdrop-blur-2xl border-white/10');
content = content.replace(/bg-black\/50 backdrop-blur-2xl/g, 'bg-white/[0.04] backdrop-blur-[60px] border-white/10 shadow-2xl');
content = content.replace(/bg-black\/40/g, 'bg-white/[0.03] backdrop-blur-[50px]');

fs.writeFileSync('src/components/ChatWindow.tsx', content, 'utf8');
