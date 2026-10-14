// OS Adaptation Engine for Vanguard, ARC & Dice
// Provides pixel-perfect UI adaptation for iOS, iPadOS, macOS, Android, Windows, and Linux

export type OSType = 'ios' | 'ipados' | 'macos' | 'android' | 'windows' | 'linux';
export type OSTarget = 'auto' | OSType;

export interface OSProfile {
  id: OSType;
  name: string;
  category: 'apple' | 'google' | 'microsoft' | 'linux';
  fontFamily: string;
  cornerClass: string;
  cardRadius: string;
  pillRadius: string;
  modalRadius: string;
  blurClass: string;
  accentBorder: string;
  windowChrome: 'traffic-lights' | 'fluent-buttons' | 'android-pill' | 'ios-bar' | 'gnome-bar';
  description: string;
  badgeLabel: string;
  headerBarHeight: string;
  dockStyle: string;
}

export const OS_PROFILES: Record<OSType, OSProfile> = {
  ios: {
    id: 'ios',
    name: 'Apple iOS',
    category: 'apple',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", sans-serif',
    cornerClass: 'rounded-[26px]',
    cardRadius: 'rounded-[20px]',
    pillRadius: 'rounded-full',
    modalRadius: 'rounded-[28px]',
    blurClass: 'backdrop-blur-2xl',
    accentBorder: 'border-white/15',
    windowChrome: 'ios-bar',
    description: 'Cupertino Haptik, fließende Glasflächen, abgerundete Squircles und Safe-Area-Optimierung für iPhone.',
    badgeLabel: 'iOS Optimiert',
    headerBarHeight: 'h-11',
    dockStyle: 'bg-black/60 backdrop-blur-2xl border-t border-white/10'
  },
  ipados: {
    id: 'ipados',
    name: 'Apple iPadOS',
    category: 'apple',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", -apple-system-headline, sans-serif',
    cornerClass: 'rounded-[24px]',
    cardRadius: 'rounded-[18px]',
    pillRadius: 'rounded-full',
    modalRadius: 'rounded-[24px]',
    blurClass: 'backdrop-blur-3xl',
    accentBorder: 'border-white/15',
    windowChrome: 'traffic-lights',
    description: 'Stage Manager Ergonomie, Acryl-Transparenz, Multitasking-Pill und Split-View-Layout für iPad.',
    badgeLabel: 'iPadOS Split-View',
    headerBarHeight: 'h-12',
    dockStyle: 'bg-black/50 backdrop-blur-3xl border border-white/15 shadow-2xl rounded-2xl'
  },
  macos: {
    id: 'macos',
    name: 'Apple macOS',
    category: 'apple',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
    cornerClass: 'rounded-[16px]',
    cardRadius: 'rounded-[12px]',
    pillRadius: 'rounded-lg',
    modalRadius: 'rounded-[16px]',
    blurClass: 'backdrop-blur-2xl',
    accentBorder: 'border-white/12',
    windowChrome: 'traffic-lights',
    description: 'Native Ampel-Window-Controls (🔴 🟡 🟢), kompakte Desktop-Seitenleiste und Tastenkürzel-Integration für Mac.',
    badgeLabel: 'macOS Desktop',
    headerBarHeight: 'h-10',
    dockStyle: 'bg-black/40 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-2xl'
  },
  android: {
    id: 'android',
    name: 'Google Android (Material 3)',
    category: 'google',
    fontFamily: 'Roboto, "Google Sans", system-ui, -apple-system, sans-serif',
    cornerClass: 'rounded-[28px]',
    cardRadius: 'rounded-[20px]',
    pillRadius: 'rounded-full',
    modalRadius: 'rounded-[28px]',
    blurClass: 'backdrop-blur-xl',
    accentBorder: 'border-white/10',
    windowChrome: 'android-pill',
    description: 'Material 3 Tonal Elevation, dynamische Konturen, Floating Action Button (FAB) und ergonomische Einhandbedienung.',
    badgeLabel: 'Material 3',
    headerBarHeight: 'h-14',
    dockStyle: 'bg-[#18181b] border-t border-white/5 shadow-lg'
  },
  windows: {
    id: 'windows',
    name: 'Microsoft Windows 11',
    category: 'microsoft',
    fontFamily: '"Segoe UI Variable Text", "Segoe UI Variable Display", "Segoe UI", system-ui, sans-serif',
    cornerClass: 'rounded-[10px]',
    cardRadius: 'rounded-[8px]',
    pillRadius: 'rounded-md',
    modalRadius: 'rounded-[10px]',
    blurClass: 'backdrop-blur-xl',
    accentBorder: 'border-white/15',
    windowChrome: 'fluent-buttons',
    description: 'Windows 11 Mica & Acrylic Glass, Desktop Caption Buttons (🗕 🗖 ✕) und Fluent Command Bar.',
    badgeLabel: 'Fluent UI (Win 11)',
    headerBarHeight: 'h-9',
    dockStyle: 'bg-[#0f0f12]/90 backdrop-blur-xl border border-white/15 shadow-xl rounded-md'
  },
  linux: {
    id: 'linux',
    name: 'Linux (GNOME / GTK4)',
    category: 'linux',
    fontFamily: 'Ubuntu, Cantarell, "Liberation Sans", "Noto Sans", system-ui, sans-serif',
    cornerClass: 'rounded-[12px]',
    cardRadius: 'rounded-[8px]',
    pillRadius: 'rounded-md',
    modalRadius: 'rounded-[12px]',
    blurClass: 'backdrop-blur-lg',
    accentBorder: 'border-white/10',
    windowChrome: 'gnome-bar',
    description: 'Minimalistisches Adwaita/GTK4 HeaderBar Design mit zentriertem Titel, ✕-Button und maximaler Raumausnutzung.',
    badgeLabel: 'GNOME / GTK4',
    headerBarHeight: 'h-10',
    dockStyle: 'bg-[#121216] border border-white/10 shadow-lg rounded-lg'
  }
};

