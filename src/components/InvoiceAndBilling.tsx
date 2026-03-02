import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/InvoiceAndBilling.css';

interface Invoice {
  id: string;
  invoiceNumber: string;
  tenantId: string;
  tenantName: string;
  buildingId: string;
  unitNumber: string;
  monthYear: string;
  items: InvoiceItem[];
  subtotal: number;
  managementFee: number;
  total: number;
  dueDate: string;
  status: 'draft' | 'issued' | 'overdue' | 'paid' | 'partially_paid';
  paidAmount: number;
  createdAt: string;
  pdfUrl?: string;
}

interface InvoiceItem {
  description: string;
  amount: number;
  category: 'rent' | 'utilities' | 'maintenance' | 'fee' | 'other';
}

const InvoiceAndBilling: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showGenerator, setShowGenerator] = useState(false);
  const [generatorData, setGeneratorData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    buildingId: '',
  });

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await fetch('/api/billing/invoices', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data = await response.json();
        setInvoices(data.invoices);
      } catch (error) {
        console.error('Error fetching invoices:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  const handleGenerateInvoices = async () => {
    try {
      const response = await fetch('/api/billing/generate-invoices', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(generatorData),
      });

      if (response.ok) {
        const data = await response.json();
        setInvoices([...invoices, ...data.invoices]);
        setShowGenerator(false);
        alert(t('billing.invoicesGenerated'));
      }
    } catch (error) {
      console.error('Error generating invoices:', error);
      alert(t('billing.generationError'));
    }
  };

  const handleDownloadPDF = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/billing/invoices/${invoiceId}/pdf`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      a.click();
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  const handleSendInvoice = async (invoiceId: string, channel: 'email' | 'sms' | 'whatsapp') => {
    try {
      const response = await fetch(`/api/billing/invoices/${invoiceId}/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ channel }),
      });

      if (response.ok) {
        alert(t(`billing.sentVia${channel.charAt(0).toUpperCase() + channel.slice(1)}`));
      }
    } catch (error) {
      console.error('Error sending invoice:', error);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat(i18n.language === 'ar' ? 'ar-KW' : 'en-KW', {
      style: 'currency',
      currency: 'KWD',
    }).format(value);
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      draft: '#9e9e9e',
      issued: '#2196f3',
      overdue: '#f44336',
      paid: '#4caf50',
      partially_paid: '#ff9800',
    };
    return colors[status] || '#999';
  };

  const filteredInvoices = invoices.filter(
    (inv) => filter === 'all' || inv.status === filter
  );

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  return (
    <div className={`invoice-billing ${i18n.language === 'ar' ? 'rtl' : 'ltr'}`}>
      <h1>{t('landlord.invoiceAndBilling')}</h1>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="card">
          <label>{t('billing.totalInvoiced')}</label>
          <p className="value">
            {formatCurrency(invoices.reduce((sum, inv) => sum + inv.total, 0))}
          </p>
        </div>
        <div className="card highlight">
          <label>{t('billing.totalCollected')}</label>
          <p className="value green">
            {formatCurrency(invoices.reduce((sum, inv) => sum + inv.paidAmount, 0))}
          </p>
        </div>
        <div className="card">
          <label>{t('billing.outstanding')}</label>
          <p className="value red">
            {formatCurrency(
              invoices.reduce((sum, inv) => sum + (inv.total - inv.paidAmount), 0)
            )}
          </p>
        </div>
        <div className="card">
          <label>{t('billing.overdueCount')}</label>
          <p className="value critical">
            {invoices.filter((inv) => inv.status === 'overdue').length}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="action-bar">
        <button className="btn-primary" onClick={() => setShowGenerator(!showGenerator)}>
          {showGenerator ? t('common.cancel') : t('billing.generateInvoices')}
        </button>
      </div>

      {/* Generator */}
      {showGenerator && (
        <div className="generator-form">
          <h3>{t('billing.generateInvoices')}</h3>
          <div className="form-group">
            <label>{t('common.month')}:</label>
            <input
              type="number"
              min="1"
              max="12"
              value={generatorData.month}
              onChange={(e) =>
                setGeneratorData({ ...generatorData, month: parseInt(e.target.value) })
              }
            />
          </div>
          <div className="form-group">
            <label>{t('common.year')}:</label>
            <input
              type="number"
              value={generatorData.year}
              onChange={(e) =>
                setGeneratorData({ ...generatorData, year: parseInt(e.target.value) })
              }
            />
          </div>
          <button className="btn-primary" onClick={handleGenerateInvoices}>
            {t('billing.generate')}
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="filter-buttons">
        {['all', 'draft', 'issued', 'overdue', 'paid', 'partially_paid'].map((status) => (
          <button
            key={status}
            className={`filter-btn ${filter === status ? 'active' : ''}`}
            onClick={() => setFilter(status)}
          >
            {t(`billing.status_${status}`)}
          </button>
        ))}
      </div>

      {/* Invoices List */}
      <div className="invoices-table">
        <table>
          <thead>
            <tr>
              <th>{t('common.invoiceNumber')}</th>
              <th>{t('common.tenant')}</th>
              <th>{t('common.unit')}</th>
              <th>{t('common.month')}</th>
              <th>{t('common.total')}</th>
              <th>{t('common.paid')}</th>
              <th>{t('common.status')}</th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map((invoice) => (
              <tr key={invoice.id}>
                <td>{invoice.invoiceNumber}</td>
                <td>{invoice.tenantName}</td>
                <td>{invoice.unitNumber}</td>
                <td>{invoice.monthYear}</td>
                <td>{formatCurrency(invoice.total)}</td>
                <td>{formatCurrency(invoice.paidAmount)}</td>
                <td>
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(invoice.status) }}
                  >
                    {t(`billing.status_${invoice.status}`)}
                  </span>
                </td>
                <td>
                  <button
                    className="btn-small"
                    onClick={() => setSelectedInvoice(invoice)}
                  >
                    {t('common.view')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Details Modal */}
      {selectedInvoice && (
        <div className="modal-overlay" onClick={() => setSelectedInvoice(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('common.invoiceDetails')}</h2>
              <button className="btn-close" onClick={() => setSelectedInvoice(null)}>
                ✕
              </button>
            </div>

            <div className="invoice-details">
              <div className="detail-row">
                <span>{t('common.invoiceNumber')}:</span>
                <strong>{selectedInvoice.invoiceNumber}</strong>
              </div>
              <div className="detail-row">
                <span>{t('common.tenant')}:</span>
                <strong>{selectedInvoice.tenantName}</strong>
              </div>
              <div className="detail-row">
                <span>{t('common.dueDate')}:</span>
                <strong>{new Date(selectedInvoice.dueDate).toLocaleDateString(i18n.language)}</strong>
              </div>

              <table className="items-table">
                <thead>
                  <tr>
                    <th>{t('common.description')}</th>
                    <th>{t('common.amount')}</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.items.map((item, i) => (
                    <tr key={i}>
                      <td>{item.description}</td>
                      <td>{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="totals">
                <div className="total-row">
                  <span>{t('billing.subtotal')}:</span>
                  <strong>{formatCurrency(selectedInvoice.subtotal)}</strong>
                </div>
                <div className="total-row">
                  <span>{t('billing.managementFee')}:</span>
                  <strong>{formatCurrency(selectedInvoice.managementFee)}</strong>
                </div>
                <div className="total-row total">
                  <span>{t('common.total')}:</span>
                  <strong>{formatCurrency(selectedInvoice.total)}</strong>
                </div>
              </div>

              <div className="action-buttons">
                <button
                  className="btn-primary"
                  onClick={() => handleDownloadPDF(selectedInvoice.id)}
                >
                  📄 {t('common.downloadPDF')}
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => handleSendInvoice(selectedInvoice.id, 'email')}
                >
                  📧 {t('common.sendEmail')}
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => handleSendInvoice(selectedInvoice.id, 'whatsapp')}
                >
                  💬 {t('common.sendWhatsApp')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceAndBilling;
