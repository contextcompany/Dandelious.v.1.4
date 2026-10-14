const fs = require('fs');

function styleFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Convert typical glassy/gradient containers to solid ones
  content = content.replace(/bg-gradient-to-[a-z]+ from-[a-z0-9\/\[\]\-]+ to-[a-z0-9\/\[\]\-]+/g, 'bg-[#121212]');
  // Replace borders
  content = content.replace(/border-white\/10/g, 'border-transparent');
  content = content.replace(/border-white\/5/g, 'border-transparent');
  content = content.replace(/border-white\/20/g, 'border-transparent');
  // Rounded corners
  content = content.replace(/rounded-3xl/g, 'rounded-2xl');
  content = content.replace(/rounded-\[28px\]/g, 'rounded-2xl');
  content = content.replace(/rounded-\[32px\]/g, 'rounded-2xl');

  // Replace background wrappers
  content = content.replace(/bg-\[#0e0e11\]/g, 'bg-black');
  content = content.replace(/bg-\[#111114\]/g, 'bg-[#1a1a1a]');
  
  // Background images / abstract patterns (like absolute inset-0 bg-[url...])
  // We can just strip absolute background decorators if they contain opacity and gradients
  content = content.replace(/<div className="absolute inset-0 bg-\[url[^>]+><\/div>/g, '');
  content = content.replace(/<div className="absolute inset-0 bg-gradient-[^>]+><\/div>/g, '');
  content = content.replace(/<div className="absolute top-0 inset-x-0 h-40 bg-gradient-[^>]+><\/div>/g, '');
  content = content.replace(/bg-blue-500\/10 border border-blue-500\/20/g, 'bg-blue-500/10 border-transparent');
  
  fs.writeFileSync(filePath, content);
  console.log("Styled", filePath);
}

styleFile('src/components/ArcChatWindow.tsx');
styleFile('src/components/DiceStudio.tsx');
