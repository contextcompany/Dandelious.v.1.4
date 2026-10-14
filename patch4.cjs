const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetStr = `        } catch (modelErr: any) {
          lastErrorMessage = modelErr?.message || String(modelErr || '');
          if (clientObj.isCustom && isFatalAuthError(lastErrorMessage)) {
            let userMsg = "Dein eingetragener Google AI Studio API-Key ist ungültig oder abgelaufen.";
            if (lastErrorMessage.toLowerCase().includes('quota') || lastErrorMessage.toLowerCase().includes('resource_exhausted')) {
              userMsg = "Das API-Kontingent (Quota) deines Schlüssels ist für dieses Modell aufgebraucht (Rate Limit erreicht). Bitte wechsle auf ein kleineres Modell wie 'Fast' oder warte einen Moment.";
            } else if (lastErrorMessage.toLowerCase().includes('403') || lastErrorMessage.toLowerCase().includes('permission denied')) {
              userMsg = "Zugriff verweigert (403). Dein API-Key hat nicht die nötigen Berechtigungen oder Regionen-Freigaben für dieses Modell.";
            }
            res.write(\`data: \${JSON.stringify({ error: userMsg })}\\n\\n\`);
            return res.end();
          }`;

// Let's replace line-by-line to be safe.
const lines = code.split('\\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('if (clientObj.isCustom && isFatalAuthError(lastErrorMessage)) {') && lines[i].includes('if (clientObj.isCustom && isFatalAuthError(lastErrorMessage)) {')) {
    // Found it. Let's rewrite the block.
    console.log("Found line at", i);
    lines[i] = \`          console.error("[Model Fallback Alert]", lastErrorMessage);
          if (clientObj.isCustom) {
            let isFatal = isFatalAuthError(lastErrorMessage);
            let userMsg = "Dein eingetragener Google AI Studio API-Key ist ungültig oder abgelaufen.";
            
            if (lastErrorMessage.toLowerCase().includes('quota') || lastErrorMessage.toLowerCase().includes('resource_exhausted') || lastErrorMessage.toLowerCase().includes('429')) {
              userMsg = "Das API-Kontingent (Quota) deines Schlüssels ist für dieses Modell aufgebraucht (Rate Limit erreicht). Bitte wechsle auf ein kleineres Modell wie 'Fast' oder warte einen Moment.";
              isFatal = true;
            } else if (lastErrorMessage.toLowerCase().includes('403') || lastErrorMessage.toLowerCase().includes('permission denied')) {
              userMsg = "Zugriff verweigert (403). Dein API-Key hat nicht die nötigen Berechtigungen oder Regionen-Freigaben für dieses Modell.";
              isFatal = true;
            } else if (isFatalAuthError(lastErrorMessage)) {
              userMsg = "Dein eingetragener Google AI Studio API-Key ist ungültig oder abgelaufen.";
              isFatal = true;
            }
            
            if (isFatal) {
              res.write(\\\`data: \${JSON.stringify({ error: userMsg })}\\\\n\\\\n\\\`);
              return res.end();
            }
\`;
    // clear the next lines until closing bracket
    for(let j=i+1; j < lines.length; j++) {
      if (lines[j].includes('return res.end();')) {
        lines[j] = ''; // blank it
        if (lines[j+1].includes('}')) {
          lines[j+1] = '';
          break;
        }
      } else {
        lines[j] = '';
      }
    }
    
    break;
  }
}
fs.writeFileSync('server.ts', lines.join('\\n'), 'utf8');
console.log("Patched server.ts");
