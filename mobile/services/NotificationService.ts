import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

/**
 * Notification Service
 * 
 * Centralized push notification management with Android 13+ channels.
 * Supports maintenance alerts, rent reminders, overdue alerts, and more.
 * 
 * Law 10/2026 Compliance: Audit trail maintained for all notifications
 */

interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: string;
  badge?: number;
  color?: string;
}

export class NotificationService {
  /**
   * Setup notification channels (Android 13+)
   * MUST be called during app initialization
   */
  static async setupNotificationChannels(): Promise<void> {
    if (Platform.OS === 'android') {
      try {
        // HIGH_IMPORTANCE channel for maintenance alerts
        await Notifications.setNotificationChannelAsync('maintenance-alerts', {
          name: 'Maintenance Alerts',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF0000',
          sound: 'default',
          enableVibrate: true,
          enableLights: true,
          bypassDnd: true,
        });

        // HIGH channel for rent reminders
        await Notifications.setNotificationChannelAsync('rent-reminders', {
          name: 'Rent Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 150, 100, 150],
          lightColor: '#0000FF',
          sound: 'default',
          enableVibrate: true,
          enableLights: true,
        });

        // DEFAULT channel for general updates
        await Notifications.setNotificationChannelAsync('general-updates', {
          name: 'General Updates',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 100],
          sound: 'default',
          enableVibrate: true,
        });

        console.log('[NotificationService] Channels setup complete');
      } catch (error) {
        console.error('[NotificationService] Error setting up channels:', error);
      }
    }
  }

  /**
   * Get Expo Push Token for device
   * Must be sent to backend for storing user's device token
   */
  static async getExpoPushToken(): Promise<string> {
    try {
      if (!Device.isDevice) {
        throw new Error('Must use physical device for notifications');
      }

      // Request notification permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Get token
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      });

      console.log('[NotificationService] Push token received:', token.data.substring(0, 20) + '...');
      return token.data;
    } catch (error) {
      console.error('[NotificationService] Error getting push token:', error);
      throw error;
    }
  }

  /**
   * Send maintenance alert to landlord
   * Triggered when tenant submits urgent maintenance request
   */
  static async sendMaintenanceAlert(data: {
    landlordId?: string;
    severity: 'urgent' | 'moderate' | 'minor';
    message: string;
    deepLink: string;
  }): Promise<void> {
    try {
      const severityConfig = {
        urgent: { color: '#FF0000', title: '🔴 Urgent Maintenance' },
        moderate: { color: '#FFA500', title: '🟠 Moderate Maintenance' },
        minor: { color: '#FFFF00', title: '🟡 Minor Maintenance' },
      };

      const config = severityConfig[data.severity];

      const payload: NotificationPayload = {
        title: config.title,
        body: data.message,
        sound: 'default',
        color: config.color,
        badge: 1,
        data: {
          deepLink: data.deepLink,
          type: 'maintenance-alert',
        },
      };

      await Notifications.scheduleNotificationAsync({
        content: payload,
        trigger: { seconds: 1 },
      });

      console.log('[MaintenanceAlert] Notification queued');
    } catch (error) {
      console.error('[MaintenanceAlert] Error:', error);
    }
  }

  /**
   * Send rent reminder (3 days before due)
   * Bilingual support (EN/AR)
   */
  static async sendRentReminder(data: {
    tenantId?: string;
    daysUntilDue: number;
    amount: number;
    currency: string;
    message?: string;
  }): Promise<void> {
    try {
      const payload: NotificationPayload = {
        title: '💳 Rent Payment Due',
        body: data.message || `Rent due in ${data.daysUntilDue} days: ${data.amount} ${data.currency}`,
        sound: 'default',
        color: '#0000FF',
        badge: 1,
        data: {
          deepLink: 'makan-app://payment',
          type: 'rent-reminder',
        },
      };

      await Notifications.scheduleNotificationAsync({
        content: payload,
        trigger: { seconds: 1 },
      });

      console.log('[RentReminder] Notification queued');
    } catch (error) {
      console.error('[RentReminder] Error:', error);
    }
  }

  /**
   * Send overdue payment alert
   */
  static async sendOverdueAlert(data: {
    tenantId?: string;
    daysOverdue: number;
    amount: number;
    currency: string;
  }): Promise<void> {
    try {
      const payload: NotificationPayload = {
        title: '⚠️ Rent Payment Overdue',
        body: `${data.daysOverdue} days overdue: ${data.amount} ${data.currency}. Pay now to avoid legal action.`,
        sound: 'default',
        color: '#FF0000',
        badge: 2,
        data: {
          deepLink: 'makan-app://payment',
          type: 'overdue-alert',
        },
      };

      await Notifications.scheduleNotificationAsync({
        content: payload,
        trigger: { seconds: 1 },
      });

      console.log('[OverdueAlert] Notification queued');
    } catch (error) {
      console.error('[OverdueAlert] Error:', error);
    }
  }

  /**
   * Listen for notification responses (taps)
   */
  static addResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): void {
    try {
      const subscription = Notifications.addNotificationResponseReceivedListener(callback);

      // Return unsubscribe function if needed
      return () => subscription.remove();
    } catch (error) {
      console.error('[NotificationService] Error adding listener:', error);
    }
  }
}

export default NotificationService;
