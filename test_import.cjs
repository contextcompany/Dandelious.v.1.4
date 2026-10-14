const fs = require('fs');
console.log(fs.readFileSync('src/components/SettingsModal.tsx', 'utf8').includes('addOrUpdateMemoryTopic(\'Importierte Information \''));
