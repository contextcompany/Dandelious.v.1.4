const fs = require('fs');
let content = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

// Replace sidebar background
content = content.replace(/bg-black\/20 backdrop-blur-\[40px\]/g, 'bg-white/[0.04] backdrop-blur-[80px] shadow-[0_0_40px_rgba(255,255,255,0.05)] border-white/10');

// Replace active/hover items to match glass
content = content.replace(/bg-white\/15 shadow-sm/g, 'bg-white/20 shadow-sm border border-white/10 backdrop-blur-md');
content = content.replace(/bg-white\/5/g, 'bg-white/10');

fs.writeFileSync('src/components/Sidebar.tsx', content, 'utf8');
