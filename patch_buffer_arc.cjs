const fs = require('fs');
let code = fs.readFileSync('src/components/ArcChatWindow.tsx', 'utf8');

const oldLoop1 = `        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\\n\\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {`;

const newLoop1 = `        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          let separatorIndex;
          while ((separatorIndex = buffer.indexOf('\\n\\n')) >= 0) {
            const line = buffer.slice(0, separatorIndex).trim();
            buffer = buffer.slice(separatorIndex + 2);

            if (line.startsWith('data: ')) {`;

if (code.includes(oldLoop1)) {
  // It appears twice in ArcChatWindow (summary and generation)
  code = code.split(oldLoop1).join(newLoop1);
  fs.writeFileSync('src/components/ArcChatWindow.tsx', code, 'utf8');
  console.log("ArcChatWindow.tsx buffer patched successfully.");
} else {
  console.log("Could not find loop to patch in ArcChatWindow.tsx.");
}
