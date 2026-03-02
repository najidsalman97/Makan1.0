// mobile/screens/haris/AIMaintenanceScreen.tsx - React Native mobile AI maintenance capture
import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Camera, CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

interface MaintenanceClassification {
  category: string;
  severity: 'critical' | 'urgent' | 'high' | 'medium' | 'low';
  description: string;
  estimatedCost: number;
  responsibleParty: string;
}

interface CaptureResult {
  imageUri: string;
  classification?: MaintenanceClassification;
  geoLocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  timestamp: string;
  buildingId: string;
}

const AIMaintenanceScreen: React.FC<{ buildingId: string }> = ({ buildingId }) => {
  const { t, i18n } = useTranslation();
  const cameraRef = useRef<Camera>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraType, setCameraType] = useState(CameraType.back);
  const [capturing, setCapturing] = useState(false);
  const [classifying, setClassifying] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [classification, setClassification] = useState<MaintenanceClassification | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [recentCaptures, setRecentCaptures] = useState<CaptureResult[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');

      const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
      if (locStatus === 'granted') {
        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
      }
    })();
  }, []);

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      setCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });

      setSelectedImage(photo.uri);
      await classifyImage(photo.uri, photo.base64 || '');
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert(t('error.captureFailed'));
    } finally {
      setCapturing(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      await classifyImage(
        result.assets[0].uri,
        result.assets[0].base64 || ''
      );
    }
  };

  const classifyImage = async (imageUri: string, base64: string) => {
    setClassifying(true);

    try {
      const response = await fetch('/api/ai/classify-maintenance', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: base64,
          buildingId,
        }),
      });

      const data = await response.json();

      if (data.classification) {
        setClassification(data.classification);
        
        // Store recent capture
        const capture: CaptureResult = {
          imageUri,
          classification: data.classification,
          geoLocation: location?.coords,
          timestamp: new Date().toISOString(),
          buildingId,
        };
        
        setRecentCaptures([capture, ...recentCaptures]);
        setShowPreview(true);
      }
    } catch (error) {
      console.error('Error classifying image:', error);
      Alert.alert(t('error.classificationFailed'));
    } finally {
      setClassifying(false);
    }
  };

  const submitCapture = async () => {
    if (!selectedImage || !classification) return;

    try {
      await fetch('/api/maintenance/submissions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUri: selectedImage,
          classification,
          location: location?.coords,
          buildingId,
          timestamp: new Date().toISOString(),
        }),
      });

      Alert.alert(t('success.submissionComplete'));
      setSelectedImage(null);
      setClassification(null);
      setShowPreview(false);
    } catch (error) {
      console.error('Error submitting capture:', error);
      Alert.alert(t('error.submissionFailed'));
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors: { [key: string]: string } = {
      critical: '#f44336',
      urgent: '#ff5722',
      high: '#ff9800',
      medium: '#ffc107',
      low: '#8bc34a',
    };
    return colors[severity] || '#2196f3';
  };

  if (hasPermission === null) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196f3" />
        <Text>{t('common.loading')}</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{t('error.cameraPermission')}</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        {!selectedImage ? (
          <>
            {/* Camera View */}
            <Camera
              ref={cameraRef}
              style={styles.camera}
              type={cameraType}
              ratio="4:3"
            >
              <View style={styles.cameraTop}>
                <TouchableOpacity
                  style={styles.flipButton}
                  onPress={() =>
                    setCameraType(
                      cameraType === CameraType.back
                        ? CameraType.front
                        : CameraType.back
                    )
                  }
                >
                  <Text style={styles.buttonText}>🔄</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.cameraBottom}>
                <TouchableOpacity
                  style={styles.galleryButton}
                  onPress={pickImage}
                >
                  <Text style={styles.buttonText}>🖼</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.captureButton,
                    capturing && styles.capturingButton,
                  ]}
                  onPress={takePicture}
                  disabled={capturing}
                >
                  {capturing ? (
                    <ActivityIndicator
                      size="large"
                      color="white"
                    />
                  ) : (
                    <Text style={styles.captureText}>📸</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.infoButton}>
                  <Text style={styles.buttonText}>ℹ</Text>
                </TouchableOpacity>
              </View>
            </Camera>

            {/* Recent Captures */}
            <View style={styles.recentSection}>
              <Text style={styles.sectionTitle}>
                {t('maintenance.recentCaptures')} ({recentCaptures.length})
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.recentScroll}
              >
                {recentCaptures.slice(0, 5).map((capture, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.thumbnailContainer}
                    onPress={() => {
                      setSelectedImage(capture.imageUri);
                      setClassification(capture.classification || null);
                      setShowPreview(true);
                    }}
                  >
                    <Image
                      source={{ uri: capture.imageUri }}
                      style={styles.thumbnail}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </>
        ) : (
          <>
            {/* Image Preview */}
            <Image
              source={{ uri: selectedImage }}
              style={styles.preview}
            />

            {classifying ? (
              <View style={styles.classifyingContainer}>
                <ActivityIndicator size="large" color="white" />
                <Text style={styles.loadingText}>
                  {t('maintenance.classifying')}
                </Text>
              </View>
            ) : classification ? (
              <View style={styles.classificationResult}>
                <View
                  style={[
                    styles.severityBadge,
                    {
                      backgroundColor: getSeverityColor(
                        classification.severity
                      ),
                    },
                  ]}
                >
                  <Text style={styles.severityText}>
                    {t(`severity.${classification.severity}`)}
                  </Text>
                </View>

                <View style={styles.resultContent}>
                  <Text style={styles.category}>
                    🏷 {classification.category}
                  </Text>
                  <Text style={styles.description}>
                    {classification.description}
                  </Text>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>
                      💰 {t('maintenance.estimatedCost')}:
                    </Text>
                    <Text style={styles.detailValue}>
                      KWD {classification.estimatedCost.toFixed(2)}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>
                      👤 {t('maintenance.responsible')}:
                    </Text>
                    <Text style={styles.detailValue}>
                      {classification.responsibleParty}
                    </Text>
                  </View>
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.approveBtn]}
                    onPress={submitCapture}
                  >
                    <Text style={styles.actionText}>✓ {t('common.approve')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.cancelBtn]}
                    onPress={() => {
                      setSelectedImage(null);
                      setClassification(null);
                    }}
                  >
                    <Text style={styles.actionText}>✕ {t('common.cancel')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </>
        )}
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  camera: {
    flex: 1,
  },
  cameraTop: {
    justifyContent: 'flex-start',
    padding: 16,
  },
  cameraBottom: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 20,
    flexDirection: 'row',
    gap: 16,
  },
  flipButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    backgroundColor: '#2196f3',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  capturingButton: {
    backgroundColor: '#1976d2',
  },
  infoButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 24,
  },
  captureText: {
    fontSize: 36,
  },
  recentSection: {
    backgroundColor: '#fff',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  recentScroll: {
    height: 80,
  },
  thumbnailContainer: {
    marginRight: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  thumbnail: {
    width: 80,
    height: 80,
  },
  preview: {
    flex: 1,
    resizeMode: 'cover',
  },
  classifyingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
  },
  classificationResult: {
    backgroundColor: '#fff',
    maxHeight: '50%',
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  severityBadge: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  severityText: {
    color: '#fff',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    fontSize: 12,
  },
  resultContent: {
    marginBottom: 16,
  },
  category: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detailLabel: {
    fontSize: 13,
    color: '#666',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  approveBtn: {
    backgroundColor: '#4caf50',
  },
  cancelBtn: {
    backgroundColor: '#f44336',
  },
  actionText: {
    color: '#fff',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
    textAlign: 'center',
  },
});

export default AIMaintenanceScreen;
