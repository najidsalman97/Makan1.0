import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/MOCICompliance.css';

interface LicenseDocument {
  id: string;
  licenseNumber: string;
  businessName: string;
  tradeName: string;
  issueDate: string;
  expiryDate: string;
  documentUrl: string;
  status: 'active' | 'expiring_soon' | 'expired';
  verificationHash: string;
}

const MOCICompliance: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [licenses, setLicenses] = useState<LicenseDocument[]>([]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState({
    licenseNumber: '',
    businessName: '',
    tradeName: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLicenses = async () => {
      try {
        const response = await fetch('/api/moci/licenses', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Accept-Language': i18n.language,
          },
        });
        const data = await response.json();
        setLicenses(data.licenses);
      } catch (error) {
        console.error('Error fetching licenses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLicenses();
  }, [i18n.language]);

  const handleFileUpload = async () => {
    if (!uploadFile || !uploadData.licenseNumber) {
      alert(t('validation.requiredFields'));
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('licenseNumber', uploadData.licenseNumber);
    formData.append('businessName', uploadData.businessName);
    formData.append('tradeName', uploadData.tradeName);

    try {
      const response = await fetch('/api/moci/upload-license', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (response.ok) {
        const newLicense = await response.json();
        setLicenses([...licenses, newLicense.license]);
        setUploadFile(null);
        setUploadData({ licenseNumber: '', businessName: '', tradeName: '' });
        setShowUploadForm(false);
        alert(t('moci.uploadSuccess'));
      }
    } catch (error) {
      console.error('Error uploading license:', error);
      alert(t('moci.uploadError'));
    }
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      active: '#4caf50',
      expiring_soon: '#ff9800',
      expired: '#f44336',
    };
    return colors[status] || '#999';
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      active: t('moci.active'),
      expiring_soon: t('moci.expiringSoon'),
      expired: t('moci.expired'),
    };
    return labels[status] || status;
  };

  const isExpiringSoon = (expiryDate: string): boolean => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry =
      (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  return (
    <div className={`moci-compliance ${i18n.language === 'ar' ? 'rtl' : 'ltr'}`}>
      <h1>{t('moci.compliancePortal')}</h1>

      {/* Compliance Summary */}
      <div className="compliance-summary">
        <div className="summary-card">
          <h3>{t('moci.totalLicenses')}</h3>
          <p className="count">{licenses.length}</p>
        </div>
        <div className="summary-card">
          <h3>{t('moci.activeLicenses')}</h3>
          <p className="count" style={{ color: '#4caf50' }}>
            {licenses.filter((l) => l.status === 'active').length}
          </p>
        </div>
        <div className="summary-card">
          <h3>{t('moci.expiringSoon')}</h3>
          <p className="count warning" style={{ color: '#ff9800' }}>
            {licenses.filter((l) => l.status === 'expiring_soon').length}
          </p>
        </div>
        <div className="summary-card">
          <h3>{t('moci.expired')}</h3>
          <p className="count critical" style={{ color: '#f44336' }}>
            {licenses.filter((l) => l.status === 'expired').length}
          </p>
        </div>
      </div>

      {/* Upload Button */}
      <div className="action-bar">
        <button
          className="btn-primary"
          onClick={() => setShowUploadForm(!showUploadForm)}
        >
          {showUploadForm ? t('common.cancel') : t('moci.uploadLicense')}
        </button>
      </div>

      {/* Upload Form */}
      {showUploadForm && (
        <div className="upload-form-container">
          <h3>{t('moci.uploadNewLicense')}</h3>

          <div className="form-group">
            <label>{t('moci.licenseNumber')}:</label>
            <input
              type="text"
              value={uploadData.licenseNumber}
              onChange={(e) =>
                setUploadData({ ...uploadData, licenseNumber: e.target.value })
              }
              placeholder={t('placeholder.licenseNumber')}
              required
            />
          </div>

          <div className="form-group">
            <label>{t('moci.businessName')}:</label>
            <input
              type="text"
              value={uploadData.businessName}
              onChange={(e) =>
                setUploadData({ ...uploadData, businessName: e.target.value })
              }
              placeholder={t('placeholder.businessName')}
            />
          </div>

          <div className="form-group">
            <label>{t('moci.tradeName')}:</label>
            <input
              type="text"
              value={uploadData.tradeName}
              onChange={(e) =>
                setUploadData({ ...uploadData, tradeName: e.target.value })
              }
              placeholder={t('placeholder.tradeName')}
            />
          </div>

          <div className="form-group">
            <label>{t('moci.licenseDocument')}:</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              required
            />
          </div>

          <button className="btn-primary" onClick={handleFileUpload}>
            {t('common.upload')}
          </button>
        </div>
      )}

      {/* Licenses List */}
      <div className="licenses-grid">
        {licenses.map((license) => (
          <div
            key={license.id}
            className="license-card"
            style={{ borderLeftColor: getStatusColor(license.status) }}
          >
            <div className="license-header">
              <h3>{license.tradeName || license.businessName}</h3>
              <span
                className="status-badge"
                style={{ backgroundColor: getStatusColor(license.status) }}
              >
                {getStatusLabel(license.status)}
              </span>
            </div>

            <div className="license-details">
              <div className="detail-row">
                <span className="label">{t('moci.licenseNumber')}:</span>
                <span className="value">{license.licenseNumber}</span>
              </div>

              <div className="detail-row">
                <span className="label">{t('moci.businessName')}:</span>
                <span className="value">{license.businessName}</span>
              </div>

              <div className="detail-row">
                <span className="label">{t('common.issueDate')}:</span>
                <span className="value">
                  {new Date(license.issueDate).toLocaleDateString(i18n.language)}
                </span>
              </div>

              <div className="detail-row">
                <span className="label">{t('common.expiryDate')}:</span>
                <span
                  className={`value ${isExpiringSoon(license.expiryDate) ? 'warning' : ''}`}
                >
                  {new Date(license.expiryDate).toLocaleDateString(i18n.language)}
                </span>
              </div>

              <div className="detail-row">
                <span className="label">{t('moci.verificationHash')}:</span>
                <span className="value monospace">{license.verificationHash.substring(0, 16)}...</span>
              </div>
            </div>

            <div className="license-actions">
              <a
                href={license.documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-link"
              >
                {t('common.viewDocument')}
              </a>

              {isExpiringSoon(license.expiryDate) && (
                <button className="btn-secondary warning">
                  {t('moci.renewLicense')}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {licenses.length === 0 && (
        <div className="empty-state">
          <p>{t('moci.noLicenses')}</p>
        </div>
      )}
    </div>
  );
};

export default MOCICompliance;
