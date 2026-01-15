/**
 * Haptic feedback utility for mobile devices
 * Uses the Vibration API with patterns optimized for iOS and Android
 */

export const haptics = {
  /**
   * Light tap feedback - for life total changes
   */
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },

  /**
   * Medium tap feedback - for significant actions
   */
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(25);
    }
  },

  /**
   * Heavy feedback - for important confirmations
   */
  heavy: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  },

  /**
   * Success pattern - double tap
   */
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([15, 50, 15]);
    }
  },

  /**
   * Warning pattern - longer buzz
   */
  warning: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 30, 30]);
    }
  },
};
