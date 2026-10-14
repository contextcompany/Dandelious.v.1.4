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

const replacement = `        } catch (modelErr: any) {
          lastErrorMessage = modelErr?.message || String(modelErr || '');
          if (clientObj.isCustom) {
            let userMsg = "Dein eingetragener Google AI Studio API-Key ist ungültig oder abgelaufen.";
            let isFatal = isFatalAuthError(lastErrorMessage);
            if (lastErrorMessage.toLowerCase().includes('quota') || lastErrorMessage.toLowerCase().includes('resource_exhausted') || lastErrorMessage.toLowerCase().includes('429')) {
              userMsg = "Das API-Kontingent (Quota) deines Schlüssels ist für dieses Modell aufgebraucht (Rate Limit erreicht). Bitte wechsle auf ein kleineres Modell wie 'Fast' oder warte einen Moment.";
              isFatal = true;
            } else if (lastErrorMessage.toLowerCase().includes('403') || lastErrorMessage.toLowerCase().includes('permission denied')) {
              userMsg = "Zugriff verweigert (403). Dein API-Key hat nicht die nötigen Berechtigungen oder Regionen-Freigaben für dieses Modell.";
              isFatal = true;
            }
            if (isFatal) {
              res.write(\`data: \${JSON.stringify({ error: userMsg })}\\n\\n\`);
              return res.end();
            }
          }`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replacement);
  fs.writeFileSync('server.ts', code, 'utf8');
  console.log('Patched auth error response');
} else {
  console.log('Could not find auth error response block');
}
