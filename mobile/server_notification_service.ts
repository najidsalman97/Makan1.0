import express, { Router, Request, Response } from 'express';
import admin from 'firebase-admin';

interface PushNotificationPayload {
  expoPushToken: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  priority?: 'default' | 'high' | 'max';
  android?: {
    channelId: string;
    priority: number;
    color?: string;
  };
}

interface NotificationLog {
  id: string;
  userId: string;
  token: string;
  type: string;
  title: string;
  body: string;
  sentAt: Date;
  status: 'pending' | 'sent' | 'failed';
  error?: string;
}

class NotificationService {
  private router: Router;
  private db: admin.firestore.Firestore;

  constructor(db: admin.firestore.Firestore) {
    this.db = db;
    this.router = express.Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post('/send-rent-reminder', this.sendRentReminder.bind(this));
    this.router.post('/send-maintenance-alert', this.sendMaintenanceAlert.bind(this));
    this.router.post('/send-overdue-alert', this.sendOverdueAlert.bind(this));
    this.router.post('/send-bulk', this.sendBulkNotifications.bind(this));
    this.router.get('/logs/:userId', this.getNotificationLogs.bind(this));
  }

  private async sendRentReminder(req: Request, res: Response): Promise<void> {
    try {
      const { leaseId, tenantIds, amount, currency, dueDate, language = 'en' } = req.body;

      if (!leaseId || !tenantIds || !amount || !dueDate) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const notifications: Promise<void>[] = [];

      for (const tenantId of tenantIds) {
        const notification = this.sendRentReminderToTenant(
          tenantId,
          leaseId,
          amount,
          currency,
          dueDate,
          language
        );
        notifications.push(notification);
      }

      await Promise.allSettled(notifications);

      res.json({
        success: true,
        message: `Rent reminders sent to ${tenantIds.length} tenant(s)`,
      });
    } catch (error) {
      console.error('[NotificationService] Error sending rent reminder:', error);
      res.status(500).json({ error: 'Failed to send rent reminder' });
    }
  }

  private async sendRentReminderToTenant(
    tenantId: string,
    leaseId: string,
    amount: number,
    currency: string,
    dueDate: string,
    language: string
  ): Promise<void> {
    try {
      const tenant = await this.db.collection('tenants').doc(tenantId).get();

      if (!tenant.exists || !tenant.data()?.expoPushToken) {
        console.warn(`[NotificationService] Tenant ${tenantId} has no valid push token`);
        return;
      }

      const texts = {
        en: `Rent payment of ${amount} ${currency} is due on ${dueDate}. Pay now to avoid late fees.`,
        ar: `دفع الإيجار بمبلغ ${amount} ${currency} مستحق في ${dueDate}. ادفع الآن لتجنب رسوم التأخير.`,
      };

      const payload: PushNotificationPayload = {
        expoPushToken: tenant.data()!.expoPushToken,
        title: language === 'ar' ? 'تذكير دفع الإيجار' : 'Rent Payment Reminder',
        body: texts[language as keyof typeof texts] || texts.en,
        data: {
          type: 'rent-reminder',
          leaseId,
          action: 'makan-app://payment/' + leaseId,
        },
        priority: 'high',
        android: {
          channelId: 'rent-reminders',
          priority: 4,
          color: '#2196F3',
        },
      };

      await this.sendNotification(payload, tenantId, 'rent-reminder');
    } catch (error) {
      console.error('[NotificationService] Error sending rent reminder to tenant:', error);
      throw error;
    }
  }

  private async sendMaintenanceAlert(req: Request, res: Response): Promise<void> {
    try {
      const { requestId, landlordId, severity = 'normal' } = req.body;

      if (!requestId || !landlordId) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const severityConfig = {
        low: { color: '#4CAF50', channel: 'maintenance-alerts', priority: 2 },
        normal: { color: '#2196F3', channel: 'maintenance-alerts', priority: 3 },
        high: { color: '#FF9800', channel: 'maintenance-alerts', priority: 4 },
        critical: { color: '#F44336', channel: 'maintenance-alerts', priority: 5 },
      };

      const config = severityConfig[severity as keyof typeof severityConfig] || severityConfig.normal;

      const landlord = await this.db.collection('landlords').doc(landlordId).get();
      const request = await this.db.collection('maintenance-requests').doc(requestId).get();

      if (!landlord.exists || !request.exists) {
        res.status(404).json({ error: 'Landlord or request not found' });
        return;
      }

      if (!landlord.data()?.expoPushToken) {
        res.status(400).json({ error: 'Landlord has no valid push token' });
        return;
      }

      const payload: PushNotificationPayload = {
        expoPushToken: landlord.data()!.expoPushToken,
        title: `Maintenance Alert (${severity.toUpperCase()})`,
        body: `New maintenance request: ${request.data()?.description || 'No description'}`,
        data: {
          type: 'maintenance-alert',
          requestId,
          severity,
          action: 'makan-app://maintenance/' + requestId,
        },
        priority: severity === 'critical' ? 'max' : 'high',
        android: {
          channelId: config.channel,
          priority: config.priority,
          color: config.color,
        },
      };

      await this.sendNotification(payload, landlordId, 'maintenance-alert');

      res.json({
        success: true,
        message: 'Maintenance alert sent successfully',
      });
    } catch (error) {
      console.error('[NotificationService] Error sending maintenance alert:', error);
      res.status(500).json({ error: 'Failed to send maintenance alert' });
    }
  }

