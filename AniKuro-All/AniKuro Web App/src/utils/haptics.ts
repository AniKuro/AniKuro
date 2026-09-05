export type HapticFeedbackType = 'light' | 'medium' | 'heavy' | 'selection' | 'success';

/**
 * Trigger subtle, tactile physical feedback on user interactions (tabs, cards, quick track, filters).
 * Matches the native tactile feel of MyAniList (iOS) and Otaku (Android).
 */
export const triggerHaptic = (type: HapticFeedbackType = 'light') => {
  try {
    // 1. Try Native Android Bridge
    if (typeof window !== 'undefined') {
      const win = window as any;
      if (typeof win.AndroidBridge?.triggerHaptic === 'function') {
        win.AndroidBridge.triggerHaptic(type);
        return;
      }
      if (typeof win.AndroidNotificationBridge?.triggerHaptic === 'function') {
        win.AndroidNotificationBridge.triggerHaptic(type);
        return;
      }
    }

    // 2. Browser standard Vibration API fallback
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      if (type === 'heavy' || type === 'success') {
        navigator.vibrate([20, 25, 20]);
      } else if (type === 'medium' || type === 'selection') {
        navigator.vibrate(12);
      } else {
        navigator.vibrate(6);
      }
    }
  } catch {
    // Fail silently on non-touch / unsupported devices
  }
};
