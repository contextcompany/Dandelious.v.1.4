// Haptic Vibration & Web Audio API Engine
let audioCtx: AudioContext | null = null;

export type VibrationPattern = 'click' | 'send' | 'chime' | 'pop' | 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

/**
 * Triggers physical haptic vibration feedback on supported devices.
 */
export const triggerVibration = (pattern: VibrationPattern = 'click', enabled = true) => {
  if (!enabled || typeof window === 'undefined' || typeof navigator === 'undefined' || !('vibrate' in navigator)) {
    return;
  }
  try {
    switch (pattern) {
      case 'click':
      case 'light':
        navigator.vibrate(12);
        break;
      case 'pop':
      case 'medium':
        navigator.vibrate(22);
        break;
      case 'heavy':
        navigator.vibrate(45);
        break;
      case 'send':
        navigator.vibrate([18, 30, 22]);
        break;
      case 'chime':
      case 'success':
        navigator.vibrate([20, 35, 25, 35, 20]);
        break;
      case 'warning':
        navigator.vibrate([35, 50, 35]);
        break;
      case 'error':
        navigator.vibrate([55, 75, 55, 75, 55]);
        break;
    }
  } catch {
    // Ignore vibration restrictions or missing permissions
  }
};

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx || audioCtx.state === 'closed') {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      try {
        audioCtx = new AudioCtx();
      } catch {
        audioCtx = null;
      }
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx && audioCtx.state !== 'closed' ? audioCtx : null;
}

export const playSound = (_type: 'click' | 'send' | 'chime' | 'pop', _enabled = true, _enableVibrate = true) => {
  // All sound effects in Dandelious are completely removed as requested
  return;
};
