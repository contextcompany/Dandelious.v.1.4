const fs = require('fs');

function revertApp() {
  let code = fs.readFileSync('src/App.tsx', 'utf8');
  code = code.replace("import { streamLocalGemini } from './lib/geminiLocal';\n", "");

  const startIdx = code.indexOf('const customKeyToUse = (settings.customApiKey');
  const endIdx = code.indexOf('if (!response.ok || !response.body) {');
  
  if (startIdx !== -1 && endIdx !== -1) {
    const replacement = `      const response = await fetch('/api/reshaped/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userText,
          history: priorMessages,
          model: effectiveModel,
          temperature: settings.temperature,
          topP: settings.topP,
          maxTokens: settings.maxTokens,
          systemInstruction: activeInstruction,
          customApiKey: (settings.customApiKey || (typeof window !== 'undefined' ? localStorage.getItem('vg_user_api_key') : '') || '').replace(/[\\r\\n\\t "']/g, '').trim(),
          appLanguage: settings.appLanguage || 'Deutsch',
          userNickname: settings.userNickname || '',
          userOccupation: settings.userOccupation || '',
          userAbout: settings.userAbout || '',
          enableMemories: settings.enableMemories ?? true,
          toneStyle: settings.toneStyle || 'Freundlich',
          warmthLevel: settings.warmthLevel || 'Mehr',
          enthusiasmLevel: settings.enthusiasmLevel || 'Mehr',
          headingsListsLevel: settings.headingsListsLevel || 'Mehr',
          emojiLevel: settings.emojiLevel || 'Weniger',
          fastAnswers: settings.fastAnswers ?? true,
          customInstructionsDetail: settings.customInstructionsDetail || '',
          webSearchAuto: settings.webSearchAuto ?? true,
          userTier: settings.userTier || 'Kostenlos'
        }),
        signal: controller.signal
      });

      `;
    // We also need to remove the closing bracket of the else statement later
    // Let's just replace the whole block up to the fetch
    code = code.substring(0, startIdx) + replacement + code.substring(endIdx);
    
    // Now remove the `      }` that matched the `else {`
    // This is located just before `updateSessionMessage(accumulatedContent, lastMetrics, true);`
    const endBraceIdx = code.lastIndexOf('      }\n      updateSessionMessage(accumulatedContent, lastMetrics, true);');
    if (endBraceIdx !== -1) {
      code = code.substring(0, endBraceIdx) + '      updateSessionMessage(accumulatedContent, lastMetrics, true);' + code.substring(endBraceIdx + 73);
    }
    
    fs.writeFileSync('src/App.tsx', code, 'utf8');
    console.log("App reverted");
  }
}
revertApp();
