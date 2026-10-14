const fs = require('fs');
let code = fs.readFileSync('src/components/DiceStudio.tsx', 'utf8');

const targetStr = `            try {
              const json = JSON.parse(dataStr);
              if (json.chunk || json.text) {`;

const replacement = `            try {
              const json = JSON.parse(dataStr);
              if (json.error) {
                fullAssistantText += "\\n\\n⚠️ **Fehler:** " + json.error;
                setChatMessages(prev => {
                  const copy = [...prev];
                  copy[copy.length - 1] = { role: 'assistant', content: fullAssistantText };
                  return copy;
                });
              } else if (json.chunk || json.text) {`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replacement);
  fs.writeFileSync('src/components/DiceStudio.tsx', code, 'utf8');
  console.log('Patched DiceStudio');
} else {
  console.log('Could not find in DiceStudio');
}
