const fs = require('fs');
let text = fs.readFileSync('src/components/GroupChat.tsx', 'utf-8');

// The original speech recognition block starts around line 171 and goes until 216.
const regex = /\/\/ Speech Recognition State\s*const \[isRecording, setIsRecording\] = useState\(false\);\s*const recognitionRef = useRef<any>\(null\);\s*const startRecording = \(e: React\.PointerEvent\) => \{[\s\S]*?const stopRecording = \(e: React\.PointerEvent\) => \{[\s\S]*?\}, 500\);\s*\}\s*\};\s*/;
text = text.replace(regex, '');

fs.writeFileSync('src/components/GroupChat.tsx', text, 'utf-8');
console.log('Cleaned duplicate block');
