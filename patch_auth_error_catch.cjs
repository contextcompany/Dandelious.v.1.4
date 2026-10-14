const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /catch\s*\(modelErr:\s*any\)\s*\{\s*lastErrorMessage\s*=\s*modelErr\?\.message\s*\|\|\s*String\(modelErr\s*\|\|\s*''\);\s*if\s*\(clientObj\.isCustom\s*&&\s*isFatalAuthError\(lastErrorMessage\)\)\s*\{\s*let\s*userMsg\s*=\s*"Dein eingetragener Google AI Studio API-Key ist ungültig oder abgelaufen\.";\s*if\s*\(lastErrorMessage\.toLowerCase\(\)\.includes\('quota'\)\s*\|\|\s*lastErrorMessage\.toLowerCase\(\)\.includes\('resource_exhausted'\)\)\s*\{\s*userMsg\s*=\s*"Das API-Kontingent \(Quota\) deines Schlüssels ist für dieses Modell aufgebraucht \(Rate Limit erreicht\)\. Bitte wechsle auf ein kleineres Modell wie 'Fast' oder warte einen Moment\.";\s*\}\s*else\s*if\s*\(lastErrorMessage\.toLowerCase\(\)\.includes\('403'\)\s*\|\|\s*lastErrorMessage\.toLowerCase\(\)\.includes\('permission denied'\)\)\s*\{\s*userMsg\s*=\s*"Zugriff verweigert \(403\)\. Dein API-Key hat nicht die nötigen Berechtigungen oder Regionen-Freigaben für dieses Modell\.";\s*\}\s*res\.write\(`data: \$\{JSON\.stringify\(\{ error: userMsg \}\)\}\\n\\n`\);\s*return\s*res\.end\(\);\s*\}/s;

const replacement = `catch (modelErr: any) {
          lastErrorMessage = modelErr?.message || String(modelErr || '');
          console.error("[Model Fallback Alert]", lastErrorMessage);
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
              res.write(\`data: \${JSON.stringify({ error: userMsg })}\\n\\n\`);
              return res.end();
            }
          }`;

if (regex.test(code)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('server.ts', code, 'utf8');
  console.log('Patched');
} else {
  console.log('Could not find');
}
