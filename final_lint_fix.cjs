const fs = require('fs');
let gc = fs.readFileSync('src/components/GroupChat.tsx', 'utf-8');

// The hsmDef regex might have failed to replace if it wasn't exact.
gc = gc.replace(/const handleSendMessage = async \(\) =>/, 'const handleSendMessage = async (textToSend?: string) =>');

// Wait, looking at line 255: `handleSendMessage(editPromptText)` is likely inside `editingMessageId` check in GroupChat, let's look for `handleSendMessage(`
gc = gc.replace(/handleSendMessage\(undefined\)/g, 'handleSendMessage()'); // restore to default

// Add updateGlobalSession properly at top level scope of the component, just before handleSendMessage
const hsmDecl = `const handleSendMessage = async (textToSend?: string) => {`;
if (!gc.includes('const updateGlobalSession = (newMsgs')) {
  gc = gc.replace(hsmDecl, `
  const updateGlobalSession = (newMsgs: GroupChatMessage[]) => {
    if (activeSession?.id && onUpdateSession) {
       onUpdateSession({
          ...activeSession,
          messages: newMsgs.map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: Date.now(),
          }))
       });
    }
  };
  
  ${hsmDecl}`);
}

fs.writeFileSync('src/components/GroupChat.tsx', gc, 'utf-8');
console.log('Final lint fix run.');
