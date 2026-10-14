const fs = require('fs');
let content = fs.readFileSync('src/components/Projects.tsx', 'utf8');

content = content.replace(/bg-\[#121214\]/g, 'bg-black/50 backdrop-blur-[60px]');
content = content.replace(/bg-\[#1c1c1e\]/g, 'bg-white/10 backdrop-blur-xl');
content = content.replace(/bg-\[#252528\]/g, 'bg-white/20');
content = content.replace(/bg-\[#18181b\]/g, 'bg-white/5');
content = content.replace(/bg-\[#242426\]/g, 'bg-white/15');
content = content.replace(/bg-black\/80 backdrop-blur-md/g, 'bg-black/40 backdrop-blur-md');

fs.writeFileSync('src/components/Projects.tsx', content, 'utf8');
