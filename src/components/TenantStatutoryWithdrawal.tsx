import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/StatutoryWithdrawal.css';

interface WithdrawalWindow {
  isWithinWindow: boolean;
  daysRemaining: number;
  leaseId: string;
  leaseStartDate: string;
  windowEndDate: string;
  status: 'active' | 'expired' | 'completed';
}

interface Lease {
  id: string;
  propertyAddress: string;
  startDate: string;
  monthlyRent: number;
  withdrawalWindow: WithdrawalWindow;
}

const StatutoryWithdrawal: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [leases, setLeases] = useState<Lease[]>([]);
  const [selectedLease, setSelectedLease] = useState<Lease | null>(null);
  const [withdrawalInProgress, setWithdrawalInProgress] = useState(false);
  const [withdrawalReason, setWithdrawalReason] = useState('');
  const [confirmWithdrawal, setConfirmWithdrawal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [withdrawalCompleted, setWithdrawalCompleted] = useState(false);

  useEffect(() => {
    const fetchLeases = async () => {
      try {
        const response = await fetch('/api/tenant/leases/withdrawal-eligible', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Accept-Language': i18n.language,
          },
        });
        const data = await response.json();
        setLeases(data.leases);
      } catch (error) {
        console.error('Error fetching leases:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeases();
  }, [i18n.language]);

  const calculateDaysRemaining = (leaseStartDate: string): number => {
    const startDate = new Date(leaseStartDate);
    const today = new Date();
    const fourteenDaysLater = new Date(startDate);
    fourteenDaysLater.setDate(fourteenDaysLater.getDate() + 14);
    const daysRemaining = Math.ceil(
      (fourteenDaysLater.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.max(daysRemaining, 0);
  };

  const handleWithdrawalSubmit = async () => {
    if (!selectedLease || !withdrawalReason) {
      alert(t('validation.requiredFields'));
      return;
    }

    setWithdrawalInProgress(true);

    try {
      const response = await fetch('/api/tenant/leases/withdraw', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leaseId: selectedLease.id,
          reason: withdrawalReason,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setWithdrawalCompleted(true);
        setConfirmWithdrawal(false);
        setWithdrawalReason('');

        // Update lease status
        setLeases((prevLeases) =>
          prevLeases.map((lease) =>
            lease.id === selectedLease.id
              ? {
                  ...lease,
                  withdrawalWindow: {
                    ...lease.withdrawalWindow,
                    status: 'completed' as const,
                  },
                }
              : lease
          )
        );

        // Reset after 5 seconds
        setTimeout(() => {
          setWithdrawalCompleted(false);
          setSelectedLease(null);
        }, 5000);
      }
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      alert(t('withdrawal.error'));
    } finally {
      setWithdrawalInProgress(false);
    }
  };

  const getWindowStatus = (window: WithdrawalWindow): string => {
    if (window.status === 'completed') return t('withdrawal.completed');
    if (window.status === 'expired') return t('withdrawal.expired');
    return window.isWithinWindow
      ? t('withdrawal.active')
      : t('withdrawal.notAvailable');
  };

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  return (
    <div className={`statutory-withdrawal ${i18n.language === 'ar' ? 'rtl' : 'ltr'}`}>
      <h1>{t('tenant.statutoryWithdrawal')}</h1>

      {/* Legal Notice */}
      <div className="legal-notice">
        <strong>⚖️ {t('withdrawal.legalNotice')}:</strong>
        <p>{t('withdrawal.legalText')}</p>
        <p className="ref">{t('withdrawal.reference')}</p>
      </div>

      {/* Withdrawal Status */}
      <div className="withdrawal-section">
        <h2>{t('withdrawal.activeLeases')}</h2>

        {leases.length === 0 ? (
          <div className="no-eligible">
            <p>{t('withdrawal.noEligible')}</p>
          </div>
        ) : (
          <div className="leases-list">
            {leases.map((lease) => {
              const daysRemaining = calculateDaysRemaining(lease.leaseStartDate);
              const isWithinWindow = daysRemaining > 0 && daysRemaining <= 14;

              return (
                <div
                  key={lease.id}
                  className={`lease-card ${isWithinWindow ? 'eligible' : 'ineligible'}`}
                >
                  <div className="lease-header">
                    <h3>{lease.propertyAddress}</h3>
                    <span
                      className={`status-badge ${isWithinWindow ? 'active' : 'expired'}`}
                    >
                      {getWindowStatus(lease.withdrawalWindow)}
                    </span>
                  </div>

                  <div className="lease-details">
                    <div className="detail">
                      <span className="label">{t('common.startDate')}:</span>
                      <span className="value">
                        {new Date(lease.leaseStartDate).toLocaleDateString(
                          i18n.language
                        )}
                      </span>
                    </div>

                    <div className="detail">
                      <span className="label">{t('common.monthlyRent')}:</span>
                      <span className="value">{lease.monthlyRent} KWD</span>
                    </div>

                    {isWithinWindow && (
                      <div className="detail urgent">
                        <span className="label">⏰ {t('withdrawal.daysRemaining')}:</span>
                        <span className="value warning">{daysRemaining} {t('common.days')}</span>
                      </div>
                    )}
                  </div>

                  {isWithinWindow && selectedLease?.id !== lease.id && (
                    <button
                      className="btn-withdraw"
                      onClick={() => {
                        setSelectedLease(lease);
                        setConfirmWithdrawal(false);
                      }}
                    >
                      {t('withdrawal.initiateWithdrawal')}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Withdrawal Confirmation */}
      {selectedLease && (
        <div className="confirmation-section">
          <div className="confirmation-card">
            <h2>{t('withdrawal.confirmWithdrawal')}</h2>

            <div className="property-summary">
              <p>
                <strong>{t('withdrawal.property')}:</strong> {selectedLease.propertyAddress}
              </p>
              <p>
                <strong>{t('withdrawal.leaseDate')}:</strong>{' '}
                {new Date(selectedLease.leaseStartDate).toLocaleDateString(
                  i18n.language
                )}
              </p>
            </div>

            <div className="reason-section">
              <label>{t('withdrawal.withdrawalReason')}:</label>
              <textarea
                value={withdrawalReason}
                onChange={(e) => setWithdrawalReason(e.target.value)}
                placeholder={t('placeholder.withdrawalReason')}
                rows={4}
              />
            </div>

            <div className="warning-box">
              <strong>⚠️ {t('withdrawal.warning')}:</strong>
              <ul>
                <li>{t('withdrawal.warningPoint1')}</li>
                <li>{t('withdrawal.warningPoint2')}</li>
                <li>{t('withdrawal.warningPoint3')}</li>
              </ul>
            </div>

            {!confirmWithdrawal ? (
              <div className="actions">
                <button
                  className="btn-cancel"
                  onClick={() => setSelectedLease(null)}
                >
                  {t('common.cancel')}
                </button>
                <button
                  className="btn-proceed"
                  onClick={() => setConfirmWithdrawal(true)}
                  disabled={!withdrawalReason}
                >
                  {t('withdrawal.proceedToConfirm')}
                </button>
              </div>
            ) : (
              <div className="final-confirmation">
                <div className="confirmation-prompt">
                  <p>{t('withdrawal.finalConfirmation')}</p>
                  <div className="confirm-buttons">
                    <button
                      className="btn-cancel"
                      onClick={() => setConfirmWithdrawal(false)}
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      className="btn-withdraw-final"
                      onClick={handleWithdrawalSubmit}
                      disabled={withdrawalInProgress}
                    >
                      {withdrawalInProgress
                        ? t('common.processing')
                        : t('withdrawal.confirmWithdraw')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Success Message */}
      {withdrawalCompleted && (
        <div className="success-message">
          <h3>✓ {t('withdrawal.success')}</h3>
          <p>{t('withdrawal.successMessage')}</p>
        </div>
      )}
    </div>
  );
};

export default StatutoryWithdrawal;
