import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Terminal, Check, Copy, Shield, FileCheck, Layers, Cpu } from 'lucide-react';
import { DotMatrixCanvas } from './DotMatrixCanvas';
import { DandeliousLogo } from './DandeliousLogo';

interface DesktopExporterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DesktopExporterModal: React.FC<DesktopExporterModalProps> = ({ isOpen, onClose }) => {
  const [copiedStep, setCopiedStep] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'guide' | 'electron_main' | 'builder_json'>('guide');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const steps = [
    {
      step: 1,
      title: 'Projekt als ZIP exportieren oder herunterladen',
      desc: 'Exportiere den Dandelious Quellcode über das KI Studio App-Menü auf deinen lokalen Windows-PC.',
      command: 'npm install'
    },
    {
      step: 2,
      title: 'Electron & Electron-Builder installieren',
      desc: 'Führe im Ordner des Projekts folgenden Befehl im Terminal aus, um die Paketierungs-Tools hinzuzufügen:',
      command: 'npm install --save-dev electron electron-builder'
    },
    {
      step: 3,
      title: 'Anwendung bauen & Standalone Server kompilieren',
      desc: 'Kompiliere das Frontend und den Reshaped Engine Server:',
      command: 'npm run build'
    },
    {
      step: 4,
      title: 'Finale .exe Datei generieren',
      desc: 'Erstelle den Installer (.exe) im Ordner dist_desktop:',
      command: 'npx electron-builder --win nsis'
    }
  ];

  const electronMainCode = `// electron-main.js - Reshaped Engine Dandelious Launcher
const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    backgroundColor: '#03060d',
    title: 'Dandelious AI',
    webPreferences: { nodeIntegration: false, contextIsolation: true }
  });
  mainWindow.loadURL('http://localhost:3000');
}

function startBackendServer() {
  const serverPath = path.join(__dirname, 'dist', 'server.cjs');
  serverProcess = spawn('node', [serverPath], {
    env: { ...process.env, PORT: '3000', NODE_ENV: 'production' }
  });
}

app.whenReady().then(() => {
  startBackendServer();
  setTimeout(createWindow, 1000);
});

app.on('window-all-closed', () => {
  if (serverProcess) serverProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});`;

  const builderJsonCode = `{
  "appId": "com.dandelious.studio",
  "productName": "Dandelious",
  "copyright": "Copyright © 2026 Dandelious Ecosystem",
  "directories": { "output": "dist_desktop" },
  "files": [ "dist/**/*", "electron-main.js", "package.json" ],
  "win": {
    "target": [{ "target": "nsis", "arch": ["x64"] }]
  }
}`;

  const copyToClipboard = (text: string, stepIndex: number) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(stepIndex);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          key="exporter-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl transform-gpu"
          onClick={onClose}
        >
          <motion.div 
            key="exporter-modal"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-3xl bg-[#0b0c10]/95 border border-white/15 rounded-[28px] shadow-[0_25px_80px_rgba(0,0,0,0.85)] backdrop-blur-3xl overflow-hidden flex flex-col max-h-[90vh] transform-gpu relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background Dot Matrix */}
            <div className="absolute inset-0 pointer-events-none opacity-18">
              <DotMatrixCanvas density={20} interactive={false} />
            </div>
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DandeliousLogo className="w-10 h-10 shadow-lg shrink-0" variant="badge" />
            <div>
              <h3 className="font-bold text-white text-base">Dandelious Desktop Exporter & App-Paket</h3>
              <p className="text-xs text-slate-400">Dandelious als eigenständige Desktop- oder Mobilanwendung installieren</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 bg-white/[0.02] px-6 pt-2">
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'guide' ? 'border-emerald-400 text-emerald-300' : 'border-transparent text-slate-400'
            }`}
          >
            <Terminal className="w-4 h-4" /> 4-Schritte Bauanleitung
          </button>
          <button
            onClick={() => setActiveTab('electron_main')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'electron_main' ? 'border-emerald-400 text-emerald-300' : 'border-transparent text-slate-400'
            }`}
          >
            <Layers className="w-4 h-4" /> electron-main.js
          </button>
          <button
            onClick={() => setActiveTab('builder_json')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'builder_json' ? 'border-emerald-400 text-emerald-300' : 'border-transparent text-slate-400'
            }`}
          >
            <FileCheck className="w-4 h-4" /> electron-builder.json
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300 flex-1">
          {activeTab === 'guide' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-3">
                <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-white">Eigenständige Funktionsgarantie</h4>
                  <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                    Die generierte `.exe` bringt den gebündelten Express-Backend-Server (Reshaped Engine) und den Dandelious Client automatisch mit. Jeder Nutzer, der die `.exe` startet, kann sofort ohne zusätzliche Installationen chatten!
                  </p>
                </div>
              </div>

              {/* Step by step list */}
              <div className="space-y-3">
                {steps.map((s, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-[10px]">
                          {s.step}
                        </span>
                        {s.title}
                      </span>
                      <button
                        onClick={() => copyToClipboard(s.command, idx)}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] text-slate-200 flex items-center gap-1 transition-colors"
                      >
                        {copiedStep === idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        Befehl kopieren
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400">{s.desc}</p>
                    <div className="p-2.5 rounded-xl bg-[#03060d] border border-white/10 font-mono text-[11px] text-emerald-300">
                      <code>{s.command}</code>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'electron_main' && (
            <div className="space-y-3">
              <p className="text-slate-400">Diese Datei ist bereits in deinem Projektstammordner als <code className="text-emerald-300">electron-main.js</code> gespeichert.</p>
              <div className="p-4 rounded-2xl bg-[#03060d] border border-white/10 font-mono text-xs text-slate-200 overflow-x-auto">
                <pre>{electronMainCode}</pre>
              </div>
            </div>
          )}

          {activeTab === 'builder_json' && (
            <div className="space-y-3">
              <p className="text-slate-400">Konfigurationsdatei für Windows Executable Build (<code className="text-emerald-300">electron-builder.json</code>).</p>
              <div className="p-4 rounded-2xl bg-[#03060d] border border-white/10 font-mono text-xs text-slate-200 overflow-x-auto">
                <pre>{builderJsonCode}</pre>
              </div>
            </div>
          )}
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
