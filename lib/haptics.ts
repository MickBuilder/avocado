import * as Haptics from 'expo-haptics';

// Safe haptic feedback wrapper that handles errors gracefully
export const safeHaptic = {
  impact: (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    try {
      Haptics.impactAsync(style);
    } catch (error) {
      // Silently fail if haptics aren't available
      console.debug('Haptics not available:', error);
    }
  },
  notification: (type: 'success' | 'error' | 'warning' = 'success') => {
    try {
      const notificationType =
        type === 'success'
          ? Haptics.NotificationFeedbackType.Success
          : type === 'error'
            ? Haptics.NotificationFeedbackType.Error
            : Haptics.NotificationFeedbackType.Warning;
      Haptics.notificationAsync(notificationType);
    } catch (error) {
      console.debug('Haptics not available:', error);
    }
  },
};

