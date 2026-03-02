import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  useColorScheme,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface ScanResult {
  civilId: string;
  fullName: string;
  dateOfBirth: string;
  expiryDate: string;
  scannedAt: string;
  confidence: number;
}

interface CivilIDScannerScreenProps {
  onScanComplete?: (result: ScanResult) => void;
}

export const CivilIDScannerScreen: React.FC<CivilIDScannerScreenProps> = ({
  onScanComplete,
}) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const [permission, requestPermission] = useCameraPermissions();

  const [scanned, setScanned] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const parseCivilIdQR = (qrData: string): ScanResult | null => {
    try {
      // Expected format: CIVIL_ID|FULL_NAME|DOB|EXPIRY_DATE
      const parts = qrData.split('|');

      if (parts.length < 4) {
        throw new Error('Invalid QR format');
      }

      const [civilId, fullName, dateOfBirth, expiryDate] = parts;

      // Validate Civil ID (12 digits for Kuwait)
      if (!/^\d{12}$/.test(civilId)) {
        throw new Error('Invalid Civil ID format');
      }

      return {
        civilId,
        fullName: fullName.trim(),
        dateOfBirth: dateOfBirth.trim(),
        expiryDate: expiryDate.trim(),
        scannedAt: new Date().toISOString(),
        confidence: 0.98,
      };
    } catch (error) {
      console.error('[CivilIDScanner] Error parsing QR:', error);
      return null;
    }
  };

  const handleBarCodeScanned = useCallback(
    ({ data }: { data: string }) => {
      if (scanned) return;

      const result = parseCivilIdQR(data);

      if (result) {
        setScanned(true);
        setScanResult(result);
        setShowVerificationModal(true);
      } else {
        Alert.alert('Invalid QR Code', 'Please scan a valid Civil ID QR code.');
      }
    },
    [scanned]
  );

  const handleVerifyAndUse = useCallback(async () => {
    if (!scanResult) return;

    try {
      setIsVerifying(true);

      // Optional: Backend verification
      // await verifyWithBackend(scanResult);

      Alert.alert('Success', 'Civil ID scanned and verified successfully.');
      setShowVerificationModal(false);

      // Call completion callback
      if (onScanComplete) {
        onScanComplete(scanResult);
      }
    } catch (error) {
      console.error('[CivilIDScanner] Verification error:', error);
      Alert.alert('Verification Failed', 'Unable to verify Civil ID. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  }, [scanResult, onScanComplete]);

  const handleRetake = useCallback(() => {
    setScanned(false);
    setScanResult(null);
    setShowVerificationModal(false);
  }, []);

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" style={{ marginTop: 20 }} />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#000000' : '#FFFFFF' }]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={isDarkMode ? '#000000' : '#FFFFFF'}
        />
        <View style={styles.permissionContainer}>
          <MaterialIcons name="camera-alt" size={64} color={isDarkMode ? '#90CAF9' : '#1976D2'} />
          <Text style={[styles.permissionTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
            Camera Permission Required
          </Text>
          <Text style={[styles.permissionText, { color: isDarkMode ? '#B0B0B0' : '#666666' }]}>
            We need access to your camera to scan Civil IDs for tenant onboarding.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#000000' : '#FFFFFF'}
      />

      <CameraView
        style={styles.camera}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      >
        <View style={styles.overlay}>
          {/* Top header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Scan Civil ID</Text>
            <Text style={styles.headerSubtitle}>
              Point camera at Civil ID QR code
            </Text>
          </View>

          {/* Scan frame */}
          <View style={styles.scanFrameContainer}>
            <View style={styles.scanFrame}>
              {/* Corner indicators */}
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
            </View>
          </View>

          {/* Bottom info */}
          <View style={styles.footer}>
            <MaterialIcons name="info" size={16} color="#FFFFFF" />
            <Text style={styles.footerText}>
              Align QR code within frame to scan
            </Text>
          </View>
        </View>
      </CameraView>

      {/* Verification Modal */}
      <Modal
        visible={showVerificationModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleRetake}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: isDarkMode ? '#1F1F1F' : '#FFFFFF' },
            ]}
          >
            <MaterialIcons name="check-circle" size={48} color="#4CAF50" />

            <Text style={[styles.modalTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
              Verify Scanned Data
            </Text>

            {scanResult && (
              <>
                <View
                  style={[
                    styles.dataField,
                    { borderColor: isDarkMode ? '#333333' : '#E0E0E0' },
                  ]}
                >
                  <Text style={[styles.fieldLabel, { color: isDarkMode ? '#B0B0B0' : '#666666' }]}>
                    Full Name
                  </Text>
                  <Text style={[styles.fieldValue, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                    {scanResult.fullName}
                  </Text>
                </View>

                <View
                  style={[
                    styles.dataField,
                    { borderColor: isDarkMode ? '#333333' : '#E0E0E0' },
                  ]}
                >
                  <Text style={[styles.fieldLabel, { color: isDarkMode ? '#B0B0B0' : '#666666' }]}>
                    Civil ID
                  </Text>
                  <Text style={[styles.fieldValue, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                    {scanResult.civilId}
                  </Text>
                </View>

                <View
                  style={[
                    styles.dataField,
                    { borderColor: isDarkMode ? '#333333' : '#E0E0E0' },
                  ]}
                >
                  <Text style={[styles.fieldLabel, { color: isDarkMode ? '#B0B0B0' : '#666666' }]}>
                    Expiry Date
                  </Text>
                  <Text style={[styles.fieldValue, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                    {scanResult.expiryDate}
                  </Text>
                </View>

                <View
                  style={[
                    styles.confidenceBar,
                    { backgroundColor: isDarkMode ? '#2A2A2A' : '#F5F5F5' },
                  ]}
                >
                  <View
                    style={[
                      styles.confidenceFill,
                      { width: `${scanResult.confidence * 100}%` },
                    ]}
                  />
                  <Text style={[styles.confidenceText, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                    Confidence: {Math.round(scanResult.confidence * 100)}%
                  </Text>
                </View>

                <Text
                  style={[
                    styles.complianceNote,
                    { color: isDarkMode ? '#81C784' : '#2E7D32' },
                  ]}
                >
                  Civil ID data encrypted per Law 10/2026 Article 10
                </Text>
              </>
            )}

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.retakeButton,
                  { borderColor: isDarkMode ? '#333333' : '#E0E0E0' },
                ]}
                onPress={handleRetake}
                disabled={isVerifying}
              >
                <MaterialIcons
                  name="refresh"
                  size={20}
                  color={isDarkMode ? '#90CAF9' : '#1976D2'}
                />
                <Text style={[styles.buttonText, { color: isDarkMode ? '#90CAF9' : '#1976D2' }]}>
                  Retake
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.confirmButton]}
                onPress={handleVerifyAndUse}
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialIcons name="check" size={20} color="#FFFFFF" />
                    <Text style={styles.confirmButtonText}>
                      Confirm & Use
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#CCCCCC',
    marginTop: 8,
  },
  scanFrameContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 280,
    height: 280,
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
    justifyContent: 'space-between',
    padding: 16,
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#4CAF50',
    borderWidth: 3,
  },
  cornerTopLeft: {
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 12,
  },
  cornerTopRight: {
    top: -2,
    right: -2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 12,
  },
  cornerBottomLeft: {
    bottom: -2,
    left: -2,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
  },
  cornerBottomRight: {
    bottom: -2,
    right: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 8,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
  },
  permissionText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  permissionButton: {
    marginTop: 32,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#1976D2',
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
    maxWidth: '100%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginVertical: 16,
  },
  dataField: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginVertical: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  confidenceBar: {
    width: '100%',
    height: 30,
    borderRadius: 6,
    marginVertical: 12,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  confidenceFill: {
    position: 'absolute',
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    zIndex: 1,
    textAlign: 'center',
  },
  complianceNote: {
    fontSize: 12,
    fontStyle: 'italic',
    marginVertical: 12,
    lineHeight: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 44,
  },
  retakeButton: {
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  confirmButton: {
    backgroundColor: '#1976D2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default CivilIDScannerScreen;
