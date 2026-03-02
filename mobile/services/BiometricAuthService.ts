import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Biometric Authentication Service
 * 
 * Provides unified biometric authentication (Face ID, Touch ID, Fingerprint)
 * with Fast-Pay session management and per-user settings storage.
 * 
 * Law 10/2026 Compliance: Biometric required for digital payments (Article 12)
 */

interface BiometricConfig {
  userId: string;
  enabledAt?: string;
  lastAuthTime?: string;
}

export class BiometricAuthService {
  private static readonly FAST_PAY_SESSION_DURATION = 5 * 60 * 1000; // 5 minutes
  private static fastPayVerificationTime: number = 0;

  /**
   * Check if device supports biometric authentication
   */
  static async isBiometricAvailable(): Promise<boolean> {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      return compatible && enrolled;
    } catch (error) {
      console.error('[BiometricAuth] Error checking availability:', error);
      return false;
    }
  }

  /**
   * Get available biometric types on device
   * Returns: FACIAL_RECOGNITION, FINGERPRINT, IRIS
   */
  static async getAvailableBiometricTypes(): Promise<string[]> {
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      return types;
    } catch (error) {
      console.error('[BiometricAuth] Error getting biometric types:', error);
      return [];
    }
  }

  /**
   * Generic biometric authentication with fallback
   */
  static async authenticate(
    reason: string,
    description: string
  ): Promise<boolean> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        reason,
        description,
        fallbackLabel: 'Use passcode',
        disableDeviceFallback: false,
        requireConfirmation: true,
      });

      return result.success;
    } catch (error) {
      console.error('[BiometricAuth] Authentication error:', error);
      return false;
    }
  }

  /**
   * Fast-Pay specific authentication (5-minute session window)
   * Called before payment processing
   */
  static async authenticateForFastPay(): Promise<boolean> {
    try {
      const available = await this.isBiometricAvailable();
      if (!available) {
        throw new Error('Biometric authentication not available');
      }

      const result = await LocalAuthentication.authenticateAsync({
        reason: 'Verify Payment',
        description:
          'Use your biometric to securely verify this payment. This verification is valid for 5 minutes per Law 10/2026 Article 12.',
        fallbackLabel: 'Use passcode',
        disableDeviceFallback: false,
        requireConfirmation: true,
      });

      if (result.success) {
        // Store verification timestamp
        this.fastPayVerificationTime = Date.now();
        await SecureStore.setItemAsync('biometric_verified', 'true');
        await SecureStore.setItemAsync(
          'biometric_verified_time',
          this.fastPayVerificationTime.toString()
        );
      }

      return result.success;
    } catch (error) {
      console.error('[BiometricAuth] Fast-Pay authentication error:', error);
      return false;
    }
  }

  /**
   * Judicial Bundle authentication (formal language for legal documents)
   */
  static async authenticateForJudicialBundle(
    reason: string,
    description: string
  ): Promise<boolean> {
    try {
      const available = await this.isBiometricAvailable();
      if (!available) {
        throw new Error('Biometric authentication not available');
      }

      const result = await LocalAuthentication.authenticateAsync({
        reason,
        description,
        fallbackLabel: 'Use passcode',
        disableDeviceFallback: false,
        requireConfirmation: true,
      });

      if (result.success) {
        // Log access for audit trail
        console.log(
          '[BiometricAuth] Judicial Bundle access authenticated at',
          new Date().toISOString()
        );
      }

      return result.success;
    } catch (error) {
      console.error('[BiometricAuth] Judicial Bundle auth error:', error);
      return false;
    }
  }

  /**
   * Check if Fast-Pay is currently verified (within 5-minute window)
   */
  static async isFastPayVerified(): Promise<boolean> {
    try {
      const verifiedStr = await SecureStore.getItemAsync('biometric_verified_time');
      if (!verifiedStr) {
        return false;
      }

      const verifiedTime = parseInt(verifiedStr, 10);
      const now = Date.now();
      const elapsedTime = now - verifiedTime;

      if (elapsedTime > this.FAST_PAY_SESSION_DURATION) {
        // Session expired
        await SecureStore.deleteItemAsync('biometric_verified');
        await SecureStore.deleteItemAsync('biometric_verified_time');
        return false;
      }

      return true;
    } catch (error) {
      console.error('[BiometricAuth] Error checking Fast-Pay status:', error);
      return false;
    }
  }

  /**
   * Clear Fast-Pay verification (end session)
   */
  static async clearFastPayVerification(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync('biometric_verified');
      await SecureStore.deleteItemAsync('biometric_verified_time');
      this.fastPayVerificationTime = 0;
      console.log('[BiometricAuth] Fast-Pay session cleared');
    } catch (error) {
      console.error('[BiometricAuth] Error clearing Fast-Pay:', error);
    }
  }

  /**
   * Enable biometric authentication for user
   * Stores preference in encrypted SecureStore
   */
  static async enableBiometricAuth(userId: string): Promise<void> {
    try {
      const config: BiometricConfig = {
        userId,
        enabledAt: new Date().toISOString(),
      };

      await SecureStore.setItemAsync(
        `biometric_enabled_${userId}`,
        JSON.stringify(config)
      );

      console.log('[BiometricAuth] Enabled for user:', userId);
    } catch (error) {
      console.error('[BiometricAuth] Error enabling biometric:', error);
      throw error;
    }
  }

  /**
   * Disable biometric authentication for user
   */
  static async disableBiometricAuth(userId: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(`biometric_enabled_${userId}`);
      await this.clearFastPayVerification();
      console.log('[BiometricAuth] Disabled for user:', userId);
    } catch (error) {
      console.error('[BiometricAuth] Error disabling biometric:', error);
      throw error;
    }
  }

  /**
   * Check if biometric is enabled for user
   */
  static async isBiometricEnabledForUser(userId: string): Promise<boolean> {
    try {
      const config = await SecureStore.getItemAsync(
        `biometric_enabled_${userId}`
      );
      return config !== null;
    } catch (error) {
      console.error('[BiometricAuth] Error checking user biometric status:', error);
      return false;
    }
  }
}

export default BiometricAuthService;
