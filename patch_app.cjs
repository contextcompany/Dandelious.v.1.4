const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /\{\/\* Global Northern Lights Atmosphere \*\/\}[^]+?<\/div>/,
  '<GlobalAurora isStreaming={isStreaming} />'
);

if (!content.includes('GlobalAurora')) {
  console.error("Failed to replace");
} else {
  content = "import { GlobalAurora } from './components/GlobalAurora';\n" + content;
  fs.writeFileSync('src/App.tsx', content, 'utf8');
}
