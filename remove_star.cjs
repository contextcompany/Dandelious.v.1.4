const fs = require('fs');
let content = fs.readFileSync('src/components/ChatWindow.tsx', 'utf8');

const startTag = '{/* 4-Pointed Gradient Diamond Star Icon (matching Bild 2) */}';
const endTag = '</div>\n              {/* Title from Bild 2 */}';

const startIndex = content.indexOf(startTag);
const endIndex = content.indexOf(endTag);

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + content.substring(endIndex + 6); // Keep {/* Title from Bild 2 */}
  fs.writeFileSync('src/components/ChatWindow.tsx', content);
  console.log("Removed star completely!");
} else {
  console.log("Could not find tags.");
}
