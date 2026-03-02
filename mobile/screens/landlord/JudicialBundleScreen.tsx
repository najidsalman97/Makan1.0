import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  useColorScheme,
  StatusBar,
  FlatList,
  SectionList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { BiometricAuthService } from '../../services/BiometricAuthService';

interface JudicialDocument {
  id: string;
  title: string;
  type: 'eviction-notice' | 'court-order' | 'lease-agreement' | 'judgment' | 'appeal';
  date: string;
  status: 'active' | 'expired' | 'pending';
  fileSize: string;
  downloadUrl: string;
}

interface DocumentSection {
  title: string;
  data: JudicialDocument[];
}

interface JudicialBundleScreenProps {
  leaseId: string;
  landlordName: string;
  tenantName: string;
}

export const JudicialBundleScreen: React.FC<JudicialBundleScreenProps> = ({
  leaseId,
  landlordName,
  tenantName,
}) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isFetchingDocuments, setIsFetchingDocuments] = useState(false);
  const [documents, setDocuments] = useState<DocumentSection[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<JudicialDocument | null>(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    initializeScreen();
  }, [leaseId]);

  const initializeScreen = useCallback(async () => {
    try {
      setIsAuthenticating(true);
      const authenticated = await BiometricAuthService.authenticateForJudicialBundle(
        `Access Judicial Bundle for ${tenantName}`,
        `You are accessing confidential legal documents and court records for this lease. This action is recorded and auditable per Law 10/2026 Article 8.`
      );

      if (authenticated) {
        setIsAuthenticated(true);
        fetchJudicialDocuments();
      } else {
        Alert.alert(
          'Authentication Failed',
          'You could not be authenticated to access the Judicial Bundle. This is for security and compliance reasons.'
        );
      }
    } catch (error) {
      console.error('Judicial Bundle authentication error:', error);
      Alert.alert(
        'Error',
        'An error occurred during authentication. Please try again.'
      );
    } finally {
      setIsAuthenticating(false);
    }
  }, [leaseId, tenantName]);

  const fetchJudicialDocuments = useCallback(async () => {
    try {
      setIsFetchingDocuments(true);
      const mockDocuments: DocumentSection[] = [
        {
          title: 'Active Legal Documents',
          data: [
            {
              id: 'doc-001',
              title: 'Lease Agreement - Updated 2024',
              type: 'lease-agreement',
              date: '2024-01-15',
              status: 'active',
              fileSize: '2.4 MB',
              downloadUrl: '/documents/lease-2024.pdf',
            },
            {
              id: 'doc-002',
              title: 'Eviction Notice - Overdue Rent',
              type: 'eviction-notice',
              date: '2026-02-20',
              status: 'active',
              fileSize: '1.2 MB',
              downloadUrl: '/documents/eviction-notice.pdf',
            },
            {
              id: 'doc-003',
              title: 'Court Order - Expedited Hearing',
              type: 'court-order',
              date: '2026-02-25',
              status: 'active',
              fileSize: '892 KB',
              downloadUrl: '/documents/court-order.pdf',
            },
          ],
        },
        {
          title: 'Pending & Historical',
          data: [
            {
              id: 'doc-004',
              title: 'Appeal Notice - Under Review',
              type: 'appeal',
              date: '2026-02-28',
              status: 'pending',
              fileSize: '1.5 MB',
              downloadUrl: '/documents/appeal.pdf',
            },
            {
              id: 'doc-005',
              title: 'Court Judgment - Archived',
              type: 'judgment',
              date: '2025-12-10',
              status: 'expired',
              fileSize: '3.1 MB',
              downloadUrl: '/documents/judgment-archive.pdf',
            },
          ],
        },
      ];

      setDocuments(mockDocuments);
    } catch (error) {
      console.error('Error fetching judicial documents:', error);
      Alert.alert(
        'Error',
        'Failed to load judicial documents. Please try again.'
      );
    } finally {
      setIsFetchingDocuments(false);
    }
  }, []);

  const handleDocumentPress = useCallback((document: JudicialDocument) => {
    setSelectedDocument(document);
    setShowDownloadModal(true);
  }, []);

  const handleDownloadDocument = useCallback(async () => {
    if (!selectedDocument) return;

    try {
      setIsDownloading(true);
      await new Promise((resolve) => setTimeout(resolve, 1500));

      Alert.alert(
        'Download Complete',
        `${selectedDocument.title} has been downloaded and saved securely. This download is encrypted and only accessible on this device.`
      );
      setShowDownloadModal(false);
      setSelectedDocument(null);
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Download Failed', 'Unable to download the document. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  }, [selectedDocument]);

  const getDocumentIcon = (type: string): string => {
    switch (type) {
      case 'eviction-notice':
        return 'warning';
      case 'court-order':
        return 'gavel';
      case 'lease-agreement':
        return 'description';
      case 'judgment':
        return 'verified';
      case 'appeal':
        return 'pending-actions';
      default:
        return 'description';
    }
  };

  const getStatusColor = (
    status: string
  ): { backgroundColor: string; textColor: string } => {
    switch (status) {
      case 'active':
        return {
          backgroundColor: isDarkMode ? '#1B5E20' : '#E8F5E9',
          textColor: isDarkMode ? '#81C784' : '#2E7D32',
        };
      case 'pending':
        return {
          backgroundColor: isDarkMode ? '#E65100' : '#FFF3E0',
          textColor: isDarkMode ? '#FFB74D' : '#E65100',
        };
      case 'expired':
        return {
          backgroundColor: isDarkMode ? '#3E2C2C' : '#FFEBEE',
          textColor: isDarkMode ? '#EF9A9A' : '#C62828',
        };
      default:
        return {
          backgroundColor: isDarkMode ? '#424242' : '#F5F5F5',
          textColor: isDarkMode ? '#BDBDBD' : '#616161',
        };
    }
  };

  const theme = {
    backgroundColor: isDarkMode ? '#000000' : '#FFFFFF',
    cardBackground: isDarkMode ? '#1F1F1F' : '#FFFFFF',
    textColor: isDarkMode ? '#FFFFFF' : '#000000',
    secondaryTextColor: isDarkMode ? '#B0B0B0' : '#666666',
    borderColor: isDarkMode ? '#333333' : '#E0E0E0',
    dangerColor: isDarkMode ? '#EF5350' : '#F44336',
    accentColor: isDarkMode ? '#90CAF9' : '#1976D2',
  };

  if (isAuthenticating) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={theme.backgroundColor}
        />
        <View style={styles.loadingContainer}>
          <MaterialIcons name="lock" size={48} color={theme.accentColor} />
          <Text style={[styles.loadingTitle, { color: theme.textColor }]}>
            Verifying Identity
          </Text>
          <Text style={[styles.loadingDescription, { color: theme.secondaryTextColor }]}>
            Please complete biometric authentication to access the Judicial Bundle
          </Text>
          <ActivityIndicator
            size="large"
            color={theme.accentColor}
            style={{ marginTop: 20 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={theme.backgroundColor}
        />
        <View style={styles.loadingContainer}>
          <MaterialIcons name="lock-outline" size={48} color={theme.dangerColor} />
          <Text style={[styles.loadingTitle, { color: theme.textColor }]}>
            Access Denied
          </Text>
          <Text style={[styles.loadingDescription, { color: theme.secondaryTextColor }]}>
            Biometric authentication is required to access the Judicial Bundle.
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.accentColor }]}
            onPress={initializeScreen}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.backgroundColor}
      />

      <View style={[styles.headerBar, { borderBottomColor: theme.borderColor }]}>
        <Text style={[styles.headerTitle, { color: theme.textColor }]}>
          Judicial Bundle
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.secondaryTextColor }]}>
          {tenantName} • Lease {leaseId}
        </Text>
      </View>

      <View
        style={[
          styles.complianceCard,
          { backgroundColor: isDarkMode ? '#263238' : '#E3F2FD', borderColor: theme.accentColor },
        ]}
      >
        <MaterialIcons name="info" size={20} color={theme.accentColor} />
        <Text
          style={[styles.complianceText, { color: theme.textColor }]}
        >
          All access to legal documents is recorded and auditable per Law 10/2026 Article 8. Unauthorized sharing of eviction documents is prohibited.
        </Text>
      </View>

      {isFetchingDocuments ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accentColor} />
          <Text style={[{ color: theme.textColor }, { marginTop: 12 }]}>
            Loading documents...
          </Text>
        </View>
      ) : (
        <SectionList
          sections={documents}
          keyExtractor={(item, index) => item.id || index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.documentCard,
                { backgroundColor: theme.cardBackground, borderColor: theme.borderColor },
              ]}
              onPress={() => handleDocumentPress(item)}
              activeOpacity={0.7}
            >
              <View style={styles.documentCardContent}>
                <View style={styles.documentIconWrapper}>
                  <MaterialIcons
                    name={getDocumentIcon(item.type)}
                    size={32}
                    color={theme.accentColor}
                  />
                </View>
                <View style={styles.documentInfo}>
                  <Text
                    style={[styles.documentTitle, { color: theme.textColor }]}
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>
                  <View style={styles.documentMetaRow}>
                    <Text style={[styles.documentMeta, { color: theme.secondaryTextColor }]}>
                      {new Date(item.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                    <Text style={[styles.documentMeta, { color: theme.secondaryTextColor }]}>
                      •
                    </Text>
                    <Text style={[styles.documentMeta, { color: theme.secondaryTextColor }]}>
                      {item.fileSize}
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(item.status).backgroundColor },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(item.status).textColor },
                    ]}
                  >
                    {item.status.charAt(0).toUpperCase() +
                      item.status.slice(1)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          renderSectionHeader={({ section }) => (
            <View
              style={[
                styles.sectionHeader,
                { backgroundColor: isDarkMode ? '#1F1F1F' : '#F5F5F5' },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: theme.accentColor }]}>
                {section.title}
              </Text>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          scrollEnabled={true}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialIcons
                name="description"
                size={48}
                color={theme.secondaryTextColor}
              />
              <Text
                style={[
                  styles.emptyStateText,
                  { color: theme.secondaryTextColor },
                ]}
              >
                No judicial documents available for this lease.
              </Text>
            </View>
          }
        />
      )}

      <Modal
        visible={showDownloadModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDownloadModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.cardBackground },
            ]}
          >
            {selectedDocument && (
              <>
                <MaterialIcons
                  name={getDocumentIcon(selectedDocument.type)}
                  size={40}
                  color={theme.accentColor}
                />
                <Text
                  style={[
                    styles.modalTitle,
                    { color: theme.textColor },
                  ]}
                >
                  {selectedDocument.title}
                </Text>
                <Text
                  style={[
                    styles.modalDescription,
                    { color: theme.secondaryTextColor },
                  ]}
                >
                  File Size: {selectedDocument.fileSize}
                </Text>
                <Text
                  style={[
                    styles.modalDescription,
                    { color: theme.secondaryTextColor, marginTop: 12 },
                  ]}
                >
                  This document will be encrypted and stored only on this device. Sharing confidential judicial documents without authorization is prohibited per Law 10/2026.
                </Text>

                <View style={styles.modalButtonRow}>
                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      styles.cancelButton,
                      { borderColor: theme.borderColor },
                    ]}
                    onPress={() => setShowDownloadModal(false)}
                    disabled={isDownloading}
                  >
                    <Text style={[styles.cancelButtonText, { color: theme.textColor }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      styles.downloadButton,
                      { backgroundColor: theme.accentColor },
                    ]}
                    onPress={handleDownloadDocument}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <MaterialIcons
                          name="download"
                          size={18}
                          color="#FFFFFF"
                        />
                        <Text style={styles.downloadButtonText}>
                          Download & Encrypt
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  complianceCard: {
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  complianceText: {
    marginLeft: 12,
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  loadingDescription: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  sectionHeader: {
    paddingHorizontal: 8,
    paddingVertical: 10,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  documentCard: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  documentCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  documentIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    marginRight: 16,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  documentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentMeta: {
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    marginTop: 80,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalButtonRow: {
    flexDirection: 'row',
    marginTop: 28,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44,
    flexDirection: 'row',
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  downloadButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default JudicialBundleScreen;
