import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/LatePaymentAutomation.css';

interface LatePayment {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantPhone: string;
  buildingId: string;
  unitNumber: string;
  leaseId: string;
  dueAmount: number;
  dueDate: string;
  daysPastDue: number;
  remindersSent: number;
  lastReminder?: string;
  escalationLevel: 0 | 1 | 2 | 3;
  status: 'pending' | 'sent_reminder_1' | 'sent_reminder_2' | 'sent_reminder_3' | 'escalated' | 'eviction_notice';
}

interface PaymentSchedule {
  schedule: Array<{
    day: number;
    action: 'reminder1' | 'reminder2' | 'reminder3' | 'escalation' | 'eviction';
    channel: 'sms' | 'email' | 'whatsapp';
  }>;
}

const LatePaymentAutomation: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [latePayments, setLatePayments] = useState<LatePayment[]>([]);
  const [schedule, setSchedule] = useState<PaymentSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<LatePayment | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [autoSendEnabled, setAutoSendEnabled] = useState(true);

  useEffect(() => {
    const fetchLatePayments = async () => {
      try {
        const [paymentsRes, scheduleRes] = await Promise.all([
          fetch('/api/payments/late', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          }),
          fetch('/api/payments/reminder-schedule', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          }),
        ]);

        const payments = await paymentsRes.json();
        const scheduleData = await scheduleRes.json();

        setLatePayments(payments.latePayments);
        setSchedule(scheduleData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLatePayments();
  }, []);

  const handleSendReminder = async (payment: LatePayment, reminderNumber: 1 | 2 | 3) => {
    try {
      const response = await fetch(`/api/payments/send-reminder`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId: payment.id,
          reminderNumber,
          channel: 'whatsapp',
        }),
      });

      if (response.ok) {
        setLatePayments(
          latePayments.map((p) =>
            p.id === payment.id
              ? {
                  ...p,
                  remindersSent: reminderNumber,
                  lastReminder: new Date().toISOString(),
                  status: `sent_reminder_${reminderNumber}` as any,
                }
              : p
          )
        );
        alert(t('latePayment.reminderSent'));
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
    }
  };

  const handleEscalate = async (payment: LatePayment) => {
    try {
      const response = await fetch(`/api/payments/escalate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId: payment.id,
        }),
      });

      if (response.ok) {
        setLatePayments(
          latePayments.map((p) =>
            p.id === payment.id
              ? {
                  ...p,
                  escalationLevel: 3,
                  status: 'escalated',
                }
              : p
          )
        );
        alert(t('latePayment.escalated'));
      }
    } catch (error) {
      console.error('Error escalating:', error);
    }
  };

  const handleGenerateEvictionNotice = async (payment: LatePayment) => {
    try {
      const response = await fetch(`/api/payments/generate-eviction-notice`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId: payment.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(t('latePayment.evictionNoticeGenerated'));
        // Download or display notice
        window.open(data.noticeUrl, '_blank');
      }
    } catch (error) {
      console.error('Error generating notice:', error);
    }
  };

  const getProgressStatus = (payment: LatePayment): JSX.Element[] => {
    const steps = [
      { day: 3, label: '3-Day Reminder', status: payment.daysPastDue >= 3 },
      { day: 7, label: '7-Day Reminder', status: payment.daysPastDue >= 7 },
      { day: 14, label: '14-Day Final', status: payment.daysPastDue >= 14 },
      { day: 30, label: 'Eviction', status: payment.daysPastDue >= 30 },
    ];

    return steps.map((step) => (
      <div key={step.day} className={`progress-step ${step.status ? 'completed' : ''}`}>
        <div className="step-marker"></div>
        <span className="step-label">{step.label}</span>
      </div>
    ));
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat(i18n.language === 'ar' ? 'ar-KW' : 'en-KW', {
      style: 'currency',
      currency: 'KWD',
    }).format(value);
  };

  const filteredPayments = latePayments.filter((p) => {
    if (filter === 'all') return true;
    if (filter === 'critical') return p.daysPastDue >= 30;
    if (filter === 'urgent') return p.daysPastDue >= 14 && p.daysPastDue < 30;
    if (filter === 'warning') return p.daysPastDue < 14;
    return true;
  });

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  return (
    <div className={`late-payment-automation ${i18n.language === 'ar' ? 'rtl' : 'ltr'}`}>
      <h1>⏰ {t('latePayment.automationCenter')}</h1>

      {/* Summary */}
      <div className="summary-cards">
        <div className="card">
          <label>{t('latePayment.totalOverdue')}</label>
          <p className="value red">
            {formatCurrency(latePayments.reduce((sum, p) => sum + p.dueAmount, 0))}
          </p>
        </div>
        <div className="card">
          <label>{t('latePayment.criticalCount')}</label>
          <p className="value critical">
            {latePayments.filter((p) => p.daysPastDue >= 30).length}
          </p>
        </div>
        <div className="card">
          <label>{t('latePayment.urgentCount')}</label>
          <p className="value warning">
            {latePayments.filter((p) => p.daysPastDue >= 14 && p.daysPastDue < 30).length}
          </p>
        </div>
        <div className="card">
          <label>{t('latePayment.autoRemindersEnabled')}</label>
          <div className="toggle">
            <input
              type="checkbox"
              checked={autoSendEnabled}
              onChange={(e) => setAutoSendEnabled(e.target.checked)}
            />
            <span>{autoSendEnabled ? t('common.enabled') : t('common.disabled')}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-buttons">
        {['all', 'critical', 'urgent', 'warning'].map((status) => (
          <button
            key={status}
            className={`filter-btn ${filter === status ? 'active' : ''}`}
            onClick={() => setFilter(status)}
          >
            {t(`latePayment.filter_${status}`)}
          </button>
        ))}
      </div>

      {/* Late Payments List */}
      <div className="late-payments-list">
        {filteredPayments.map((payment) => (
          <div key={payment.id} className="payment-card">
            <div className="card-header">
              <div className="card-title">
                <h3>{payment.tenantName}</h3>
                <p className="unit">
                  {t('common.unit')} {payment.unitNumber}
                </p>
              </div>
              <div className="card-amount">
                <p className="amount">{formatCurrency(payment.dueAmount)}</p>
                <p className="days-overdue">
                  {payment.daysPastDue} {t('common.daysPastDue')}
                </p>
              </div>
            </div>

            <div className="progress-timeline">
              {getProgressStatus(payment)}
            </div>

            <div className="card-actions">
              {payment.remindersSent < 1 && payment.daysPastDue >= 3 && (
                <button
                  className="btn-action reminder-1"
                  onClick={() => handleSendReminder(payment, 1)}
                >
                  {t('latePayment.send3DayReminder')}
                </button>
              )}
              {payment.remindersSent < 2 && payment.daysPastDue >= 7 && (
                <button
                  className="btn-action reminder-2"
                  onClick={() => handleSendReminder(payment, 2)}
                >
                  {t('latePayment.send7DayReminder')}
                </button>
              )}
              {payment.remindersSent < 3 && payment.daysPastDue >= 14 && (
                <button
                  className="btn-action reminder-3"
                  onClick={() => handleSendReminder(payment, 3)}
                >
                  {t('latePayment.sendFinalReminder')}
                </button>
              )}
              {payment.daysPastDue >= 14 && payment.escalationLevel < 3 && (
                <button
                  className="btn-action escalate"
                  onClick={() => handleEscalate(payment)}
                >
                  {t('latePayment.escalate')}
                </button>
              )}
              {payment.daysPastDue >= 30 && (
                <button
                  className="btn-action eviction"
                  onClick={() => handleGenerateEvictionNotice(payment)}
                >
                  ⚖️ {t('latePayment.generateEvictionNotice')}
                </button>
              )}
              <button
                className="btn-action view"
                onClick={() => setSelectedPayment(payment)}
              >
                {t('common.details')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Details Modal */}
      {selectedPayment && (
        <div className="modal-overlay" onClick={() => setSelectedPayment(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{t('latePayment.paymentDetails')}</h2>
            <div className="details">
              <p>
                <strong>{t('common.tenant')}:</strong> {selectedPayment.tenantName}
              </p>
              <p>
                <strong>{t('common.amount')}:</strong> {formatCurrency(selectedPayment.dueAmount)}
              </p>
              <p>
                <strong>{t('common.dueDate')}:</strong>{' '}
                {new Date(selectedPayment.dueDate).toLocaleDateString(i18n.language)}
              </p>
              <p>
                <strong>{t('latePayment.daysPastDue')}:</strong> {selectedPayment.daysPastDue}
              </p>
            </div>
            <button className="btn-close" onClick={() => setSelectedPayment(null)}>
              {t('common.close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LatePaymentAutomation;
