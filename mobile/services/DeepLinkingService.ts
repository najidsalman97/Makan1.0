import * as Linking from 'expo-linking';

/**
 * Deep Linking Service
 * 
 * Handles URL scheme parsing and navigation routing for makan-app:// URIs.
 * Integrates with React Navigation and notification system.
 */

export interface DeepLinkParams {
  type: string;
  id?: string;
  [key: string]: any;
}

export class DeepLinkingService {
  private static readonly SCHEME = 'makan-app';

  /**
   * Deep link configuration for React Navigation
   * Use in NavigationContainer linking prop
   */
  static get linking() {
    return {
      prefixes: [`makan-app://`, `https://makan.com/`, `http://makan.com/`],
      config: {
        screens: {
          Payment: 'payment/:leaseId',
          Maintenance: 'maintenance/:requestId',
          AuditVault: 'audit-vault/:recordId',
          JudicialBundle: 'judicial-bundle/:leaseId',
          Settings: 'settings',
          CivilIDScanner: 'civil-id-scanner',
        },
      },
    };
  }

  /**
   * Parse deep link URL to structured parameters
   */
  static parseDeepLink(url: string): DeepLinkParams {
    try {
      // Remove scheme
      const urlWithoutScheme = url.replace(`${this.SCHEME}://`, '').replace('https://', '');

      // Parse path and ID
      const parts = urlWithoutScheme.split('/');
      const type = parts[0];
      const id = parts[1];

      return {
        type,
        id,
      };
    } catch (error) {
      console.error('[DeepLinking] Error parsing URL:', error);
      return { type: 'unknown' };
    }
  }

  /**
   * Navigate to deep link target
   */
  static async navigateToDeepLink(navigationRef: any, params: DeepLinkParams): Promise<void> {
    try {
      if (!navigationRef?.isReady()) {
        console.warn('[DeepLinking] Navigation not ready');
        return;
      }

      switch (params.type) {
        case 'payment':
          navigationRef.navigate('TenantTabs', {
            screen: 'Payment',
            params: { leaseId: params.id },
          });
          break;

        case 'maintenance':
          navigationRef.navigate('Maintenance', {
            requestId: params.id,
          });
          break;

        case 'audit-vault':
          navigationRef.navigate('LandlordTabs', {
            screen: 'AuditVault',
            params: { recordId: params.id },
          });
          break;

        case 'judicial-bundle':
          navigationRef.navigate('JudicialBundle', {
            leaseId: params.id,
          });
          break;

        case 'settings':
          navigationRef.navigate('Settings');
          break;

        default:
          console.warn('[DeepLinking] Unknown deep link type:', params.type);
      }
    } catch (error) {
      console.error('[DeepLinking] Error navigating:', error);
    }
  }

  /**
   * Generate shareable deep link
   */
  static generateDeepLink(type: string, id: string): string {
    return `${this.SCHEME}://${type}/${id}`;
  }

  /**
   * Handle deep link from notification
   */
  static async handleNotificationDeepLink(deepLink: string): Promise<void> {
    try {
      if (deepLink) {
        const params = this.parseDeepLink(deepLink);
        console.log('[DeepLinking] Handling notification deep link:', params);
        // Navigation will be handled by linking config
      }
    } catch (error) {
      console.error('[DeepLinking] Error handling notification link:', error);
    }
  }
}

export default DeepLinkingService;
