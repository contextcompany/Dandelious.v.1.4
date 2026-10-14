// 30 Valid & Exclusive 10-Character DiceCubes for Dice Studio Access
// Exactly 30 unique cubes exist in the Dandelious ecosystem.

export interface DiceCubeEntry {
  id: number;
  code: string; // Exactly 10 characters
  label: string;
  tier: 'Shark Edition' | 'Octopus Architecture' | 'Nautilus Enterprise';
  description: string;
  allocatedTo?: string;
  isDevMaster?: boolean;
}

export const VALID_DICE_CUBES: DiceCubeEntry[] = [
  { id: 1,  code: 'DCUBE01A9X', label: 'DiceCube #01 (Alpha Genesis)', tier: 'Nautilus Enterprise', description: 'Genesis Master Key für Vollzugriff auf alle Coding-Engines.' },
  { id: 2,  code: 'DCUBE02K8M', label: 'DiceCube #02 (Dandelious Core)', tier: 'Nautilus Enterprise', description: 'Enterprise Lizenzschlüssel mit erweiterten Context-Pipelines.' },
  { id: 3,  code: 'DCUBE03P7R', label: 'DiceCube #03 (Deep Synthese)', tier: 'Nautilus Enterprise', description: 'High-Performance Lizenz für komplexe State-Architekturen.' },
  { id: 4,  code: 'DCUBE04T6V', label: 'DiceCube #04 (Matrix Core)', tier: 'Octopus Architecture', description: 'Spezial-Cube für interaktive UI-Widgets und Web-Games.' },
  { id: 5,  code: 'DCUBE05W5B', label: 'DiceCube #05 (Quantum Flow)', tier: 'Octopus Architecture', description: 'Optimiert für dynamische State-Verwaltung & Canvas.' },
  { id: 6,  code: 'DCUBE06Y4D', label: 'DiceCube #06 (Liquid Glass)', tier: 'Octopus Architecture', description: 'Design-Fokussierter Cube für Glassmorphismus-Komponenten.' },
  { id: 7,  code: 'DCUBE07Z3F', label: 'DiceCube #07 (Apex Vector)', tier: 'Octopus Architecture', description: 'Erweiterte Sandbox-Rendering Kapazität.' },
  { id: 8,  code: 'DCUBE08Q2H', label: 'DiceCube #08 (Cyber Pulse)', tier: 'Octopus Architecture', description: 'Echtzeit-Debugging und Auto-Fixing Berechtigung.' },
  { id: 9,  code: 'DCUBE09J1K', label: 'DiceCube #09 (Neon Forge)', tier: 'Shark Edition', description: 'Agile Web-Engine für rasante HTML5 Prototypen.' },
  { id: 10, code: 'DCUBE10L9N', label: 'DiceCube #10 (Flux Horizon)', tier: 'Shark Edition', description: 'Standardzugriff auf alle Live-Sandbox Umgebungen.' },
  { id: 11, code: 'DCUBE11M8Q', label: 'DiceCube #11 (Stellar Byte)', tier: 'Shark Edition', description: 'Schnelle Komponenten-Generierung mit Tailwind CSS.' },
  { id: 12, code: 'DCUBE12N7S', label: 'DiceCube #12 (Orbit Engine)', tier: 'Shark Edition', description: 'Direkte Browser-Vorschau und Download-Funktion.' },
  { id: 13, code: 'DCUBE13P6U', label: 'DiceCube #13 (Hyper Prism)', tier: 'Shark Edition', description: 'Schnelle Prototypisierung von Formularen & Rechnern.' },
  { id: 14, code: 'DCUBE14R5W', label: 'DiceCube #14 (Vortex Craft)', tier: 'Shark Edition', description: 'Multi-Device Emulation (Desktop, Tablet, Smartphone).' },
  { id: 15, code: 'DCUBE15S4Y', label: 'DiceCube #15 (Aura Matrix)', tier: 'Shark Edition', description: 'Undo / Redo Verlaufshistorie für alle Code-Generationen.' },
  { id: 16, code: 'DCUBE16T3A', label: 'DiceCube #16 (Echo Titan)', tier: 'Shark Edition', description: 'Lucide-Icons & SVG Vector Synthese freigeschaltet.' },
  { id: 17, code: 'DCUBE17V2C', label: 'DiceCube #17 (Solstice Ray)', tier: 'Shark Edition', description: 'Direkte Iframe Sandbox Ausführung ohne Latenz.' },
  { id: 18, code: 'DCUBE18W1E', label: 'DiceCube #18 (Chronos Web)', tier: 'Shark Edition', description: 'Befehlsschnittstelle für reaktive Web-Anwendungen.' },
  { id: 19, code: 'DCUBE19X9G', label: 'DiceCube #19 (Nova Spark)', tier: 'Shark Edition', description: 'Lokale State-Simulation und Speicher-Synchronisation.' },
  { id: 20, code: 'DCUBE20Y8J', label: 'DiceCube #20 (Aether Pulse)', tier: 'Shark Edition', description: 'Code-Inspektion und integrierte Laufzeit-Konsole.' },
  { id: 21, code: 'DCUBE21Z7L', label: 'DiceCube #21 (Titan Forge)', tier: 'Octopus Architecture', description: 'Erweiterte Logik-Synthese für Multi-Screen Apps.' },
  { id: 22, code: 'DCUBE22A6N', label: 'DiceCube #22 (Zenith Spark)', tier: 'Octopus Architecture', description: 'Deep Reasoning für komplexe mathematische Module.' },
  { id: 23, code: 'DCUBE23B5P', label: 'DiceCube #23 (Nexus Flow)', tier: 'Octopus Architecture', description: 'State-Machine & Tab-Controller Generator.' },
  { id: 24, code: 'DCUBE24C4R', label: 'DiceCube #24 (Pulse Matrix)', tier: 'Octopus Architecture', description: 'Interaktive Partikelsysteme und Spiel-Engines.' },
  { id: 25, code: 'DCUBE25D3T', label: 'DiceCube #25 (Omni Vector)', tier: 'Octopus Architecture', description: 'Echtzeit-Telemetrie und Fehler-Interzeption.' },
  { id: 26, code: 'DCUBE26E2V', label: 'DiceCube #26 (Apex Crystal)', tier: 'Nautilus Enterprise', description: '32k Token Context-Kapazität für Großprojekte.' },
  { id: 27, code: 'DCUBE27F1X', label: 'DiceCube #27 (Cyber Sphere)', tier: 'Nautilus Enterprise', description: 'Fullstack-Simulation & Enterprise Blueprint Engine.' },
  { id: 28, code: 'DCUBE28G9Z', label: 'DiceCube #28 (Dandelious Apex)', tier: 'Nautilus Enterprise', description: 'Unbegrenzte Iterationen & Sofortige Fehler-Heilung.' },
  { id: 29, code: 'DCUBE29H8B', label: 'DiceCube #29 (Infinity Node)', tier: 'Nautilus Enterprise', description: 'Höchste Rechenpriorität in der Dandelious Matrix.' },
  { id: 30, code: 'DCUBE30K7D', label: 'DiceCube #30 (Omega Prime)', tier: 'Nautilus Enterprise', description: 'Der 30. und finale DiceCube des Dandelious Netzwerks.' }
];

export const TOTAL_DICE_CUBES_COUNT = 30;
