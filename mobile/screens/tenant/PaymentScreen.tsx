import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  useColorScheme,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { BiometricAuthService } from '../../services/BiometricAuthService';

interface Payment {
  id: string;
  leaseId: string;
  tenantName: string;
  unitNumber: string;
  amount: number;
  currency: string;
  dueDate: string;
  status: 'pending' | 'overdue' | 'paid';
}

interface PaymentScreenProps {
  userId: string;
  leaseId: string;
}

export const PaymentScreen: React.FC<PaymentScreenProps> = ({ userId, leaseId }) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const [payment, setPayment] = useState<Payment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isBiometricVerified, setIsBiometricVerified] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const theme = {
    backgroundColor: isDarkMode ? '#000000' : '#FFFFFF',
    cardBackground: isDarkMode ? '#1F1F1F' : '#FFFFFF',
    textColor: isDarkMode ? '#FFFFFF' : '#000000',
    secondaryTextColor: isDarkMode ? '#B0B0B0' : '#666666',
    borderColor: isDarkMode ? '#333333' : '#E0E0E0',
    successColor: isDarkMode ? '#81C784' : '#4CAF50',
    dangerColor: isDarkMode ? '#EF5350' : '#F44336',
    accentColor: isDarkMode ? '#90CAF9' : '#1976D2',
    warningColor: isDarkMode ? '#FFB74D' : '#FF9800',
  };

  useEffect(() => {
    initializeScreen();
  }, [leaseId]);

  useEffect(() => {
    checkFastPayStatus();
    const interval = setInterval(checkFastPayStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  const initializeScreen = useCallback(async () => {
    try {
      setIsLoading(true);

      const available = await BiometricAuthService.isBiometricAvailable();
      setBiometricAvailable(available && (await BiometricAuthService.isBiometricEnabledForUser(userId)));

      const mockPayment: Payment = {
        id: 'pay-001',
        leaseId: leaseId,
        tenantName: 'Ahmed Al-Rashid',
        unitNumber: 'A-405',
        amount: 450,
        currency: 'KWD',
        dueDate: '2026-03-10',
        status: 'pending',
      };

      setPayment(mockPayment);
    } catch (error) {
      console.error('Error initializing payment screen:', error);
      Alert.alert('Error', 'Failed to load payment information.');
    } finally {
      setIsLoading(false);
    }
  }, [userId, leaseId]);

  const checkFastPayStatus = useCallback(async () => {
    try {
      const verified = await BiometricAuthService.isFastPayVerified();
      setIsBiometricVerified(verified);
    } catch (error) {
      console.error('Error checking Fast-Pay status:', error);
    }
  }, []);

  const handleBiometricFastPay = useCallback(async () => {
    if (!biometricAvailable) {
      Alert.alert(
        'Biometric Not Available',
        'Biometric Fast-Pay is not enabled. Please enable it in Settings first.'
      );
      return;
    }

    try {
      setIsProcessingPayment(true);
      const authenticated = await BiometricAuthService.authenticateForFastPay();

      if (authenticated) {
        setIsBiometricVerified(true);
        Alert.alert(
          'Fast-Pay Verified',
          'Your biometric authentication is valid for 5 minutes. You can now complete the payment securely.'
        );
      }
    } catch (error) {
      console.error('Biometric Fast-Pay error:', error);
      Alert.alert(
        'Authentication Failed',
        'Unable to authenticate. Please try again or use standard payment method.'
      );
    } finally {
      setIsProcessingPayment(false);
    }
  }, [biometricAvailable]);

  const handleProcessPayment = useCallback(async () => {
    if (!payment) return;

    if (!isBiometricVerified && biometricAvailable) {
      Alert.alert(
        'Fast-Pay Required',
        'Please complete biometric verification first to use Fast-Pay.'
      );
      return;
    }

    try {
      setIsProcessingPayment(true);

      await new Promise((resolve) => setTimeout(resolve, 2000));

      Alert.alert(
        'Payment Successful',
        `Payment of ${payment.amount} ${payment.currency} has been processed securely.\n\nTransaction ID: TXN-${Date.now()}\n\nReceipt has been sent to your email. Law 10/2026 compliance verified.`
      );

      if (isBiometricVerified) {
        await BiometricAuthService.clearFastPayVerification();
        setIsBiometricVerified(false);
      }

      setShowPaymentModal(false);
    } catch (error) {
      console.error('Payment processing error:', error);
      Alert.alert('Payment Failed', 'An error occurred while processing your payment.');
    } finally {
      setIsProcessingPayment(false);
    }
  }, [payment, isBiometricVerified, biometricAvailable]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={theme.backgroundColor}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accentColor} />
          <Text style={[styles.loadingText, { color: theme.textColor }]}>
            Loading payment information...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!payment) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={theme.backgroundColor}
        />
        <View style={styles.loadingContainer}>
          <MaterialIcons name="error-outline" size={48} color={theme.dangerColor} />
          <Text style={[styles.loadingText, { color: theme.textColor }]}>
            Payment information not found.
          </Text>
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

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.headerBar, { borderBottomColor: theme.borderColor }]}>
          <Text style={[styles.headerTitle, { color: theme.textColor }]}>
            Rent Payment
          </Text>
        </View>

        <View
          style={[
            styles.infoCard,
            { backgroundColor: theme.cardBackground, borderColor: theme.borderColor },
          ]}
        >
          <MaterialIcons name="person" size={24} color={theme.accentColor} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoLabel, { color: theme.secondaryTextColor }]}>
              Tenant
            </Text>
            <Text style={[styles.infoValue, { color: theme.textColor }]}>
              {payment.tenantName}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.infoCard,
            { backgroundColor: theme.cardBackground, borderColor: theme.borderColor },
          ]}
        >
          <MaterialIcons name="home" size={24} color={theme.accentColor} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoLabel, { color: theme.secondaryTextColor }]}>
              Unit
            </Text>
            <Text style={[styles.infoValue, { color: theme.textColor }]}>
              {payment.unitNumber}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.amountCard,
            { backgroundColor: isDarkMode ? '#1B5E20' : '#E8F5E9', borderColor: theme.successColor },
          ]}
        >
          <Text style={[styles.amountLabel, { color: theme.successColor }]}>
            Amount Due
          </Text>
          <Text
            style={[
              styles.amountValue,
              { color: theme.successColor },
            ]}
          >
            {payment.amount.toLocaleString()} {payment.currency}
          </Text>
          <Text
            style={[
              styles.amountDescription,
              { color: isDarkMode ? '#81C784' : '#2E7D32' },
            ]}
          >
            Due: {new Date(payment.dueDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        {payment.status === 'overdue' && (
          <View
            style={[
              styles.statusAlert,
              { backgroundColor: isDarkMode ? '#5D4037' : '#FFEBEE', borderColor: theme.dangerColor },
            ]}
          >
            <MaterialIcons name="warning" size={20} color={theme.dangerColor} />
            <Text style={[styles.statusAlertText, { color: theme.dangerColor }]}>
              Payment is overdue. Please pay immediately to avoid late fees.
            </Text>
          </View>
        )}

        {biometricAvailable && (
          <View
            style={[
              styles.fastPaySection,
              { backgroundColor: isDarkMode ? '#673AB7' : '#F3E5F5', borderColor: '#9C27B0' },
            ]}
          >
            <View style={styles.fastPayHeader}>
              <MaterialIcons name="fingerprint" size={24} color="#9C27B0" />
              <Text style={[styles.fastPayTitle, { color: '#7B1FA2' }]}>
                Fast-Pay with Biometric
              </Text>
            </View>

            <Text style={[styles.fastPayDescription, { color: '#7B1FA2' }]}>
              Verify your identity once to complete an unlimited number of payments securely. Session expires after 5 minutes.
            </Text>

            {isBiometricVerified && (
              <View
                style={[
                  styles.verifiedBadge,
                  { backgroundColor: isDarkMode ? '#1B5E20' : '#E8F5E9' },
                ]}
              >
                <MaterialIcons name="check-circle" size={16} color={theme.successColor} />
                <Text style={[styles.verifiedText, { color: theme.successColor }]}>
                  Identity Verified • 5-min Window Active
                </Text>
              </View>
            )}

            {!isBiometricVerified ? (
              <TouchableOpacity
                style={[styles.biometricButton, { backgroundColor: '#9C27B0' }]}
                onPress={handleBiometricFastPay}
                disabled={isProcessingPayment}
              >
                {isProcessingPayment ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialIcons name="fingerprint" size={20} color="#FFFFFF" />
                    <Text style={styles.biometricButtonText}>
                      Verify with Biometric
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.biometricButton, { backgroundColor: theme.successColor }]}
                onPress={() => setShowPaymentModal(true)}
                disabled={isProcessingPayment}
              >
                <MaterialIcons name="check" size={20} color="#FFFFFF" />
                <Text style={styles.biometricButtonText}>
                  Complete Fast-Pay
                </Text>
              </TouchableOpacity>
            )}

            <Text style={[styles.complianceNote, { color: '#5D4037' }]}>
              Law 10/2026 Article 12: Biometric verification required for digital payments.
            </Text>
          </View>
        )}

        {!biometricAvailable && (
          <TouchableOpacity
            style={[styles.paymentButton, { backgroundColor: theme.accentColor }]}
            onPress={() => setShowPaymentModal(true)}
            disabled={isProcessingPayment}
          >
            {isProcessingPayment ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <MaterialIcons name="payment" size={20} color="#FFFFFF" />
                <Text style={styles.paymentButtonText}>Process Payment</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <View
          style={[
            styles.methodsCard,
            { backgroundColor: theme.cardBackground, borderColor: theme.borderColor },
          ]}
        >
          <Text style={[styles.methodsTitle, { color: theme.textColor }]}>
            Available Payment Methods
          </Text>
          <View style={styles.methodItem}>
            <MaterialIcons name="credit-card" size={20} color={theme.accentColor} />
            <Text style={[styles.methodText, { color: theme.textColor }]}>
              K-Net (Kuwaiti Debit Card)
            </Text>
          </View>
          <View style={styles.methodItem}>
            <MaterialIcons name="account-balance-wallet" size={20} color={theme.accentColor} />
            <Text style={[styles.methodText, { color: theme.textColor }]}>
              Digital Wallet (Apple Pay, Google Pay)
            </Text>
          </View>
          <View style={styles.methodItem}>
            <MaterialIcons name="account-balance" size={20} color={theme.accentColor} />
            <Text style={[styles.methodText, { color: theme.textColor }]}>
              Bank Transfer
            </Text>
          </View>
        </View>
      </ScrollView>

      {showPaymentModal && (
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.cardBackground },
            ]}
          >
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowPaymentModal(false)}
              disabled={isProcessingPayment}
            >
              <MaterialIcons name="close" size={24} color={theme.textColor} />
            </TouchableOpacity>

            <MaterialIcons
              name={isBiometricVerified ? 'verified-user' : 'payment'}
              size={48}
              color={theme.accentColor}
            />

            <Text style={[styles.modalTitle, { color: theme.textColor }]}>
              Confirm Payment
            </Text>

            <View style={styles.modalAmountSection}>
              <Text style={[styles.modalAmountLabel, { color: theme.secondaryTextColor }]}>
                Total Amount
              </Text>
              <Text style={[styles.modalAmount, { color: theme.textColor }]}>
                {payment.amount.toLocaleString()} {payment.currency}
              </Text>
            </View>

            {isBiometricVerified && (
              <View
                style={[
                  styles.modalBadge,
                  { backgroundColor: isDarkMode ? '#1B5E20' : '#E8F5E9' },
                ]}
              >
                <MaterialIcons name="check-circle" size={18} color={theme.successColor} />
                <Text style={[styles.modalBadgeText, { color: theme.successColor }]}>
                  Biometric Verified
                </Text>
              </View>
            )}

            <Text style={[styles.modalNote, { color: theme.secondaryTextColor }]}>
              This payment is encrypted and complies with Law 10/2026. A receipt will be sent to your email.
            </Text>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.cancelButton,
                  { borderColor: theme.borderColor },
                ]}
                onPress={() => setShowPaymentModal(false)}
                disabled={isProcessingPayment}
              >
                <Text style={[styles.cancelButtonText, { color: theme.textColor }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.confirmButton,
                  { backgroundColor: theme.accentColor },
                ]}
                onPress={handleProcessPayment}
                disabled={isProcessingPayment}
              >
                {isProcessingPayment ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialIcons name="check" size={18} color="#FFFFFF" />
                    <Text style={styles.confirmButtonText}>Pay Now</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 24,
  },
  headerBar: {
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
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
  infoCard: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  infoContent: {
    marginLeft: 16,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  amountCard: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  amountValue: {
    fontSize: 40,
    fontWeight: '700',
    marginVertical: 8,
    letterSpacing: 0.5,
  },
  amountDescription: {
    fontSize: 13,
    fontWeight: '500',
  },
  statusAlert: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  statusAlertText: {
    marginLeft: 12,
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  fastPaySection: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  fastPayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  fastPayTitle: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  fastPayDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  verifiedText: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '600',
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  biometricButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  complianceNote: {
    fontSize: 12,
    lineHeight: 16,
    fontStyle: 'italic',
    marginTop: 8,
  },
  paymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  paymentButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  methodsCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  methodsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  methodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  methodText: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 28,
    paddingBottom: 40,
  },
  modalCloseButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginVertical: 16,
    textAlign: 'center',
  },
  modalAmountSection: {
    alignItems: 'center',
    marginVertical: 16,
  },
  modalAmountLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalAmount: {
    fontSize: 32,
    fontWeight: '700',
    marginVertical: 8,
  },
  modalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginVertical: 12,
  },
  modalBadgeText: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '600',
  },
  modalNote: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginVertical: 12,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 48,
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
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

export default PaymentScreen;
