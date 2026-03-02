import { db } from '../db';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

export interface GeoTag {
  id: string;
  hariUserId: string;
  maintenanceRequestId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
  address: string;
  verificationStatus: 'verified' | 'unverified' | 'disputed';
  photoUrl?: string;
  leaseId: string;
  buildingId: string;
}

export class GeoTagService {
  private static readonly COLLECTION = 'geo_tags_immutable';
  private static readonly ACCURACY_THRESHOLD = 50;
  private static readonly KUWAIT_LAT_MIN = 28.5;
  private static readonly KUWAIT_LAT_MAX = 30.0;
  private static readonly KUWAIT_LON_MIN = 46.5;
  private static readonly KUWAIT_LON_MAX = 48.5;
  private static readonly FRAUD_DISTANCE_KM = 5;
  private static readonly FRAUD_TIME_MIN = 30;

  static isValidKuwaitCoordinate(latitude: number, longitude: number): boolean {
    return (
      latitude >= this.KUWAIT_LAT_MIN &&
      latitude <= this.KUWAIT_LAT_MAX &&
      longitude >= this.KUWAIT_LON_MIN &&
      longitude <= this.KUWAIT_LON_MAX
    );
  }

  static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000;
  }

  static async captureGeoTag(
    hariUserId: string,
    maintenanceRequestId: string,
    latitude: number,
    longitude: number,
    accuracy: number,
    address: string,
    leaseId: string,
    buildingId: string,
    photoUrl?: string
  ): Promise<GeoTag> {
    if (!this.isValidKuwaitCoordinate(latitude, longitude)) {
      throw new Error('Coordinates outside Kuwait boundaries');
    }

    if (accuracy > this.ACCURACY_THRESHOLD) {
      throw new Error(`GPS accuracy ${accuracy}m exceeds threshold ${this.ACCURACY_THRESHOLD}m`);
    }

    const geoTag: any = {
      hariUserId,
      maintenanceRequestId,
      latitude,
      longitude,
      accuracy,
      timestamp: serverTimestamp(),
      address,
      verificationStatus: 'unverified',
      photoUrl,
      leaseId,
      buildingId,
    };

    const docRef = await addDoc(collection(db, this.COLLECTION), geoTag);

    return {
      id: docRef.id,
      ...geoTag,
      timestamp: new Date(),
    };
  }

  static async verifyProofOfPresence(
    maintenanceRequestId: string,
    buildingLatitude: number,
    buildingLongitude: number
  ): Promise<{ verified: boolean; distance: number }> {
    const q = query(
      collection(db, this.COLLECTION),
      where('maintenanceRequestId', '==', maintenanceRequestId)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return { verified: false, distance: -1 };
    }

    const geoTag = snapshot.docs[0].data();
    const distance = this.calculateDistance(
      geoTag.latitude,
      geoTag.longitude,
      buildingLatitude,
      buildingLongitude
    );

    const verified = distance <= this.ACCURACY_THRESHOLD;
    return { verified, distance };
  }

  static async getBuildingVisitHistory(buildingId: string): Promise<GeoTag[]> {
    const q = query(collection(db, this.COLLECTION), where('buildingId', '==', buildingId));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as GeoTag[];
  }

  static async getHariVisitHistory(hariUserId: string): Promise<GeoTag[]> {
    const q = query(collection(db, this.COLLECTION), where('hariUserId', '==', hariUserId));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as GeoTag[];
  }

  static async detectAnomalousActivity(hariUserId: string): Promise<{ suspicious: boolean; alerts: string[] }> {
    const visits = await this.getHariVisitHistory(hariUserId);
    const alerts: string[] = [];

    for (let i = 0; i < visits.length - 1; i++) {
      const visit1 = visits[i];
      const visit2 = visits[i + 1];

      const timeDiff = Math.abs(
        new Date(visit1.timestamp).getTime() - new Date(visit2.timestamp).getTime()
      ) / 60000;

      const distance = this.calculateDistance(
        visit1.latitude,
        visit1.longitude,
        visit2.latitude,
        visit2.longitude
      );

      if (distance > this.FRAUD_DISTANCE_KM * 1000 && timeDiff < this.FRAUD_TIME_MIN) {
        alerts.push(
          `FRAUD ALERT: Haris covered ${(distance / 1000).toFixed(1)}km in ${timeDiff.toFixed(0)} minutes`
        );
      }
    }

    return {
      suspicious: alerts.length > 0,
      alerts,
    };
  }

  static async disputeGeoTag(geoTagId: string, reason: string): Promise<GeoTag | null> {
    return null;
  }
}

export default GeoTagService;
