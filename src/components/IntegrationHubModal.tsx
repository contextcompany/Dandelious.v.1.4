import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Code2, Copy, Check, Terminal, Play, Server, Zap, Globe, Sparkles } from 'lucide-react';
import { DotMatrixCanvas } from './DotMatrixCanvas';

interface IntegrationHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IntegrationHubModal: React.FC<IntegrationHubModalProps> = ({ isOpen, onClose }) => {
  const [selectedLang, setSelectedLang] = useState<'curl' | 'python' | 'node' | 'rust'>('curl');
  const [copied, setCopied] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Escape key handler

  const currentHost = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  const snippets = {
    curl: `curl -X POST "${currentHost}/api/v1/chat/completions" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gemma-2-9b-it",
    "messages": [
      {"role": "user", "content": "Hallo Reshaped Engine!"}
    ],
    "temperature": 0.7
  }'`,

    python: `import requests

url = "${currentHost}/api/v1/chat/completions"
payload = {
    "model": "gemma-2-9b-it",
    "messages": [
        {"role": "system", "content": "Du bist die Reshaped Engine SLM."},
        {"role": "user", "content": "Generiere eine Zusammenfassung."}
    ],
    "temperature": 0.7
}

response = requests.post(url, json=payload)
data = response.json()
print(data['choices'][0]['message']['content'])`,

    node: `import fetch from 'node-fetch';

async function queryReshapedEngine() {
  const res = await fetch('${currentHost}/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gemma-2-9b-it',
      messages: [{ role: 'user', content: 'Verarbeite Datenpaket 42.' }],
      temperature: 0.7
    })
  });

  const data = await res.json();
  console.log('Antwort:', data.choices[0].message.content);
}

queryReshapedEngine();`,

    rust: `use reqwest::Client;
use serde_json::json;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std.error::Error>> {
    let client = Client::new();
    let res = client.post("${currentHost}/api/v1/chat/completions")
        .json(&json!({
            "model": "gemma-2-9b-it",
            "messages": [{"role": "user", "content": "Rust Reshaped Engine Test"}]
        }))
        .send()
        .await?;

    let text = res.text().await?;
    println!("Response: {}", text);
    Ok(())
}`
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(snippets[selectedLang]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemma-2-9b-it',
          messages: [{ role: 'user', content: 'Dies ist ein automatisierter System-Integrationstest der Reshaped Engine.' }]
        })
      });
      const data = await res.json();
      setTestResult(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setTestResult(`Fehler: ${err.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          key="integration-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transform-gpu"
          onClick={onClose}
        >
          <motion.div 
            key="integration-modal"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-3xl bg-[#111113] border border-white/15 rounded-3xl shadow-2xl overflow-hidden glass-panel flex flex-col max-h-[90vh] transform-gpu relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background Dot Matrix */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
              <DotMatrixCanvas density={22} interactive={false} />
            </div>
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-lime-500/10 text-lime-400 border border-lime-500/20">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Reshaped Engine API Integration Hub</h3>
              <p className="text-xs text-slate-400">REST & OpenAI-kompatible Schnittstelle für externe Systeme</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
          <div className="p-4 rounded-2xl bg-lime-950/30 border border-lime-500/30 flex items-start gap-3">
            <Zap className="w-5 h-5 text-lime-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-white text-xs">Nahtlose Einbindung in bestehende Software</h4>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                Dandelious stellt auf dem lokalen Server einen universellen Endpunkt unter <code className="bg-black/60 px-1.5 py-0.5 rounded text-lime-300 font-mono">/api/v1/chat/completions</code> bereit. Jedes externe System (Python, Node.js, C#, Rust) kann Dandelious wie eine Standard-OpenAI API ansprechen.
              </p>
            </div>
          </div>

          {/* Language Tabs */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {(['curl', 'python', 'node', 'rust'] as const).map(lang => (
                <button
                  key={lang}
                  onClick={() => setSelectedLang(lang)}
                  className={`px-3.5 py-1.5 rounded-xl font-mono text-xs capitalize transition-all cursor-pointer ${
                    selectedLang === lang
                      ? 'bg-lime-500/20 text-lime-300 border border-lime-400 font-bold'
                      : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Kopiert!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Code Kopieren
                </>
              )}
            </button>
          </div>

          {/* Code Viewer */}
          <div className="relative rounded-2xl bg-[#040812] border border-white/10 p-4 font-mono text-xs overflow-x-auto text-slate-200">
            <pre>{snippets[selectedLang]}</pre>
          </div>

          {/* Live Test Console */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" /> Schnittstelle Live Testen
              </h4>
              <button
                onClick={handleRunTest}
                disabled={isTesting}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                {isTesting ? 'Wird verarbeitet...' : 'API Request ausführen'}
              </button>
            </div>

            {testResult && (
              <div className="p-3 rounded-xl bg-[#02050b] border border-emerald-500/30 font-mono text-[11px] text-emerald-300 overflow-x-auto max-h-48">
                <pre>{testResult}</pre>
              </div>
            )}
          </div>
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
