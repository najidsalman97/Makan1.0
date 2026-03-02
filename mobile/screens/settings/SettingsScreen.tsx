import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SectionList,
  useColorScheme,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { BiometricAuthService } from '../../services/BiometricAuthService';

interface SettingSection {
  title: string;
  data: SettingItem[];
}

interface SettingItem {
  id: string;
  label: string;
  description?: string;
  value?: boolean | string;
  type: 'toggle' | 'button' | 'info';
  onPress?: () => void;
}

interface UserToken {
  userId: string;
}

export const SettingsScreen: React.FC<{ userToken: UserToken }> = ({ userToken }) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [biometricTypes, setBiometricTypes] = useState<string[]>([]);
  const [isLoadingBiometric, setIsLoadingBiometric] = useState(true);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);

  useEffect(() => {
    initializeBiometricSettings();
  }, [userToken.userId]);

  const initializeBiometricSettings = useCallback(async () => {
    try {
      setIsLoadingBiometric(true);

      const available = await BiometricAuthService.isBiometricAvailable();
      setIsBiometricAvailable(available);

      if (available) {
        const types = await BiometricAuthService.getAvailableBiometricTypes();
        setBiometricTypes(types);

        const enabled = await BiometricAuthService.isBiometricEnabledForUser(userToken.userId);
        setIsBiometricEnabled(enabled);
      }
    } catch (error) {
      console.error('Error initializing biometric settings:', error);
    } finally {
      setIsLoadingBiometric(false);
    }
  }, [userToken.userId]);

  const handleBiometricToggle = useCallback(
    async (value: boolean) => {
      if (!isBiometricAvailable) {
        Alert.alert('Biometric Not Available', 'Your device does not support biometric authentication.');
        return;
      }

      try {
        if (value) {
          const authenticated = await BiometricAuthService.authenticate(
            'Enable Biometric Authentication',
            'Use your Face ID or Touch ID to enable fast-pay and secure access to confidential documents (Law 10/2026 Article 12).'
          );

          if (authenticated) {
            await BiometricAuthService.enableBiometricAuth(userToken.userId);
            setIsBiometricEnabled(true);
            Alert.alert(
              'Biometric Enabled',
              'Fast-Pay and Judicial Bundle access now require biometric authentication. This provides enhanced security for sensitive operations.'
            );
          }
        } else {
          Alert.alert(
            'Disable Biometric Authentication?',
            'You will need to enter your password for Fast-Pay and Judicial Bundle access. Continue?',
            [
              {
                text: 'Cancel',
                onPress: () => setIsBiometricEnabled(true),
                style: 'cancel',
              },
              {
                text: 'Disable',
                onPress: async () => {
                  await BiometricAuthService.disableBiometricAuth(userToken.userId);
                  setIsBiometricEnabled(false);
                  Alert.alert('Biometric Disabled', 'Biometric authentication has been disabled for your account.');
                },
                style: 'destructive',
              },
            ]
          );
        }
      } catch (error) {
        console.error('Biometric toggle error:', error);
        Alert.alert('Authentication Failed', 'Unable to process biometric settings change. Please try again.');
      }
    },
    [isBiometricAvailable, userToken.userId]
  );

  const handleClearFastPayVerification = useCallback(async () => {
    try {
      await BiometricAuthService.clearFastPayVerification();
      Alert.alert('Session Cleared', 'Your Fast-Pay session has been cleared for security.');
    } catch (error) {
      console.error('Error clearing Fast-Pay session:', error);
    }
  }, []);

  const getBiometricDescription = (): string => {
    if (!isBiometricAvailable) {
      return 'Biometric authentication is not supported on your device.';
    }
    if (biometricTypes.length === 0) {
      return 'No biometric types available.';
    }
    const types = biometricTypes.map((t) => {
      switch (t) {
        case 'FACIAL_RECOGNITION':
          return 'Face ID';
        case 'FINGERPRINT':
          return 'Touch ID/Fingerprint';
        case 'IRIS':
          return 'Iris Recognition';
        default:
          return t;
      }
    });
    return `Available: ${types.join(', ')}`;
  };

  const sections: SettingSection[] = [
    {
      title: 'Security & Authentication',
      data: [
        {
          id: 'biometric-toggle',
          label: 'Biometric Authentication',
          description: getBiometricDescription(),
          type: 'toggle',
          value: isBiometricEnabled && isBiometricAvailable,
        },
        ...(isBiometricEnabled && isBiometricAvailable
          ? [
              {
                id: 'clear-fastpay',
                label: 'Clear Fast-Pay Session',
                description: 'End current Fast-Pay verification session (5-min window)',
                type: 'button' as const,
                onPress: handleClearFastPayVerification,
              },
            ]
          : []),
      ],
    },
    {
      title: 'Privacy & Compliance',
      data: [
        {
          id: 'privacy-info',
          label: 'Privacy Policy',
          description: 'View our privacy statement and data handling practices',
          type: 'button',
          onPress: () => {
            Alert.alert(
              'Privacy & Data Protection',
              'Makan complies with Kuwait Law 10/2026 (Digital Commerce Decree). Your data is encrypted and stored in CITRA Tier 4 compliant facilities. Civil ID data is never shared without your explicit consent.'
            );
          },
        },
        {
          id: 'legal-info',
          label: 'Legal Information',
          description: 'Law 10/2026 Digital Commerce Decree compliance details',
          type: 'button',
          onPress: () => {
            Alert.alert(
              'Legal Basis',
              'App Version: 2.0.0\nCompliance: Law 10/2026 (Digital Commerce Decree)\nRegion: Kuwait (CITRA Tier 4)\n\nThis app enforces mandatory biometric verification for sensitive operations per Article 12 of Law 10/2026.'
            );
          },
        },
      ],
    },
    {
      title: 'About',
      data: [
        {
          id: 'app-version',
          label: 'App Version',
          description: '2.0.0',
          type: 'info',
        },
        {
          id: 'build',
          label: 'Build',
          description: `Build ${new Date().getFullYear()}.3.0`,
          type: 'info',
        },
      ],
    },
  ];

  const renderItem = ({
    item,
    section,
  }: {
    item: SettingItem;
    section: SettingSection;
  }) => {
    const theme = {
      backgroundColor: isDarkMode ? '#1F1F1F' : '#FFFFFF',
      textColor: isDarkMode ? '#FFFFFF' : '#000000',
      secondaryTextColor: isDarkMode ? '#B0B0B0' : '#666666',
      borderColor: isDarkMode ? '#333333' : '#E0E0E0',
    };

    return (
      <View style={[styles.itemContainer, { borderBottomColor: theme.borderColor }]}>
        <View style={styles.itemContentWrapper}>
          <View style={styles.itemTextWrapper}>
            <Text style={[styles.itemLabel, { color: theme.textColor }]}>
              {item.label}
            </Text>
            {item.description && (
              <Text style={[styles.itemDescription, { color: theme.secondaryTextColor }]}>
                {item.description}
              </Text>
            )}
          </View>

          {item.type === 'toggle' && (
            <Switch
              value={item.value as boolean}
              onValueChange={handleBiometricToggle}
              disabled={isLoadingBiometric || !isBiometricAvailable}
              trackColor={{ false: '#CCCCCC', true: '#81C784' }}
              thumbColor={item.value ? '#4CAF50' : '#F3F3F3'}
            />
          )}

          {item.type === 'button' && (
            <TouchableOpacity
              onPress={item.onPress}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <MaterialIcons
                name="chevron-right"
                size={24}
                color={theme.secondaryTextColor}
              />
            </TouchableOpacity>
          )}

          {item.type === 'info' && (
            <Text style={[styles.infoValue, { color: theme.secondaryTextColor }]}>
              {item.value}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderSectionHeader = ({
    section,
  }: {
    section: SettingSection;
  }) => {
    const theme = {
      headerColor: isDarkMode ? '#2A2A2A' : '#FAFAFA',
      headerTextColor: isDarkMode ? '#90CAF9' : '#1976D2',
    };

    return (
      <View style={[styles.sectionHeader, { backgroundColor: theme.headerColor }]}>
        <Text style={[styles.sectionTitle, { color: theme.headerTextColor }]}>
          {section.title}
        </Text>
      </View>
    );
  };

  if (isLoadingBiometric) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#000000' : '#FFFFFF' }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={isDarkMode ? '#90CAF9' : '#1976D2'}
          />
          <Text style={[styles.loadingText, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
            Loading settings...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDarkMode ? '#000000' : '#FFFFFF' }]}
      edges={['top']}
    >
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#000000' : '#FFFFFF'}
      />
      <View style={styles.headerBar}>
        <Text style={[styles.headerTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
          Settings
        </Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item, index) => item.id || index.toString()}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.sectionListContent}
        scrollEnabled={true}
        stickySectionHeadersEnabled={true}
      />

      {isBiometricEnabled && isBiometricAvailable && (
        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: isDarkMode ? '#1B5E20' : '#E8F5E9',
              borderColor: isDarkMode ? '#388E3C' : '#4CAF50',
            },
          ]}
        >
          <MaterialIcons
            name="check-circle"
            size={20}
            color={isDarkMode ? '#81C784' : '#2E7D32'}
          />
          <Text
            style={[
              styles.infoCardText,
              { color: isDarkMode ? '#81C784' : '#2E7D32' },
            ]}
          >
            Biometric authentication is active. Fast-Pay and Judicial Bundle access are now secured.
          </Text>
        </View>
      )}

      {!isBiometricAvailable && (
        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: isDarkMode ? '#5D4037' : '#FFEBEE',
              borderColor: isDarkMode ? '#795548' : '#F44336',
            },
          ]}
        >
          <MaterialIcons
            name="info"
            size={20}
            color={isDarkMode ? '#EFEBE9' : '#C62828'}
          />
          <Text
            style={[
              styles.infoCardText,
              { color: isDarkMode ? '#EFEBE9' : '#C62828' },
            ]}
          >
            Your device does not support biometric authentication.
          </Text>
        </View>
      )}
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
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  sectionListContent: {
    paddingBottom: 100,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  itemContainer: {
    borderBottomWidth: 1,
  },
  itemContentWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  itemTextWrapper: {
    flex: 1,
    marginRight: 16,
  },
  itemLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoCardText: {
    marginLeft: 12,
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
});

export default SettingsScreen;
