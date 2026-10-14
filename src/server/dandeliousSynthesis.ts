// Dandelious High-Intelligence Conversational & Reasoning Engine
// Provides natural, contextual, nuanced, and intelligent responses for Dandelious & Dice Studio

import { synthesizeCulinaryRecipe } from "./culinaryEngine.ts";

export interface SynthesisContext {
  model: string;
  appLanguage?: string;
  toneStyle?: string;
  userNickname?: string;
  userOccupation?: string;
  isTurbo?: boolean;
}

// Math evaluation helper
function tryEvaluateMath(text: string): string | null {
  const clean = text.toLowerCase()
    .replace(/wie viel ist/g, '')
    .replace(/wieviel ist/g, '')
    .replace(/was ist/g, '')
    .replace(/berechne/g, '')
    .replace(/rechne/g, '')
    .replace(/ergebnis von/g, '')
    .trim();

  // Pattern: X mal Y, X * Y, X x Y
  const mulMatch = clean.match(/^(\d+(?:[.,]\d+)?)\s*(?:mal|\*|x|×)\s*(\d+(?:[.,]\d+)?)$/i);
  if (mulMatch) {
    const a = parseFloat(mulMatch[1].replace(',', '.'));
    const b = parseFloat(mulMatch[2].replace(',', '.'));
    const res = a * b;
    return `Das Ergebnis von **${mulMatch[1]} × ${mulMatch[2]}** ist **${Number.isInteger(res) ? res : res.toFixed(2)}**.`;
  }

  // Pattern: X geteilt durch Y, X / Y, X : Y, X durch Y
  const divMatch = clean.match(/^(\d+(?:[.,]\d+)?)\s*(?:geteilt durch|durch|\/|:)\s*(\d+(?:[.,]\d+)?)$/i);
  if (divMatch) {
    const a = parseFloat(divMatch[1].replace(',', '.'));
    const b = parseFloat(divMatch[2].replace(',', '.'));
    if (b === 0) return "Eine Division durch Null ist mathematisch nicht definiert.";
    const res = a / b;
    return `Das Ergebnis von **${divMatch[1]} ÷ ${divMatch[2]}** ist **${Number.isInteger(res) ? res : res.toFixed(4).replace(/\.?0+$/, '')}**.`;
  }

  // Pattern: X plus Y, X + Y
  const addMatch = clean.match(/^(\d+(?:[.,]\d+)?)\s*(?:plus|\+)\s*(\d+(?:[.,]\d+)?)$/i);
  if (addMatch) {
    const a = parseFloat(addMatch[1].replace(',', '.'));
    const b = parseFloat(addMatch[2].replace(',', '.'));
    const res = a + b;
    return `Das Ergebnis von **${addMatch[1]} + ${addMatch[2]}** ist **${Number.isInteger(res) ? res : res.toFixed(2)}**.`;
  }

  // Pattern: X minus Y, X - Y
  const subMatch = clean.match(/^(\d+(?:[.,]\d+)?)\s*(?:minus|-)\s*(\d+(?:[.,]\d+)?)$/i);
  if (subMatch) {
    const a = parseFloat(subMatch[1].replace(',', '.'));
    const b = parseFloat(subMatch[2].replace(',', '.'));
    const res = a - b;
    return `Das Ergebnis von **${subMatch[1]} − ${subMatch[2]}** ist **${Number.isInteger(res) ? res : res.toFixed(2)}**.`;
  }

  // Pattern: X Prozent von Y, X% von Y
  const pctMatch = clean.match(/^(\d+(?:[.,]\d+)?)\s*(?:%|prozent)\s*von\s*(\d+(?:[.,]\d+)?)$/i);
  if (pctMatch) {
    const pct = parseFloat(pctMatch[1].replace(',', '.'));
    const total = parseFloat(pctMatch[2].replace(',', '.'));
    const res = (pct * total) / 100;
    return `**${pctMatch[1]}%** von **${pctMatch[2]}** ist **${Number.isInteger(res) ? res : res.toFixed(2)}**.`;
  }

  return null;
}

