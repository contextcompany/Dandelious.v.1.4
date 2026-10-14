const fs = require('fs');
let code = fs.readFileSync('src/components/ArcChatWindow.tsx', 'utf8');

if (!code.includes('streamLocalGemini')) {
  code = code.replace(
    "import React, { useState, useEffect, useRef, useMemo } from 'react';",
    "import React, { useState, useEffect, useRef, useMemo } from 'react';\nimport { streamLocalGemini } from '../lib/geminiLocal';"
  );
}

// target in ArcChatWindow.tsx:
const targetStr = `      const response = await fetch('/api/reshaped/chat', {`;
const oldCodeStart = code.lastIndexOf(targetStr);
const oldCodeEnd = code.indexOf('if (data.error) {', oldCodeStart);

if (oldCodeStart !== -1 && oldCodeEnd !== -1) {
  const customKeyLogic = `      const customKeyToUse = settings.customApiKey || settings.apiKey || '';
      
      if (customKeyToUse && customKeyToUse.length > 5) {
        await streamLocalGemini(
          cleanPrompt,
          recentHistory,
          systemInstructionText,
          customKeyToUse,
          settings.model || 'gemma-2-9b-it',
          (chunk) => {
            aiContent += chunk;
            setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: aiContent } : m));
          }
        );
      } else {
        const response = await fetch('/api/reshaped/chat', {`;

  const whileEndStr = `              } catch (e) {
                // Parse skip
              }
            }
          }
        }
      }`;

  const whileEndIdx = code.indexOf(whileEndStr, oldCodeEnd);
  
  if (whileEndIdx !== -1) {
    code = code.substring(0, oldCodeStart) + customKeyLogic + code.substring(oldCodeStart + targetStr.length, whileEndIdx + whileEndStr.length) + '\n      }' + code.substring(whileEndIdx + whileEndStr.length);
    fs.writeFileSync('src/components/ArcChatWindow.tsx', code, 'utf8');
    console.log("ArcChatWindow.tsx patched successfully.");
  } else {
    console.error("Could not find while loop end in ArcChatWindow.tsx");
  }
} else {
  console.error("Could not find patch points in ArcChatWindow.tsx");
}
