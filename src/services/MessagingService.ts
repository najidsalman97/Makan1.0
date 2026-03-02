/**
 * Messaging Service - SMS/WhatsApp Integration
 */

export interface Message {
  id: string;
  recipientPhone: string;
  senderName: string;
  content: string;
  type: 'sms' | 'whatsapp';
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  sentAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
  templateId?: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  language: 'en' | 'ar' | 'ur';
  type: 'payment_reminder' | 'maintenance_alert' | 'notice' | 'custom';
  variables: string[];
}

export interface BulkMessageJob {
  id: string;
  templateId: string;
  recipients: string[];
  scheduledFor?: Date;
  status: 'pending' | 'queued' | 'sending' | 'completed' | 'failed';
  totalCount: number;
  sentCount: number;
  failedCount: number;
  createdAt: Date;
}

export class MessagingService {
  private static readonly SMS_API_URL = process.env.REACT_APP_SMS_API_URL;
  private static readonly WHATSAPP_API_URL = process.env.REACT_APP_WHATSAPP_API_URL;
  private static readonly SMS_API_KEY = process.env.REACT_APP_SMS_API_KEY;
  private static readonly WHATSAPP_API_KEY = process.env.REACT_APP_WHATSAPP_API_KEY;

  /**
   * Send SMS message
   */
  static async sendSMS(
    phoneNumber: string,
    message: string,
    senderName: string = 'Makan'
  ): Promise<Message> {
    try {
      const response = await fetch(`${this.SMS_API_URL}/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.SMS_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: phoneNumber,
          message,
          from: senderName,
        }),
      });

      if (!response.ok) {
        throw new Error(`SMS send failed: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        id: data.messageId,
        recipientPhone: phoneNumber,
        senderName,
        content: message,
        type: 'sms',
        status: 'sent',
        sentAt: new Date(),
      };
    } catch (error) {
      console.error('SMS send error:', error);
      throw error;
    }
  }

  /**
   * Send WhatsApp message
   */
  static async sendWhatsApp(
    phoneNumber: string,
    message: string,
    senderName: string = 'Makan'
  ): Promise<Message> {
    try {
      const response = await fetch(`${this.WHATSAPP_API_URL}/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.WHATSAPP_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: phoneNumber,
          message,
          from: senderName,
        }),
      });

      if (!response.ok) {
        throw new Error(`WhatsApp send failed: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        id: data.messageId,
        recipientPhone: phoneNumber,
        senderName,
        content: message,
        type: 'whatsapp',
        status: 'sent',
        sentAt: new Date(),
      };
    } catch (error) {
      console.error('WhatsApp send error:', error);
      throw error;
    }
  }

  /**
   * Send message using best available channel
   */
  static async sendMessage(
    phoneNumber: string,
    message: string,
    preferredChannel: 'sms' | 'whatsapp' = 'whatsapp'
  ): Promise<Message> {
    try {
      if (preferredChannel === 'whatsapp') {
        return await this.sendWhatsApp(phoneNumber, message);
      } else {
        return await this.sendSMS(phoneNumber, message);
      }
    } catch (error) {
      // Fallback to SMS if WhatsApp fails
      if (preferredChannel === 'whatsapp') {
        console.warn('WhatsApp failed, falling back to SMS');
        return this.sendSMS(phoneNumber, message);
      }
      throw error;
    }
  }

  /**
   * Send message from template
   */
  static async sendFromTemplate(
    phoneNumber: string,
    templateId: string,
    variables: Record<string, string>
  ): Promise<Message> {
    try {
      const response = await fetch('/api/messaging/templates', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const templates = await response.json();
      const template = templates.find((t: MessageTemplate) => t.id === templateId);

      if (!template) {
        throw new Error('Template not found');
      }

      let content = template.content;
      Object.entries(variables).forEach(([key, value]) => {
        content = content.replace(`{{${key}}}`, value);
      });

      return this.sendMessage(phoneNumber, content);
    } catch (error) {
      console.error('Template send error:', error);
      throw error;
    }
  }

  /**
   * Send bulk messages
   */
  static async sendBulk(
    templateId: string,
    recipients: Array<{ phone: string; variables: Record<string, string> }>,
    scheduledFor?: Date
  ): Promise<BulkMessageJob> {
    try {
      const response = await fetch('/api/messaging/bulk', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId,
          recipients,
          scheduledFor,
        }),
      });

      if (!response.ok) {
        throw new Error('Bulk send failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Bulk send error:', error);
      throw error;
    }
  }

  /**
   * Get message templates
   */
  static async getTemplates(type?: string): Promise<MessageTemplate[]> {
    try {
      const url = type ? `/api/messaging/templates?type=${type}` : '/api/messaging/templates';
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      return await response.json();
    } catch (error) {
      console.error('Error fetching templates:', error);
      throw error;
    }
  }

  /**
   * Create custom template
   */
  static async createTemplate(template: Omit<MessageTemplate, 'id'>): Promise<MessageTemplate> {
    try {
      const response = await fetch('/api/messaging/templates', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(template),
      });

      return await response.json();
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  }

  /**
   * Get message history
   */
  static async getMessageHistory(
    phoneNumber?: string,
    limit: number = 50
  ): Promise<Message[]> {
    try {
      const url = phoneNumber
        ? `/api/messaging/history?phone=${phoneNumber}&limit=${limit}`
        : `/api/messaging/history?limit=${limit}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      return await response.json();
    } catch (error) {
      console.error('Error fetching history:', error);
      throw error;
    }
  }

  /**
   * Get bulk job status
   */
  static async getBulkJobStatus(jobId: string): Promise<BulkMessageJob> {
    try {
      const response = await fetch(`/api/messaging/bulk/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      return await response.json();
    } catch (error) {
      console.error('Error fetching job status:', error);
      throw error;
    }
  }
}

export default MessagingService;