export function detectNativeOS(): OSType {
  if (typeof window === 'undefined') return 'macos';

  const userAgent = (navigator.userAgent || '').toLowerCase();
  const platform = (navigator.platform || '').toLowerCase();
  const maxTouchPoints = navigator.maxTouchPoints || 0;

  // 1. Check iPadOS (either mentions iPad or is Macintosh with multitouch points)
  if (/ipad/.test(userAgent) || (/macintosh/.test(userAgent) && maxTouchPoints > 1)) {
    return 'ipados';
  }

  // 2. Check iOS (iPhone, iPod)
  if (/iphone|ipod/.test(userAgent)) {
    return 'ios';
  }

  // 3. Check macOS (Macintosh without touch points)
  if (/macintosh|mac os x/.test(userAgent)) {
    return 'macos';
  }

  // 4. Check Android
  if (/android/.test(userAgent)) {
    return 'android';
  }

  // 5. Check Windows
  if (/win32|win64|windows|wince/.test(userAgent) || /windows/.test(platform)) {
    return 'windows';
  }

  // 6. Check Linux / Unix
  if (/linux|x11|ubuntu|debian|fedora/.test(userAgent) || /linux/.test(platform)) {
    return 'linux';
  }

  return 'macos';
}

export function resolveEffectiveOS(settingTarget?: OSTarget): OSType {
  if (!settingTarget || settingTarget === 'auto') {
    return detectNativeOS();
  }
  return settingTarget;
}

export function applyOSClassesToDocument(os: OSType) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  // Remove all previous OS classes
  root.classList.remove('os-ios', 'os-ipados', 'os-macos', 'os-android', 'os-windows', 'os-linux');
  root.classList.add(`os-${os}`);

  // Set CSS custom property for typography & corner radius
  const profile = OS_PROFILES[os];
  root.style.setProperty('--os-font-family', profile.fontFamily);
}
