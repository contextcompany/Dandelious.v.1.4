const fs = require('fs');

function cleanFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace backdrop-blur-* with nothing
  content = content.replace(/backdrop-blur-(sm|md|lg|xl|2xl|3xl)/g, '');
  
  // Remove reaction bars if they exist
  // By stripping the ThumbsUp and reaction configs
  // Let's just find "REACTION_CONFIG" block and remove the usage.
  // Actually, I can just replace bg-white/[0.04] and similar with solid colors
  content = content.replace(/bg-white\/\[0\.0[0-9]\]/g, 'bg-[#1e1e1e]');
  content = content.replace(/bg-white\/5/g, 'bg-[#1e1e1e]');
  content = content.replace(/bg-white\/10/g, 'bg-[#2a2a2a]');
  
  // Strip borders
  content = content.replace(/border-white\/\[0\.0[0-9]\]/g, 'border-transparent');
  content = content.replace(/border-white\/10/g, 'border-transparent');
  content = content.replace(/border-white\/15/g, 'border-transparent');
  content = content.replace(/border-white\/20/g, 'border-transparent');
  
  // Replace rounded-[28px] and [26px] with standard rounded-2xl or 3xl
  content = content.replace(/rounded-\[28px\]/g, 'rounded-3xl');
  content = content.replace(/rounded-\[26px\]/g, 'rounded-3xl');
  content = content.replace(/rounded-\[22px\]/g, 'rounded-2xl');

  // Remove the reaction bar from ArcChatWindow
  // It's under "Reaction Counter Bar"
  if (content.includes('{/* Reaction Counter Bar */}')) {
    content = content.replace(/\{\/\* Reaction Counter Bar \*\/\}.*?\{\/\* Custom Action Bar on Hover \*\/\}/gs, '{/* Custom Action Bar on Hover */}');
  }
  
  if (content.includes('{/* Custom Action Bar on Hover */}')) {
     const start = content.indexOf('{/* Custom Action Bar on Hover */}');
     const end = content.indexOf('</div>', start + 100);
     // Let's just remove the word "ThumbsUp" just in case it breaks if we remove the whole thing without parsing properly.
  }

  // A safer way to remove the reaction counter and custom action bar is regex:
  content = content.replace(/\{\/\* Reaction Counter Bar \*\/\}.*?(\{\/\*)/gs, '$1');

  fs.writeFileSync(filePath, content);
}

cleanFile('src/components/ArcChatWindow.tsx');
cleanFile('src/components/DiceStudio.tsx');

console.log("Stripped glass and thumbs.");
