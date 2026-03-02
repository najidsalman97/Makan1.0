# Makan Mobile App - Integration Guide

## Overview

This guide provides step-by-step instructions for integrating the Makan native mobile app features into your React Native/Expo project. The mobile app includes biometric authentication, push notifications, deep linking, and Civil ID scanning capabilities.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Feature Integration](#feature-integration)
5. [Testing](#testing)
6. [Deployment](#deployment)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Node.js 18+ or higher
- npm or yarn
- Expo CLI installed globally: `npm install -g expo-cli`
- iOS 13+ (iPhone)
- Android 8+ (Android devices)
- Python 3.8+ (for native build tools)
- Xcode (for iOS) / Android Studio (for Android)

---

## Installation

### Step 1: Initialize Expo Project

```bash
npx create-expo-app makan-mobile
cd makan-mobile
```

### Step 2: Install Dependencies

```bash
npm install expo-local-authentication expo-notifications expo-device expo-camera
npm install react-native-safe-area-context
npm install @react-navigation/native @react-navigation/bottom-tabs
npm install expo-dev-client
```

### Step 3: Copy Mobile Files

Copy the following directories from the Makan1.0 mobile folder to your project:

```
src/
├── services/
│   ├── BiometricAuthService.ts
│   ├── NotificationService.ts
│   ├── DeepLinkingService.ts
├── screens/
│   ├── settings/SettingsScreen.tsx
│   ├── landlord/JudicialBundleScreen.tsx
│   ├── tenant/PaymentScreen.tsx
│   ├── auth/CivilIDScannerScreen.tsx
```

### Step 4: Copy Configuration Files

```bash
cp app.json <your-project-root>/
cp ios/PrivacyInfo.xcprivacy <your-project-root>/ios/
```

---

## Configuration

### Step 1: Update app.json

The `app.json` file includes all necessary plugins and permissions. Key configurations:

**iOS Permissions:**
- `NSFaceIDUsageDescription` - Required for Face ID
- `NSCameraUsageDescription` - Required for Civil ID scanning
- `NSLocalNetworkUsageDescription` - For local communication

**Android Permissions:**
- `android.permission.USE_BIOMETRIC` - Biometric authentication
- `android.permission.POST_NOTIFICATIONS` - Push notifications
- `android.permission.CAMERA` - Civil ID scanning

### Step 2: Configure Firebase

Create a Firebase project and enable:

1. **Cloud Firestore Database**
   - Create collections:
     - `users` - Store user profiles
     - `tenants` - Store tenant data with expoPushToken
     - `landlords` - Store landlord data with expoPushToken
     - `notification-logs` - Store notification history
     - `maintenance-requests` - Store maintenance request data

2. **Authentication**
   - Enable Email/Password authentication
   - Enable Phone authentication (optional)

### Step 3: Configure Expo Push Notifications

```bash
npm install expo-notifications
```

Get your Expo Push Token:

```javascript
import * as Notifications from 'expo-notifications';

const token = await Notifications.getExpoPushTokenAsync();
console.log('Expo Push Token:', token.data);
```

Store this token in your user profile in Cloud Firestore:

```javascript
await db.collection('tenants').doc(userId).update({
  expoPushToken: token.data
});
```

### Step 4: Configure Deep Linking

Update your React Navigation configuration to use the `DeepLinkingService`:

```typescript
import { DeepLinkingService } from './services/DeepLinkingService';

const RootNavigator = () => {
  const linking = DeepLinkingService.linking;

  return (
    <NavigationContainer linking={linking}>
      {/* Your navigation structure */}
    </NavigationContainer>
  );
};
```

---

## Feature Integration

### Feature 1: Biometric Authentication

**Usage in Components:**

```typescript
import { BiometricAuthService } from './services/BiometricAuthService';

// Check if biometric is available
const available = await BiometricAuthService.isBiometricAvailable();

// Authenticate
try {
  const authenticated = await BiometricAuthService.authenticate();
  if (authenticated) {
    console.log('User authenticated');
  }
} catch (error) {
  console.error('Authentication failed:', error);
}

// Fast-Pay with 5-minute session
const verified = await BiometricAuthService.authenticateForFastPay();
if (verified) {
  // User can complete payment without re-authentication for 5 minutes
}
```

**In Settings Screen:**

```typescript
import { SettingsScreen } from './screens/settings/SettingsScreen';

<SettingsScreen userToken={{ userId: 'user123' }} />
```

### Feature 2: Push Notifications

**Server-Side Setup (Node.js):**

```typescript
import NotificationService from './server_notification_service';
import admin from 'firebase-admin';

const db = admin.firestore();
const notificationService = new NotificationService(db);

// Send rent reminder
app.use('/api/notifications', notificationService.getRouter());

// Example: Send rent reminder to multiple tenants
POST /api/notifications/send-rent-reminder
{
  "leaseId": "lease-001",
  "tenantIds": ["tenant1", "tenant2"],
  "amount": 450,
  "currency": "KWD",
  "dueDate": "2026-03-10",
  "language": "en"
}
```

**Client-Side Setup:**

```typescript
import * as Notifications from 'expo-notifications';
import { NotificationService } from './services/NotificationService';

// Setup notification channels (Android)
await NotificationService.setupNotificationChannels();

// Get token
const token = await NotificationService.getExpoPushToken();

// Listen for notifications
NotificationService.addResponseListener((notification) => {
  console.log('Notification received:', notification);
  
  // Handle deep link from notification
  const deepLink = notification.request.content.data.action;
  if (deepLink) {
    DeepLinkingService.navigateToDeepLink(deepLink);
  }
});
```

### Feature 3: Civil ID Scanning

**Integration:**

```typescript
import { CivilIDScannerScreen } from './screens/auth/CivilIDScannerScreen';

<CivilIDScannerScreen
  onScanComplete={(result) => {
    console.log('Scanned Civil ID:', result);
    // Store result or send to backend
    uploadCivilIdToBackend(result);
  }}
/>
```

**Expected QR Format:**

```
CIVIL_ID|FULL_NAME|DOB|EXPIRY_DATE
261234567890|Ahmed Al-Rashid|1990-05-15|2030-12-31
```

### Feature 4: Payment Screen

**Integration:**

```typescript
import { PaymentScreen } from './screens/tenant/PaymentScreen';

<PaymentScreen userId="tenant123" leaseId="lease-001" />
```

**Features:**
- Displays tenant payment information
- Biometric Fast-Pay verification
- 5-minute verification window
- Multiple payment methods support
- Law 10/2026 compliance badges

### Feature 5: Judicial Bundle (Landlord)

**Integration:**

```typescript
import { JudicialBundleScreen } from './screens/landlord/JudicialBundleScreen';

<JudicialBundleScreen userId="landlord123" leaseId="lease-001" />
```

**Features:**
- Mandatory biometric authentication gate
- Legal document access and download
- Access audit logging
- Compliance with Law 10/2026 Article 8

---

## Testing

### Local Testing with Expo Go

```bash
npx expo start
```

Scan QR code with Expo Go app to test on your device.

### Testing Deep Links

```bash
# iOS
xcrun simctl openurl booted "makan-app://payment/lease-001"

# Android
adb shell am start -W -a android.intent.action.VIEW -d "makan-app://payment/lease-001" com.makan.app
```

### Testing Notifications

Use the server endpoint:

```bash
curl -X POST http://localhost:3000/api/notifications/send-rent-reminder \
  -H "Content-Type: application/json" \
  -d '{
    "leaseId": "lease-001",
    "tenantIds": ["tenant123"],
    "amount": 450,
    "currency": "KWD",
    "dueDate": "2026-03-10"
  }'
```

---

## Building for Production

### iOS Build

```bash
eas build --platform ios --auto-submit
```

**Requirements:**
- Apple Developer Account
- Valid provisioning profiles
- App Store Connect credentials

### Android Build

```bash
eas build --platform android
```

**Requirements:**
- Google Play Console account
- Signed keystore file
- App signing credentials

---

## Deployment

### Step 1: Create Release Build

```bash
# iOS
eas build --platform ios --profile production

# Android
eas build --platform android --profile production
```

### Step 2: Submit to App Stores

**App Store (iOS):**
```bash
eas submit --platform ios
```

**Google Play (Android):**
```bash
eas submit --platform android
```

### Step 3: Monitor Deployment

```bash
eas build:list
eas build:view <build-id>
```

---

## Troubleshooting

### Biometric Issues

**Problem:** Face ID not working on iOS
**Solution:**
1. Check `NSFaceIDUsageDescription` in app.json
2. Verify app has camera permission
3. Rebuild with `eas build --platform ios --clean`

**Problem:** Fingerprint not detecting on Android
**Solution:**
1. Verify `USE_BIOMETRIC` permission is set
2. Ensure device has fingerprint enrolled
3. Test with `expo-local-authentication` example app first

### Notification Issues

**Problem:** Push tokens not being received
**Solution:**
1. Verify Expo Push Token was generated: `await Notifications.getExpoPushTokenAsync()`
2. Check token is stored in Firestore under user profile
3. Verify notification channels are setup for Android: `NotificationService.setupNotificationChannels()`

**Problem:** Deep links not working
**Solution:**
1. Verify scheme is set in app.json: `"scheme": "makan-app"`
2. Test with manual deep link: `xcrun simctl openurl booted "makan-app://payment/lease-001"`
3. Check `DeepLinkingService.ts` linking configuration

### Civil ID Scanning Issues

**Problem:** Camera not opening
**Solution:**
1. Check `CAMERA` permission in app.json
2. Handle permission request properly
3. Verify device has camera hardware

**Problem:** QR code not detecting
**Solution:**
1. Ensure QR code is properly formatted: `CIVIL_ID|NAME|DOB|EXPIRY`
2. Test with standard QR scanner app first
3. Verify camera focus and lighting

---

## Security Best Practices

1. **Token Management**
   - Store Expo Push Tokens securely in Firestore
   - Rotate tokens regularly (every 90 days)
   - Invalidate tokens on logout

2. **Biometric Data**
   - Never transmit biometric data over network
   - Use only device-level biometric APIs
   - Enable biometric data only after user consent

3. **Data Encryption**
   - Use TLS 1.3+ for all network communication
   - Encrypt Civil ID data at rest
   - Use SecureStore for sensitive user data

4. **Compliance**
   - Implement Law 10/2026 Article 12 (biometric verification for payments)
   - Maintain access logs for judicial documents (Article 8)
   - Ensure GDPR compliance for EU users

---

## Support & Resources

- [Expo Documentation](https://docs.expo.dev/)
- [Expo Local Authentication](https://docs.expo.dev/versions/latest/sdk/local-authentication/)
- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [React Native Documentation](https://reactnative.dev/)
- Makan Support: support@makan.com

---

**Version:** 1.0.0  
**Last Updated:** 2024-01-15  
**Compliance:** Law 10/2026 Kuwait Rental Law
