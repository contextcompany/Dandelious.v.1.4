const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetFunction = `function isFatalAuthError(errStr: string): boolean {
  const lower = (errStr || '').toLowerCase();
  return lower.includes('401') || 
         lower.includes('unauthenticated') || 
         lower.includes('invalid_api_key') || 
         lower.includes('api_key_invalid') ||
         lower.includes('access_token_type_unsupported') ||
         lower.includes('api key not valid') ||
         lower.includes('invalid authentication creden');
}`;

const replacement = `function isFatalAuthError(errStr: string): boolean {
  const lower = (errStr || '').toLowerCase();
  return lower.includes('401') || 
         lower.includes('403') ||
         lower.includes('permission denied') ||
         lower.includes('quota exceeded') ||
         lower.includes('resource_exhausted') ||
         lower.includes('unauthenticated') || 
         lower.includes('invalid_api_key') || 
         lower.includes('api_key_invalid') ||
         lower.includes('access_token_type_unsupported') ||
         lower.includes('api key not valid') ||
         lower.includes('invalid authentication creden');
}`;

if (code.includes(targetFunction)) {
  code = code.replace(targetFunction, replacement);
  fs.writeFileSync('server.ts', code, 'utf8');
  console.log('Patched isFatalAuthError');
} else {
  console.log('Could not find isFatalAuthError');
}
