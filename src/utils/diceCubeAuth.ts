import { VALID_DICE_CUBES, DiceCubeEntry } from '../data/diceCubes';

export type { DiceCubeEntry };

const STORAGE_ACTIVATED_CUBE = 'vanguard_dicecube_activated_code';
const STORAGE_ACTIVATION_DATE = 'vanguard_dicecube_activation_date';
const STORAGE_USED_CODES_LIST = 'vanguard_dicecubes_claimed_registry';

export function normalizeDiceCubeCode(input: string): string {
  return (input || '').replace(/[\s\-_]/g, '').toUpperCase().trim();
}

export function findDiceCube(rawCode: string): DiceCubeEntry | undefined {
  const normalized = normalizeDiceCubeCode(rawCode);
  if (!normalized || normalized.length !== 10) return undefined;
  return VALID_DICE_CUBES.find(cube => cube.code === normalized);
}

export function isDiceCubeUnlocked(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const savedCode = localStorage.getItem(STORAGE_ACTIVATED_CUBE);
    if (!savedCode) return false;
    const cube = findDiceCube(savedCode);
    return !!cube;
  } catch (e) {
    return false;
  }
}

export function getActiveDiceCube(): DiceCubeEntry | null {
  if (typeof window === 'undefined') return null;
  try {
    const savedCode = localStorage.getItem(STORAGE_ACTIVATED_CUBE);
    if (!savedCode) return null;
    return findDiceCube(savedCode) || null;
  } catch (e) {
    return null;
  }
}

export function getClaimedDiceCubes(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_USED_CODES_LIST);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  
  // By default, if an active cube exists, include it
  const active = getActiveDiceCube();
  return active ? [active.code] : [];
}

export function activateDiceCube(rawCode: string): { success: boolean; message: string; cube?: DiceCubeEntry } {
  const normalized = normalizeDiceCubeCode(rawCode);
  
  if (!normalized) {
    return { success: false, message: 'Bitte gib deinen 10-stelligen DiceCube-Code ein.' };
  }

  if (normalized.length !== 10) {
    return { success: false, message: `Der Code muss exakt 10 Zeichen lang sein (aktuell: ${normalized.length}).` };
  }

  const cube = VALID_DICE_CUBES.find(c => c.code === normalized);
  if (!cube) {
    return { success: false, message: 'Ungültiger DiceCube-Schlüssel. Der Code existiert nicht im System.' };
  }

  try {
    localStorage.setItem(STORAGE_ACTIVATED_CUBE, cube.code);
    localStorage.setItem(STORAGE_ACTIVATION_DATE, new Date().toISOString());

    const claimed = getClaimedDiceCubes();
    if (!claimed.includes(cube.code)) {
      claimed.push(cube.code);
      localStorage.setItem(STORAGE_USED_CODES_LIST, JSON.stringify(claimed));
    }

    return { 
      success: true, 
      message: `DiceCube #${cube.id.toString().padStart(2, '0')} (${cube.label}) erfolgreich aktiviert!`,
      cube 
    };
  } catch (e) {
    return { success: false, message: 'Fehler beim Speichern der DiceCube-Aktivierung.' };
  }
}

export function deactivateDiceCube(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_ACTIVATED_CUBE);
    localStorage.removeItem(STORAGE_ACTIVATION_DATE);
  } catch (e) {}
}
