/**
 * CITRA Tier 4 Residency Compliance Middleware
 * 
 * Ensures that Civil ID data entry is only allowed when the application
 * is running in the Google Cloud me-central2 (Kuwait) region.
 * 
 * Reference: Article 12, Law 10/2026
 */

export interface CITRAConfig {
  authorizedRegion: string;
  authorizedDatacenters: string[];
  geoIpApiUrl: string;
}

export interface RegionCheckResponse {
  allowed: boolean;
  region: string;
  country: string;
  datacenters: string[];
  alertLevel: 'none' | 'warning' | 'critical';
}

export class CITRAComplianceMiddleware {
  private static readonly AUTHORIZED_REGION = 'me-central2';
  private static readonly AUTHORIZED_DATACENTERS = ['gcc-kuwait-1', 'gcc-kuwait-2'];
  private static readonly GEO_IP_API = 'https://ipapi.co/json/';
  private static cachedRegion: RegionCheckResponse | null = null;
  private static cacheExpiry: number = 0;
  private static readonly CACHE_DURATION = 3600000; // 1 hour

  /**
   * Check if current request origin is authorized
   */
  static async isLocationAuthorized(): Promise<RegionCheckResponse> {
    // Return cached response if still valid
    if (this.cachedRegion && Date.now() < this.cacheExpiry) {
      return this.cachedRegion;
    }

    try {
      const response = await fetch(this.GEO_IP_API);
      const data = await response.json();

      const isAuthorized =
        data.region_code === 'KW' || // Kuwait country code
        data.country_code === 'KW';

      const result: RegionCheckResponse = {
        allowed: isAuthorized,
        region: data.region || 'unknown',
        country: data.country_name || 'unknown',
        datacenters: this.AUTHORIZED_DATACENTERS,
        alertLevel: isAuthorized ? 'none' : 'critical',
      };

      // Cache result
      this.cachedRegion = result;
      this.cacheExpiry = Date.now() + this.CACHE_DURATION;

      return result;
    } catch (error) {
      console.error('[CITRA] Location check failed:', error);

      // Default to deny if check fails (fail-safe)
      return {
        allowed: false,
        region: 'unknown',
        country: 'unknown',
        datacenters: [],
        alertLevel: 'critical',
      };
    }
  }

  /**
   * Initialize CITRA compliance check before Civil ID operations
   */
  static async beforeCivilIDOperation(): Promise<void> {
    const locationCheck = await this.isLocationAuthorized();

    if (!locationCheck.allowed) {
      this.triggerRedAlert(
        'CITRA VIOLATION: Unauthorized location detected for Civil ID access',
        locationCheck
      );
      throw new Error(
        'CITRA Tier 4 Residency: Civil ID operations not permitted from this location. Only accessible from Kuwait (me-central2).'
      );
    }
  }

  /**
   * Middleware for Express/API requests
   */
  static createMiddleware() {
    return async (req: any, res: any, next: any) => {
      // Check if this is a Civil ID-related operation
      if (this.isCivilIDOperation(req)) {
        try {
          await this.beforeCivilIDOperation();
          next();
        } catch (error) {
          res.status(403).json({
            error: 'CITRA Compliance Violation',
            message: (error as Error).message,
            timestamp: new Date().toISOString(),
          });
        }
      } else {
        next();
      }
    };
  }

  /**
   * Detect if request involves Civil ID access
   */
  private static isCivilIDOperation(req: any): boolean {
    const civilIDPaths = [
      '/api/civil-id',
      '/api/tenant/civil-id',
      '/api/haris/civil-id-scanner',
      '/mobile/civil-id-scan',
    ];

    return civilIDPaths.some((path) => req.path.includes(path));
  }

  /**
   * Trigger "Red Alert" for unauthorized location access
   * Logs incident to immutable audit vault
   */
  private static async triggerRedAlert(message: string, locationData: RegionCheckResponse): Promise<void> {
    const redAlertPayload = {
      type: 'CITRA_RED_ALERT',
      message,
      location: locationData,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      ip: 'server-derived', // To be set by backend
      incidentSeverity: 'CRITICAL',
      violationType: 'TIER_4_RESIDENCY_VIOLATION',
      legalReference: 'Article 12, Law 10/2026',
    };

    try {
      // Log to immutable audit vault
      const response = await fetch('/api/audit-vault/security-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || 'anonymous'}`,
        },
        body: JSON.stringify(redAlertPayload),
      });

      if (!response.ok) {
        console.error('[CITRA] Failed to log red alert');
      }
    } catch (error) {
      console.error('[CITRA] Error logging red alert:', error);
    }

    // Disable Civil ID data entry in UI
    this.disableCivilIDEntry();
  }

  /**
   * Disable Civil ID input fields in UI
   */
  private static disableCivilIDEntry(): void {
    // Find all Civil ID input fields and disable them
    const civilIDFields = document.querySelectorAll(
      '[data-citra-protected], .civil-id-input, [name*="civil-id"]'
    );

    civilIDFields.forEach((field) => {
      const htmlElement = field as HTMLInputElement;
      htmlElement.disabled = true;
      htmlElement.style.opacity = '0.5';
      htmlElement.style.cursor = 'not-allowed';

      // Add warning message
      const warning = document.createElement('div');
      warning.className = 'citra-compliance-warning';
      warning.style.color = '#f44336';
      warning.style.fontWeight = 'bold';
      warning.textContent =
        'CITRA Compliance: Civil ID operations not permitted from this location.';
      htmlElement.parentElement?.appendChild(warning);
    });
  }

  /**
   * Clear CITRA cache (for testing)
   */
  static clearCache(): void {
    this.cachedRegion = null;
    this.cacheExpiry = 0;
  }

  /**
   * Get current CITRA status
   */
  static async getStatus(): Promise<{
    compliant: boolean;
    cachedResponse: RegionCheckResponse | null;
    cacheAge: number;
  }> {
    const currentResponse = await this.isLocationAuthorized();

    return {
      compliant: currentResponse.allowed,
      cachedResponse: this.cachedRegion,
      cacheAge: Date.now() - (this.cacheExpiry - this.CACHE_DURATION),
    };
  }
}

/**
 * React HOC for CITRA-protected components
 */
export function withCITRA<P extends object>(Component: React.ComponentType<P>) {
  return function CITRAProtectedComponent(props: P) {
    const [authorized, setAuthorized] = React.useState(false);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
      const checkAuthorization = async () => {
        try {
          await CITRAComplianceMiddleware.beforeCivilIDOperation();
          setAuthorized(true);
        } catch (err) {
          setError((err as Error).message);
          setAuthorized(false);
        } finally {
          setLoading(false);
        }
      };

      checkAuthorization();
    }, []);

    if (loading) {
      return <div>Checking compliance...</div>;
    }

    if (error || !authorized) {
      return (
        <div style={{ padding: '20px', backgroundColor: '#f44336', color: 'white' }}>
          <strong>⚠️ CITRA Compliance Violation</strong>
          <p>{error}</p>
          <p>This feature is only available from authorized locations (Kuwait - me-central2).</p>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

import React from 'react';

export default CITRAComplianceMiddleware;