  private async sendOverdueAlert(req: Request, res: Response): Promise<void> {
    try {
      const { leaseId, tenantId, daysOverdue, amount, currency } = req.body;

      if (!leaseId || !tenantId || !daysOverdue) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const tenant = await this.db.collection('tenants').doc(tenantId).get();

      if (!tenant.exists || !tenant.data()?.expoPushToken) {
        res.status(400).json({ error: 'Tenant has no valid push token' });
        return;
      }

      const payload: PushNotificationPayload = {
        expoPushToken: tenant.data()!.expoPushToken,
        title: '⚠️ Payment Overdue',
        body: `Your rent payment is ${daysOverdue} days overdue. Amount due: ${amount} ${currency}. Pay immediately to avoid legal action.`,
        data: {
          type: 'overdue-alert',
          leaseId,
          action: 'makan-app://payment/' + leaseId,
        },
        priority: 'max',
        android: {
          channelId: 'rent-reminders',
          priority: 5,
          color: '#F44336',
        },
      };

      await this.sendNotification(payload, tenantId, 'overdue-alert');

      res.json({
        success: true,
        message: 'Overdue alert sent successfully',
      });
    } catch (error) {
      console.error('[NotificationService] Error sending overdue alert:', error);
      res.status(500).json({ error: 'Failed to send overdue alert' });
    }
  }

  private async sendBulkNotifications(req: Request, res: Response): Promise<void> {
    try {
      const { notifications } = req.body;

      if (!Array.isArray(notifications) || notifications.length === 0) {
        res.status(400).json({ error: 'Invalid notifications array' });
        return;
      }

      const results = await Promise.allSettled(
        notifications.map((notif) => this.sendNotification(notif, notif.userId, notif.type))
      );

      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      res.json({
        success: true,
        message: `Bulk notifications sent: ${succeeded} succeeded, ${failed} failed`,
        results: { succeeded, failed },
      });
    } catch (error) {
      console.error('[NotificationService] Error sending bulk notifications:', error);
      res.status(500).json({ error: 'Failed to send bulk notifications' });
    }
  }

  private async sendNotification(
    payload: PushNotificationPayload,
    userId: string,
    notificationType: string
  ): Promise<void> {
    const logEntry: NotificationLog = {
      id: `${userId}-${Date.now()}`,
      userId,
      token: payload.expoPushToken,
      type: notificationType,
      title: payload.title,
      body: payload.body,
      sentAt: new Date(),
      status: 'pending',
    };

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: payload.expoPushToken,
          sound: 'default',
          title: payload.title,
          body: payload.body,
          data: payload.data,
          priority: payload.priority || 'default',
          android: payload.android,
          ttl: 24 * 60 * 60,
          mutableContent: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Expo API returned ${response.status}`);
      }

      logEntry.status = 'sent';
      console.log('[NotificationService] Notification sent successfully:', logEntry.id);
    } catch (error) {
      logEntry.status = 'failed';
      logEntry.error = error instanceof Error ? error.message : 'Unknown error';
      console.error('[NotificationService] Error sending notification:', error);
      throw error;
    } finally {
      await this.db.collection('notification-logs').doc(logEntry.id).set(logEntry);
    }
  }

  private async getNotificationLogs(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { limit = 50, startDate, endDate } = req.query;

      let query = this.db.collection('notification-logs').where('userId', '==', userId);

      if (startDate) {
        query = query.where('sentAt', '>=', new Date(startDate as string));
      }

      if (endDate) {
        query = query.where('sentAt', '<=', new Date(endDate as string));
      }

      const snapshot = await query.orderBy('sentAt', 'desc').limit(Number(limit)).get();

      const logs: NotificationLog[] = [];
      snapshot.forEach((doc) => {
        logs.push(doc.data() as NotificationLog);
      });

      res.json({
        success: true,
        logs,
        count: logs.length,
      });
    } catch (error) {
      console.error('[NotificationService] Error fetching logs:', error);
      res.status(500).json({ error: 'Failed to fetch notification logs' });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}

export default NotificationService;
