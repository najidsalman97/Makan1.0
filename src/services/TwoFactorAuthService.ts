// TwoFactorAuthService.ts - Two-Factor Authentication Service
import CryptoJS from 'crypto-js';

interface TwoFactorConfig {
  email: string;
  phone?: string;
  method: 'email' | 'sms' | 'totp' | 'backup-codes';
  enabled: boolean;
}

interface TotpSecret {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export class TwoFactorAuthService {
  private static readonly API_ENDPOINT = '/api/auth/2fa';
  private static readonly SECRET_KEY = process.env.REACT_APP_SECRET_KEY || 'default-secret';

  /**
   * Generate TOTP (Time-based One-Time Password) secret for authenticator apps
   */
  static async generateTotpSecret(userId: string): Promise<TotpSecret> {
    try {
      const response = await fetch(`${this.API_ENDPOINT}/generate-totp`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      return await response.json();
    } catch (error) {
      console.error('Error generating TOTP secret:', error);
      throw error;
    }
  }

  /**
   * Verify TOTP code from authenticator app
   */
  static async verifyTotpCode(userId: string, code: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_ENDPOINT}/verify-totp`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, code }),
      });

      const data = await response.json();
      return data.valid;
    } catch (error) {
      console.error('Error verifying TOTP code:', error);
      throw error;
    }
  }

  /**
   * Send OTP via email
   */
  static async sendEmailOtp(email: string): Promise<{ success: boolean; expiresIn: number }> {
    try {
      const response = await fetch(`${this.API_ENDPOINT}/send-email-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      return await response.json();
    } catch (error) {
      console.error('Error sending email OTP:', error);
      throw error;
    }
  }

  /**
   * Send OTP via SMS
   */
  static async sendSmsOtp(phone: string): Promise<{ success: boolean; expiresIn: number }> {
    try {
      const response = await fetch(`${this.API_ENDPOINT}/send-sms-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      });

      return await response.json();
    } catch (error) {
      console.error('Error sending SMS OTP:', error);
      throw error;
    }
  }

  /**
   * Verify OTP code (email or SMS)
   */
  static async verifyOtp(userId: string, otp: string, method: 'email' | 'sms'): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_ENDPOINT}/verify-otp`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, otp, method }),
      });

      const data = await response.json();
      return data.valid;
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw error;
    }
  }

  /**
   * Enable 2FA for user
   */
  static async enable2fa(userId: string, config: TwoFactorConfig): Promise<{ success: boolean }> {
    try {
      const response = await fetch(`${this.API_ENDPOINT}/enable`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, config }),
      });

      return await response.json();
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      throw error;
    }
  }

  /**
   * Disable 2FA for user
   */
  static async disable2fa(userId: string): Promise<{ success: boolean }> {
    try {
      const response = await fetch(`${this.API_ENDPOINT}/disable`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      return await response.json();
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      throw error;
    }
  }

  /**
   * Get 2FA configuration for user
   */
  static async get2faConfig(userId: string): Promise<TwoFactorConfig | null> {
    try {
      const response = await fetch(`${this.API_ENDPOINT}/config/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error fetching 2FA config:', error);
      return null;
    }
  }

  /**
   * Generate backup codes for account recovery
   */
  static async generateBackupCodes(userId: string): Promise<string[]> {
    try {
      const response = await fetch(`${this.API_ENDPOINT}/generate-backup-codes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();
      return data.backupCodes;
    } catch (error) {
      console.error('Error generating backup codes:', error);
      throw error;
    }
  }

  /**
   * Verify backup code
   */
  static async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_ENDPOINT}/verify-backup-code`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, code }),
      });

      const data = await response.json();
      return data.valid;
    } catch (error) {
      console.error('Error verifying backup code:', error);
      throw error;
    }
  }

  /**
   * Hash OTP for secure storage
   */
  static hashOtp(otp: string): string {
    return CryptoJS.SHA256(otp + this.SECRET_KEY).toString();
  }

  /**
   * Check if device is trusted (skip 2FA for X days)
   */
  static async trustDevice(userId: string, deviceId: string, days: number = 30): Promise<void> {
    try {
      const hashedDeviceId = CryptoJS.SHA256(deviceId + this.SECRET_KEY).toString();
      
      await fetch(`${this.API_ENDPOINT}/trust-device`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          deviceId: hashedDeviceId,
          trustDays: days,
        }),
      });
    } catch (error) {
      console.error('Error trusting device:', error);
      throw error;
    }
  }

  /**
   * Get list of trusted devices
   */
  static async getTrustedDevices(userId: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.API_ENDPOINT}/trusted-devices/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();
      return data.devices || [];
    } catch (error) {
      console.error('Error fetching trusted devices:', error);
      return [];
    }
  }

  /**
   * Revoke trusted device
   */
  static async revokeTrustedDevice(userId: string, deviceId: string): Promise<void> {
    try {
      const hashedDeviceId = CryptoJS.SHA256(deviceId + this.SECRET_KEY).toString();

      await fetch(`${this.API_ENDPOINT}/revoke-device`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          deviceId: hashedDeviceId,
        }),
      });
    } catch (error) {
      console.error('Error revoking device:', error);
      throw error;
    }
  }

  /**
   * Get session 2FA status
   */
  static async check2faStatus(userId: string): Promise<{ required: boolean; method: string; }> {
    try {
      const response = await fetch(`${this.API_ENDPOINT}/status/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      return await response.json();
    } catch (error) {
      console.error('Error checking 2FA status:', error);
      return { required: false, method: 'none' };
    }
  }
}

export default TwoFactorAuthService;
