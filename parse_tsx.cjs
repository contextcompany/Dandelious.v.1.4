const fs = require('fs');
const ts = require('typescript');
const file = fs.readFileSync('src/components/ChatWindow.tsx', 'utf8');

const sourceFile = ts.createSourceFile(
  'ChatWindow.tsx',
  file,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX
);

let depth = 0;
function traverse(node) {
  // console.log("  ".repeat(depth) + ts.SyntaxKind[node.kind]);
  depth++;
  ts.forEachChild(node, traverse);
  depth--;
}

traverse(sourceFile);
console.log("Parsing finished.");
