import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/LeaseDocumentGenerator.css';

interface LeaseTemplate {
  id: string;
  name: string;
  description: string;
  variables: string[];
}

interface LeaseData {
  tenantName: string;
  tenantId: string;
  landlordName: string;
  buildingAddress: string;
  unitNumber: string;
  rentAmount: number;
  startDate: string;
  endDate: string;
  managementFee: number;
  paciLeaseId?: string;
  terms?: string;
}

const LeaseDocumentGenerator: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [templates, setTemplates] = useState<LeaseTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<LeaseTemplate | null>(null);
  const [leaseData, setLeaseData] = useState<LeaseData>({
    tenantName: '',
    tenantId: '',
    landlordName: '',
    buildingAddress: '',
    unitNumber: '',
    rentAmount: 0,
    startDate: '',
    endDate: '',
    managementFee: 0,
  });
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateLease = async () => {
    if (!selectedTemplate || !leaseData.tenantName) {
      alert(t('validation.fillAllFields'));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/leases/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          leaseData,
          language: i18n.language,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPreview(data.previewUrl);
      }
    } catch (error) {
      console.error('Error generating lease:', error);
      alert(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!preview) return;

    try {
      const response = await fetch('/api/leases/export-pdf', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          previewUrl: preview,
          leaseData,
        }),
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lease-${leaseData.unitNumber}-${Date.now()}.pdf`;
      a.click();
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  const handleSignAndSubmit = async () => {
    if (!preview) return;

    try {
      const response = await fetch('/api/leases/sign-and-submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          previewUrl: preview,
          leaseData,
        }),
      });

      if (response.ok) {
        alert(t('lease.signedAndSubmitted'));
        // Reset form
        setPreview(null);
        setSelectedTemplate(null);
      }
    } catch (error) {
      console.error('Error signing lease:', error);
      alert(t('common.error'));
    }
  };

  return (
    <div className={`lease-document-generator ${i18n.language === 'ar' ? 'rtl' : 'ltr'}`}>
      <h1>📜 {t('landlord.leaseDocumentGenerator')}</h1>

      <div className="generator-container">
        <div className="form-section">
          <h2>{t('lease.selectTemplate')}</h2>
          <div className="template-selector">
            <select
              value={selectedTemplate?.id || ''}
              onChange={(e) => {
                const template = templates.find((t) => t.id === e.target.value);
                setSelectedTemplate(template || null);
              }}
            >
              <option value="">{t('common.selectTemplate')}</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {selectedTemplate && (
            <>
              <h2>{t('lease.leaseDetails')}</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>{t('common.tenantName')}:</label>
                  <input
                    type="text"
                    value={leaseData.tenantName}
                    onChange={(e) =>
                      setLeaseData({ ...leaseData, tenantName: e.target.value })
                    }
                    placeholder={t('placeholder.tenantName')}
                  />
                </div>

                <div className="form-group">
                  <label>{t('common.landlordName')}:</label>
                  <input
                    type="text"
                    value={leaseData.landlordName}
                    onChange={(e) =>
                      setLeaseData({ ...leaseData, landlordName: e.target.value })
                    }
                    placeholder={t('placeholder.landlordName')}
                  />
                </div>

                <div className="form-group">
                  <label>{t('common.address')}:</label>
                  <input
                    type="text"
                    value={leaseData.buildingAddress}
                    onChange={(e) =>
                      setLeaseData({ ...leaseData, buildingAddress: e.target.value })
                    }
                    placeholder={t('placeholder.address')}
                  />
                </div>

                <div className="form-group">
                  <label>{t('common.unit')}:</label>
                  <input
                    type="text"
                    value={leaseData.unitNumber}
                    onChange={(e) =>
                      setLeaseData({ ...leaseData, unitNumber: e.target.value })
                    }
                    placeholder={t('placeholder.unitNumber')}
                  />
                </div>

                <div className="form-group">
                  <label>{t('common.monthlyRent')}:</label>
                  <input
                    type="number"
                    value={leaseData.rentAmount}
                    onChange={(e) =>
                      setLeaseData({ ...leaseData, rentAmount: parseFloat(e.target.value) })
                    }
                    placeholder="0.000"
                  />
                </div>

                <div className="form-group">
                  <label>{t('common.managementFee')}:</label>
                  <input
                    type="number"
                    value={leaseData.managementFee}
                    onChange={(e) =>
                      setLeaseData({ ...leaseData, managementFee: parseFloat(e.target.value) })
                    }
                    placeholder="0.000"
                  />
                </div>

                <div className="form-group">
                  <label>{t('common.startDate')}:</label>
                  <input
                    type="date"
                    value={leaseData.startDate}
                    onChange={(e) =>
                      setLeaseData({ ...leaseData, startDate: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>{t('common.endDate')}:</label>
                  <input
                    type="date"
                    value={leaseData.endDate}
                    onChange={(e) =>
                      setLeaseData({ ...leaseData, endDate: e.target.value })
                    }
                  />
                </div>
              </div>

              <button
                className="btn-primary"
                onClick={handleGenerateLease}
                disabled={loading}
              >
                {loading ? t('common.generating') : t('lease.generatePreview')}
              </button>
            </>
          )}
        </div>

        {/* Preview & Actions */}
        {preview && (
          <div className="preview-section">
            <h2>{t('lease.preview')}</h2>
            <iframe src={preview} className="preview-iframe"></iframe>

            <div className="preview-actions">
              <button className="btn-primary" onClick={handleDownloadPDF}>
                📥 {t('common.downloadPDF')}
              </button>
              <button className="btn-success" onClick={handleSignAndSubmit}>
                ✓ {t('lease.signAndSubmit')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaseDocumentGenerator;
