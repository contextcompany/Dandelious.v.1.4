import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export interface DeviceInfo {
  deviceType: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  orientation: 'portrait' | 'landscape';
  screenWidth: number;
  screenHeight: number;
  userAgent: string;
}

export function isStandaloneApp(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    // 1. Check matchMedia display-mode standalone, minimal-ui, fullscreen or window-controls-overlay
    const isStandaloneDisplay = Boolean(
      window.matchMedia && (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: minimal-ui)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        window.matchMedia('(display-mode: window-controls-overlay)').matches
      )
    );

    // 2. iOS Safari standalone mode (when added to Home Screen)
    const isIOSStandalone = Boolean((window.navigator as any)?.standalone === true);

    // 3. Android TWA / WebAPK referrer
    const isAndroidApp = typeof document !== 'undefined' && Boolean(document.referrer?.includes('android-app://'));

    // 4. Stored user preference override
    const storedMode = localStorage.getItem('dandelious_app_mode');
    if (storedMode === 'webapp') return true;
    if (storedMode === 'web') return false;

    // 5. URL search or hash param
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('mode') === 'webapp' || searchParams.get('app') === 'true' || window.location.hash.includes('webapp')) {
      return true;
    }

    return isStandaloneDisplay || isIOSStandalone || isAndroidApp;
  } catch {
    return false;
  }
}

export function useIsStandalone(): boolean {
  const [isStandalone, setIsStandalone] = useState<boolean>(isStandaloneApp);

  useEffect(() => {
    const check = () => setIsStandalone(isStandaloneApp());
    check();

    // Listen to display-mode change
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(display-mode: standalone)');
      const handleChange = () => check();
      try {
        mediaQuery.addEventListener('change', handleChange);
      } catch {
        mediaQuery.addListener(handleChange);
      }

      window.addEventListener('storage', check);
      window.addEventListener('dandelious-mode-change', check);

      return () => {
        try {
          mediaQuery.removeEventListener('change', handleChange);
        } catch {
          mediaQuery.removeListener(handleChange);
        }
        window.removeEventListener('storage', check);
        window.removeEventListener('dandelious-mode-change', check);
      };
    }
  }, []);

  return isStandalone;
}

export function setAppModePreference(mode: 'auto' | 'webapp' | 'web') {
  if (typeof window === 'undefined') return;
  if (mode === 'auto') {
    localStorage.removeItem('dandelious_app_mode');
  } else {
    localStorage.setItem('dandelious_app_mode', mode);
  }
  window.dispatchEvent(new Event('dandelious-mode-change'));
}

export function detectDevice(): DeviceInfo {
  if (typeof window === 'undefined') {
    return {
      deviceType: 'desktop',
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isTouchDevice: false,
      orientation: 'landscape',
      screenWidth: 1920,
      screenHeight: 1080,
      userAgent: '',
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const ua = navigator.userAgent || '';
  
  // High precision touch detection for Android, iOS, Opera GX Mobile, etc.
  const isTouch = Boolean(
    'ontouchstart' in window || 
    navigator.maxTouchPoints > 0 || 
    (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
    (window.matchMedia && window.matchMedia('(hover: none)').matches)
  );

  // Mobile User Agents (including Opera GX Mobile, Chrome Mobile, Safari Mobile, Firefox Mobile)
  const isMobileUA = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Opera GX|OPR\/|Mobile|Mobi|SamsungBrowser|UCBrowser/i.test(ua);
  const isTabletUA = /iPad|Tablet|PlayBook|Silk/i.test(ua) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPad Pro

  let deviceType: DeviceType = 'desktop';

  // Mobile detection: screen width < 768px, or mobile UA + width < 1024px, or coarse touch + portrait/narrow screen
  if (width < 768 || (isMobileUA && width < 960) || (isTouch && width < 640)) {
    deviceType = 'mobile';
  } else if (width <= 1180 || isTabletUA || (isTouch && width < 1280)) {
    deviceType = 'tablet';
  } else {
    deviceType = 'desktop';
  }

  const orientation = height >= width ? 'portrait' : 'landscape';

  return {
    deviceType,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    isTouchDevice: isTouch,
    orientation,
    screenWidth: width,
    screenHeight: height,
    userAgent: ua,
  };
}

export function useDeviceType(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(detectDevice);

  useEffect(() => {
    const handleResize = () => {
      setDeviceInfo(detectDevice());
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  return deviceInfo;
}
