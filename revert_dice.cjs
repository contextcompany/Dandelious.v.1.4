const fs = require('fs');

function revertDice() {
  let code = fs.readFileSync('src/components/DiceStudio.tsx', 'utf8');
  code = code.replace("import { streamLocalGemini } from '../lib/geminiLocal';\n", "");

  const startIdx = code.indexOf('if (storedKey && storedKey.length > 5) {');
  const endIdx = code.indexOf('if (!response.ok) {');
  
  if (startIdx !== -1 && endIdx !== -1) {
    const replacement = `const response = await fetch('/api/reshaped/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToUse,
          history: historyContext,
          model: selectedCoderModel,
          temperature: tempByModel,
          topP: 0.95,
          maxTokens: maxTokensByModel,
          systemInstruction: systemPrompt,
          customApiKey: storedKey
        })
      });

      `;
    
    code = code.substring(0, startIdx) + replacement + code.substring(endIdx);
    
    // Now remove the `      }` that matched the `else {`
    // This is located just before `if (buffer.trim().startsWith('data: ')) {`
    // Actually, wait, let's just find `      }\n\n      if (!fullAssistantText.trim()) {`
    const endBraceIdx = code.lastIndexOf('      }\n\n      if (!fullAssistantText.trim()) {');
    if (endBraceIdx !== -1) {
      code = code.substring(0, endBraceIdx) + '\n\n      if (!fullAssistantText.trim()) {' + code.substring(endBraceIdx + 45);
    }
    
    fs.writeFileSync('src/components/DiceStudio.tsx', code, 'utf8');
    console.log("DiceStudio reverted");
  } else {
    console.log("Failed to find boundaries in DiceStudio");
  }
}
revertDice();
