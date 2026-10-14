const fs = require('fs');
let code = fs.readFileSync('src/components/DiceStudio.tsx', 'utf8');

const oldLoop2 = `        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;
            const dataStr = trimmed.slice(6);`;

const newLoop2 = `        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          let newlineIndex;
          
          while ((newlineIndex = buffer.indexOf('\\n')) >= 0) {
            const line = buffer.slice(0, newlineIndex).trim();
            buffer = buffer.slice(newlineIndex + 1);

            if (!line.startsWith('data: ')) continue;
            const dataStr = line.slice(6).trim();`;

if (code.includes(oldLoop2)) {
  code = code.split(oldLoop2).join(newLoop2);
  fs.writeFileSync('src/components/DiceStudio.tsx', code, 'utf8');
  console.log("DiceStudio.tsx buffer patched successfully.");
} else {
  console.log("Could not find loop to patch in DiceStudio.tsx.");
}
