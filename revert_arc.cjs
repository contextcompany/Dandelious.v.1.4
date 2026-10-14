const fs = require('fs');

function revertArc() {
  let code = fs.readFileSync('src/components/ArcChatWindow.tsx', 'utf8');
  code = code.replace("import { streamLocalGemini } from '../lib/geminiLocal';\n", "");

  const startIdx = code.indexOf('const customKeyToUse = settings.customApiKey');
  const endIdx = code.indexOf('if (!response.ok || !response.body) {');
  
  if (startIdx !== -1 && endIdx !== -1) {
    const replacement = `const response = await fetch('/api/reshaped/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: cleanPrompt,
          history: recentHistory,
          model: settings.model || 'gemma-2-9b-it',
          temperature: 0.7,
          systemInstruction: systemInstructionText,
          customApiKey: (settings.customApiKey || settings.apiKey || '').replace(/[\\r\\n\\t "']/g, '').trim()
        })
      });

      `;
    
    code = code.substring(0, startIdx) + replacement + code.substring(endIdx);
    
    const endBraceIdx = code.lastIndexOf('      }\n              } catch (e) {');
    if (endBraceIdx !== -1) {
      code = code.substring(0, endBraceIdx) + '              } catch (e) {' + code.substring(endBraceIdx + 28);
    }
    
    fs.writeFileSync('src/components/ArcChatWindow.tsx', code, 'utf8');
    console.log("ArcChatWindow reverted");
  } else {
    console.log("Failed to find boundaries in Arc");
  }
}
revertArc();
