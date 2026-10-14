const fs = require('fs');
let code = fs.readFileSync('src/components/DiceStudio.tsx', 'utf8');

const targetStr2 = `          try {
            const json = JSON.parse(dataStr);
            if (json.chunk || json.text) {`;

const replacement2 = `          try {
            const json = JSON.parse(dataStr);
            if (json.error) {
               fullAssistantText += "\\n\\n⚠️ **Fehler:** " + json.error;
            } else if (json.chunk || json.text) {`;

if (code.includes(targetStr2)) {
  code = code.replace(targetStr2, replacement2);
  fs.writeFileSync('src/components/DiceStudio.tsx', code, 'utf8');
  console.log('Patched DiceStudio fallback buffer');
} else {
  console.log('Could not find fallback buffer in DiceStudio');
}
