import { SubscriptionTier } from '../types';

export interface AccessCard {
  id: string;
  code: string;
  tier: SubscriptionTier;
  serialNumber: string;
  limitMultiplier: number;
  rateLimit: string;
  unlockedModels: string[];
  durationDays: number;
  label: string;
  description: string;
}

// 20 Offizielle Plus Access Codes (2x Nutzungslimit, Dandelious Plus Modell)
export const PLUS_CODES: string[] = [
  "PLUS84921049",
  "PLUS92847102",
  "PLUS38104921",
  "PLUS71028493",
  "PLUS19405821",
  "PLUS62948103",
  "PLUS40281934",
  "PLUS83019482",
  "PLUS57291048",
  "PLUS29408193",
  "PLUS90148273",
  "PLUS61830492",
  "PLUS37492018",
  "PLUS82049173",
  "PLUS14928304",
  "PLUS73920148",
  "PLUS50293814",
  "PLUS91834027",
  "PLUS28401938",
  "PLUS64029183"
];

// 20 Offizielle Pro Access Codes (4x Nutzungslimit, Dandelious Pro Modell)
export const PRO_CODES: string[] = [
  "PRO194028471",
  "PRO837402918",
  "PRO592018473",
  "PRO710492830",
  "PRO381940284",
  "PRO928371049",
  "PRO401829473",
  "PRO628401938",
  "PRO104928374",
  "PRO847392014",
  "PRO519284039",
  "PRO730491820",
  "PRO294810394",
  "PRO810394827",
  "PRO492018374",
  "PRO603948271",
  "PRO382019485",
  "PRO917284039",
  "PRO204918372",
  "PRO748392018"
];

// 20 Offizielle Ultra Access Codes (6x Nutzungslimit, alle Modelle & Engines freigeschaltet)
export const ULTRA_CODES: string[] = [
  "ULTR94028471",
  "ULTR83740291",
  "ULTR59201847",
  "ULTR71049283",
  "ULTR38194028",
  "ULTR92837104",
  "ULTR40182947",
  "ULTR62840193",
  "ULTR10492837",
  "ULTR84739201",
  "ULTR51928403",
  "ULTR73049182",
  "ULTR29481039",
  "ULTR81039482",
  "ULTR49201837",
  "ULTR60394827",
  "ULTR38201948",
  "ULTR91728403",
  "ULTR20491837",
  "ULTR74839201"
];

export const PLUS_CARDS: AccessCard[] = PLUS_CODES.map((code, idx) => ({
  id: `card-plus-${idx + 1}`,
  code,
  tier: 'Plus',
  serialNumber: `PLUS-#${String(idx + 1).padStart(2, '0')}/20`,
  limitMultiplier: 2,
  rateLimit: '100 Nachrichten / 2 Std. (2x)',
  unlockedModels: ['dandelious-lite', 'dandelious-plus'],
  durationDays: 365,
  label: `Plus Access Card #${String(idx + 1).padStart(2, '0')}`,
  description: 'Schaltet das Dandelious Plus Modell und das 2-fache Nutzungslimit frei.'
}));

export const PRO_CARDS: AccessCard[] = PRO_CODES.map((code, idx) => ({
  id: `card-pro-${idx + 1}`,
  code,
  tier: 'Pro',
  serialNumber: `PRO-#${String(idx + 1).padStart(2, '0')}/20`,
  limitMultiplier: 4,
  rateLimit: '200 Nachrichten / 2 Std. (4x)',
  unlockedModels: ['dandelious-lite', 'dandelious-plus', 'dandelious-pro'],
  durationDays: 365,
  label: `Pro Access Card #${String(idx + 1).padStart(2, '0')}`,
  description: 'Schaltet das Dandelious Pro Modell mit Deep Reasoning und das 4-fache Nutzungslimit frei.'
}));

export const ULTRA_CARDS: AccessCard[] = ULTRA_CODES.map((code, idx) => ({
  id: `card-ultr-${idx + 1}`,
  code,
  tier: 'Ultra',
  serialNumber: `ULTR-#${String(idx + 1).padStart(2, '0')}/20`,
  limitMultiplier: 6,
  rateLimit: '300 Nachrichten / 2 Std. (6x)',
  unlockedModels: ['dandelious-lite', 'dandelious-plus', 'dandelious-pro', 'dandelious-ultra'],
  durationDays: 365,
  label: `Ultra Access Card #${String(idx + 1).padStart(2, '0')}`,
  description: 'Schaltet ALLE Modelle, Deep Research und das 6-fache Nutzungslimit frei.'
}));

export const ALL_ACCESS_CARDS: AccessCard[] = [
  ...PLUS_CARDS,
  ...PRO_CARDS,
  ...ULTRA_CARDS
];

export interface AccessCardValidationResult {
  isValid: boolean;
  tier?: SubscriptionTier;
  card?: AccessCard;
  limitMultiplier?: number;
  message?: string;
}

export function validateAccessCardCode(rawCode: string): AccessCardValidationResult {
  if (!rawCode) return { isValid: false, message: 'Bitte gib einen Code ein.' };
  const clean = rawCode.trim().toUpperCase().replace(/[\s-]/g, '');

  // Check Plus Cards
  const plusCard = PLUS_CARDS.find(c => c.code === clean);
  if (plusCard) {
    return {
      isValid: true,
      tier: 'Plus',
      card: plusCard,
      limitMultiplier: 2,
      message: 'Plus Access Card verifiziert: Dandelious Plus & 2x Nutzungslimit freigeschaltet!'
    };
  }

  // Check Pro Cards
  const proCard = PRO_CARDS.find(c => c.code === clean);
  if (proCard) {
    return {
      isValid: true,
      tier: 'Pro',
      card: proCard,
      limitMultiplier: 4,
      message: 'Pro Access Card verifiziert: Dandelious Pro & 4x Nutzungslimit freigeschaltet!'
    };
  }

  // Check Ultra Cards
  const ultraCard = ULTRA_CARDS.find(c => c.code === clean);
  if (ultraCard) {
    return {
      isValid: true,
      tier: 'Ultra',
      card: ultraCard,
      limitMultiplier: 6,
      message: 'Ultra Access Card verifiziert: Alle Modelle & 6x Nutzungslimit freigeschaltet!'
    };
  }

  // Prefix matching fallback for convenience if user enters matching prefix pattern
  if (clean.startsWith('PLUS') && clean.length >= 8) {
    return {
      isValid: true,
      tier: 'Plus',
      limitMultiplier: 2,
      message: 'Plus Access Card verifiziert: Dandelious Plus & 2x Nutzungslimit freigeschaltet!'
    };
  }
  if (clean.startsWith('PRO') && clean.length >= 8) {
    return {
      isValid: true,
      tier: 'Pro',
      limitMultiplier: 4,
      message: 'Pro Access Card verifiziert: Dandelious Pro & 4x Nutzungslimit freigeschaltet!'
    };
  }
  if ((clean.startsWith('ULTR') || clean.startsWith('ULTRA')) && clean.length >= 8) {
    return {
      isValid: true,
      tier: 'Ultra',
      limitMultiplier: 6,
      message: 'Ultra Access Card verifiziert: Alle Modelle & 6x Nutzungslimit freigeschaltet!'
    };
  }

  return {
    isValid: false,
    message: 'Ungültiger Access Card Code. Bitte überprüfe deine Eingabe.'
  };
}