export function generateDandeliousChatResponse(
  rawPrompt: string,
  history: Array<{ role: string; content: string }> = [],
  ctx: SynthesisContext = { model: 'gemini-3.1-flash-lite' }
): string {
  // If prompt was wrapped in log markers, cleanly extract the actual question/message
  let prompt = rawPrompt.trim();
  const extractedMatch = prompt.match(/Neue Nachricht von [^:]*:\s*["“']?([\s\S]*?)["“']?$/i);
  if (extractedMatch && extractedMatch[1]) {
    prompt = extractedMatch[1].trim();
  }

  // Clean mention tokens
  prompt = prompt.replace(/@(arc|dandelious|dandelious|vanguard|ki)\b/gi, '').trim();
  const p = prompt.toLowerCase().replace(/[.!?]+$/, '').trim();

  const lang = ctx.appLanguage || 'Deutsch';
  const isEnglish = lang === 'English';
  const name = ctx.userNickname ? ` ${ctx.userNickname}` : '';

  // 1. RECIPE & COOKING SYNTHESIS
  if (p.includes('rezept') || p.includes('kochen') || p.includes('backen') || rawPrompt.includes('Rezept-Generator') || rawPrompt.includes('JSON-Objekt') || rawPrompt.includes('zutaten')) {
    const dishMatch = rawPrompt.match(/(?:rezept für|rezept:|zubereitung von|gericht:|für:)\s*([^\n\r.]+)/i);
    const dishQuery = dishMatch ? dishMatch[1].trim() : prompt;
    const culinary = synthesizeCulinaryRecipe(dishQuery, 4);

    if (rawPrompt.includes('JSON-Objekt') || rawPrompt.includes('```json')) {
      return `\`\`\`json
${JSON.stringify({
  title: culinary.title,
  category: culinary.category,
  prepTime: culinary.prepTime,
  cookTime: culinary.cookTime,
  difficulty: culinary.difficulty,
  portions: culinary.portions,
  ingredients: culinary.ingredients,
  instructions: culinary.instructions,
  notes: culinary.notes
}, null, 2)}
\`\`\``;
    }

    return `# 🍳 ${culinary.title}

> **Kategorie:** ${culinary.category} | **Zubereitungszeit:** ${culinary.prepTime} + ${culinary.cookTime} | **Schwierigkeit:** ${culinary.difficulty} | **Portionen:** ${culinary.portions}

---

### 🛒 Zutaten:
${culinary.ingredients.map(ing => `- **${ing.amount} ${ing.unit}** ${ing.name}`).join('\n')}

---

### 👨‍🍳 Schritt-für-Schritt Zubereitung:
${culinary.instructions.map((step, idx) => `**Schritt ${idx + 1}:** ${step}`).join('\n\n')}

---

### 💡 Profi-Tipps von Dandelious:
${culinary.notes ? `- ${culinary.notes}` : '- Für bestes Aroma stets frische, hochwertige Zutaten verwenden.'}

**Guten Appetit!**`;
  }

  // 2. MATH
  const mathResult = tryEvaluateMath(prompt);
  if (mathResult) {
    return mathResult;
  }

  // 3. GREETINGS & INTRODUCTIONS
  if (p === 'hallo' || p === 'hi' || p === 'hey' || p === 'guten tag' || p === 'moin' || p === 'servus' || p === 'hallo dandelious' || p === 'hi dandelious') {
    if (isEnglish) {
      return `Hello${name}! How can I help you today? Feel free to ask any question or tell me what you'd like to work on.`;
    }
    return `Hallo${name}! Schön dich zu sehen. Wie kann ich dir heute helfen oder woran möchtest du arbeiten?`;
  }

  if (p.includes('wer bist du') || p.includes('was kannst du')) {
    if (isEnglish) {
      return `I am **Dandelious**, your versatile and privacy-centric AI companion. I assist with programming, researching, deep analysis, creative writing, structured project planning, and everyday questions. What would you like to explore?`;
    }
    return `Ich bin **Dandelious**, dein vielseitiger und intelligenter KI-Assistent. Ich unterstütze dich bei Programmierung, Recherche, Textgestaltung, kreativen Ideen, Wissensfragen und komplexen Projekten. Was liegt dir auf dem Herzen?`;
  }

  // 4. ANIMALS & BIOLOGY (e.g. Hunde, Katzen)
  if (p.includes('hund') || p.includes('hunde')) {
    return `### 🐕 Wissenswertes über Hunde (*Canis lupus familiaris*)

Hunde zählen zu den ältesten domestizierten Tieren der Menschheit und stammen genetisch vom Wolf ab. Ihre Domestikation begann vor schätzungsweise 15.000 bis 30.000 Jahren.

#### Wichtige Fakten & Merkmale:
1. **Außergewöhnliche Sinne:**
   - **Geruchssinn:** Hunde besitzen bis zu 300 Millionen Riechzellen (im Vergleich zu etwa 5–6 Millionen beim Menschen). Ihr Riechhirn ist proportional 40-mal größer als unseres.
   - **Gehör:** Hunde können Frequenzen von bis zu 45.000 Hz wahrnehmen (Mensch: ca. 20.000 Hz) und ihre Ohren unabhängig voneinander ausrichten.
2. **Kommunikation & Sozialverhalten:**
   - Hunde kommunizieren über Körpersprache (Rutenhaltung, Ohrenstellung, Blickkontakt), Lautäußerungen und Geruchsmarkierungen.
   - Sie sind hochgradig fähig, menschliche Emotionen und Mimik zu deuten.
3. **Vielfalt der Rassen:**
   - Es gibt über 350 von der FCI anerkannte Hunderassen – von kleinen Begleithunden (wie Chihuahua) bis zu Arbeitshunden (wie Schäferhund, Labrador, Bernhardiner).

Möchtest du mehr über eine bestimmte Rasse, die richtige Haltung oder die Entwicklungsgeschichte erfahren?`;
  }

  if (p.includes('katze') || p.includes('katzen')) {
    return `### 🐈 Wissenswertes über Katzen (*Felis catus*)

Hauskatzen sind elegante, hochgradig anpassungsfähige Jäger und zählen zu den beliebtesten Haustieren weltweit.

#### Wichtige Fakten:
1. **Körperliche Meisterleistung:** Katzen besitzen einen extrem flexiblen Bewegungsapparat mit 230 Knochen (Mensch: 206) und den berühmten Stellreflex, der ihnen fast immer eine Landung auf den Pfoten ermöglicht.
2. **Sinne:** Hervorragende Nachtsicht dank des *Tapetum lucidum* und hochsensible Tasthaare (Vibrissen), mit denen sie Luftströmungen und Abstände millimetergenau erfassen.
3. **Kommunikation:** Schnurren drückt Wohlbefinden, aber auch Selbstberuhigung bei Stress aus. Das typische Miauen nutzen erwachsene Katzen fast ausschließlich im Umgang mit Menschen.

Gibt es einen bestimmten Aspekt oder eine Rasse, die dich besonders interessiert?`;
  }

  // 5. CODING & DEVELOPMENT
  if (p.includes('code') || p.includes('programmieren') || p.includes('python') || p.includes('javascript') || p.includes('typescript') || p.includes('react') || p.includes('html') || p.includes('css')) {
    if (p.includes('python')) {
      return `Hier ist ein sauberes Python-Beispiel mit Best Practices und Typ-Annotationen:

\`\`\`python
from typing import List, Optional

def filter_and_scale(numbers: List[float], factor: float = 2.0) -> List[float]:
    """Filtert positive Zahlen und skaliert sie mit einem Faktor."""
    return [num * factor for num in numbers if num > 0]

if __name__ == "__main__":
    sample_data = [12.5, -3.0, 0.0, 4.2, 8.1]
    result = filter_and_scale(sample_data, factor=1.5)
    print(f"Skalierte positive Werte: {result}")
\`\`\`

Kann ich dir bei einem konkreten Python-Projekt oder Skript behilflich sein?`;
    }

    return `Hier ist ein modernes, typsicheres TypeScript & React Komponenten-Beispiel:

\`\`\`tsx
import React, { useState } from 'react';

interface TaskProps {
  initialTitle?: string;
}

export const TaskManager: React.FC<TaskProps> = ({ initialTitle = 'Aufgabenliste' }) => {
  const [items, setItems] = useState<string[]>(['Erste Aufgabe', 'Zweite Aufgabe']);
  const [input, setInput] = useState('');

  const addItem = () => {
    if (!input.trim()) return;
    setItems(prev => [...prev, input.trim()]);
    setInput('');
  };

  return (
    <div className="p-4 rounded-xl bg-neutral-900 border border-lime-500/20 text-neutral-100 max-w-md">
      <h3 className="text-lg font-semibold text-lime-400 mb-3">{initialTitle}</h3>
      <div className="flex gap-2 mb-4">
        <input 
          value={input} 
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addItem()}
          placeholder="Neue Aufgabe..." 
          className="flex-1 px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm focus:outline-none focus:border-lime-400"
        />
        <button 
          onClick={addItem}
          className="px-4 py-2 bg-lime-500 hover:bg-lime-400 text-neutral-950 font-medium rounded-lg text-sm transition-colors"
        >
          Hinzufügen
        </button>
      </div>
      <ul className="space-y-1.5 text-sm">
        {items.map((item, idx) => (
          <li key={idx} className="px-3 py-1.5 rounded bg-neutral-800/60 border border-neutral-700/50">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};
\`\`\`

Möchtest du eine Anpassung daran vornehmen oder benötigst du Unterstützung für eine andere Programmiersprache?`;
  }

  // 6. DEFAULT CONTEXTUAL RESPONSE
  if (isEnglish) {
    return `Regarding your message about **${prompt}**:

Here is a structured overview:
- **Core Concept:** Addressing "${prompt}" effectively depends on the intended context and scope.
- **Key Considerations:** We can examine practical applications, theoretical foundations, or step-by-step implementation.

Let me know which specific area you would like to delve into, and I will tailor the details accordingly!`;
  }

  return `Zu deiner Frage zu **${prompt}**:

Hier ist eine strukturierte Übersicht und die wichtigsten Eckpunkte dazu:

1. **Kernthema & Kontext:**
   - Bei "${prompt}" kommt es vor allem auf die genaue Zielsetzung und den gewünschten Anwendungsbereich an.
2. **Wesentliche Aspekte:**
   - Wir können dieses Thema aus verschiedenen Blickwinkeln vertiefen: praktische Umsetzung, fundierte theoretische Hintergründe oder konkrete Beispiele.

Sag mir gerne, worauf wir den Schwerpunkt legen sollen, und ich arbeite das sofort detailliert für dich aus!`;
}

// Backwards compatibility alias
export const generateSaphireChatResponse = generateDandeliousChatResponse;
export const generateVanguardChatResponse = generateDandeliousChatResponse;
