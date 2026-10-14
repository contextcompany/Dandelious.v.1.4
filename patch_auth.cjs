const fs = require('fs');
let content = fs.readFileSync('src/components/AuthModal.tsx', 'utf8');

content = content.replace(
  /<div className="absolute -top-32 -left-32 w-\[120%\] h-96 bg-emerald-500\/40 rounded-full blur-\[100px\] pointer-events-none" \/>/g,
  '<div className="absolute -top-32 -left-32 w-[120%] h-96 bg-emerald-500/40 rounded-full blur-[100px] pointer-events-none animate-[pulse_4s_ease-in-out_infinite]" />'
);
content = content.replace(
  /<div className="absolute top-1\/3 -right-32 w-\[80%\] h-96 bg-cyan-500\/35 rounded-full blur-\[100px\] pointer-events-none" \/>/g,
  '<div className="absolute top-1/3 -right-32 w-[80%] h-96 bg-cyan-500/35 rounded-full blur-[100px] pointer-events-none animate-[pulse_5s_ease-in-out_infinite_1s]" />'
);
content = content.replace(
  /<div className="absolute -bottom-32 left-0 w-\[150%\] h-96 bg-indigo-500\/40 rounded-full blur-\[120px\] pointer-events-none" \/>/g,
  '<div className="absolute -bottom-32 left-0 w-[150%] h-96 bg-indigo-500/40 rounded-full blur-[120px] pointer-events-none animate-[pulse_6s_ease-in-out_infinite_2s]" />'
);

fs.writeFileSync('src/components/AuthModal.tsx', content, 'utf8');
