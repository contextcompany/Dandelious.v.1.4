const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldLoop = `        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunkText = decoder.decode(value, { stream: true });
          const lines = chunkText.split('\\n\\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6).trim();`;

const newLoop = `        let buffer = '';
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          let separatorIndex;
          
          while ((separatorIndex = buffer.indexOf('\\n\\n')) >= 0) {
            const line = buffer.slice(0, separatorIndex).trim();
            buffer = buffer.slice(separatorIndex + 2);

            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6).trim();`;

if (code.includes(oldLoop)) {
  code = code.replace(oldLoop, newLoop);
  fs.writeFileSync('src/App.tsx', code, 'utf8');
  console.log("App.tsx buffer patched successfully.");
} else {
  console.log("Could not find loop to patch in App.tsx.");
}
