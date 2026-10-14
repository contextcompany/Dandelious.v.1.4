// Quick check of the UI error handling logic
const fs = require('fs');
let appCode = fs.readFileSync('src/App.tsx', 'utf8');
let arcCode = fs.readFileSync('src/components/ArcChatWindow.tsx', 'utf8');
let diceCode = fs.readFileSync('src/components/DiceStudio.tsx', 'utf8');

console.log("App.tsx parsed.error check:", appCode.includes('parsed.error'));
console.log("DiceStudio.tsx json.error check:", diceCode.includes('json.error'));
console.log("ArcChatWindow.tsx data.error check:", arcCode.includes('data.error'));
