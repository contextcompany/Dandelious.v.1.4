const fs = require('fs');
let code = fs.readFileSync('src/components/ArcChatWindow.tsx', 'utf8');

const startStr = `      const customKeyToUse = settings.customApiKey || settings.apiKey || '';`;
const endStr = `        const response = await fetch('/api/reshaped/chat', {`;

const startIdx = code.indexOf(startStr);
const endIdx = code.indexOf(endStr);

if (startIdx !== -1 && endIdx !== -1) {
  const replacement = `      const customKeyToUse = (settings.customApiKey || settings.apiKey || '').replace(/[\\r\\n\\t "']/g, '').trim();
      const response = await fetch('/api/reshaped/chat', {`;
  code = code.substring(0, startIdx) + replacement + code.substring(endIdx + endStr.length);
  
  const braceToRemove = `      }
      
      if (!response.ok) {`;
  const newBrace = `      if (!response.ok) {`;
  code = code.replace(braceToRemove, newBrace);
  
  fs.writeFileSync('src/components/ArcChatWindow.tsx', code, 'utf8');
  console.log("Arc patched");
}
