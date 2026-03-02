import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/BulkImportExport.css';

type ImportType = 'buildings' | 'units' | 'tenants' | 'leases' | 'payments';

const BulkImportExport: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [selectedType, setSelectedType] = useState<ImportType>('buildings');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{ success: number; errors: number } | null>(null);
  const [exportLoading, setExportLoading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUploadFile(event.target.files?.[0] || null);
    setImportProgress(0);
    setImportResults(null);
  };

  const handleImport = async () => {
    if (!uploadFile) {
      alert(t('validation.selectFile'));
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('type', selectedType);

    try {
      setImportProgress(10);
      const response = await fetch('/api/bulk/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      setImportProgress(50);

      if (response.ok) {
        const data = await response.json();
        setImportProgress(100);
        setImportResults({
          success: data.successCount,
          errors: data.errorCount,
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      alert(t('common.error'));
    }
  };

  const handleExport = async (type: ImportType) => {
    setExportLoading(true);
    try {
      const response = await fetch(`/api/bulk/export?type=${type}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-export-${Date.now()}.csv`;
      a.click();
    } catch (error) {
      console.error('Export error:', error);
      alert(t('common.error'));
    } finally {
      setExportLoading(false);
    }
  };

  const getTemplateUrl = (type: ImportType) => {
    return `/templates/${type}-template.csv`;
  };

  return (
    <div className={`bulk-import-export ${i18n.language === 'ar' ? 'rtl' : 'ltr'}`}>
      <h1>📊 {t('landlord.bulkImportExport')}</h1>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'import' ? 'active' : ''}`}
          onClick={() => setActiveTab('import')}
        >
          {t('common.import')}
        </button>
        <button
          className={`tab-btn ${activeTab === 'export' ? 'active' : ''}`}
          onClick={() => setActiveTab('export')}
        >
          {t('common.export')}
        </button>
      </div>

      {/* Import Tab */}
      {activeTab === 'import' && (
        <div className="import-section">
          <h2>{t('common.importData')}</h2>

          <div className="import-form">
            <div className="form-group">
              <label>{t('common.dataType')}:</label>
              <select value={selectedType} onChange={(e) => setSelectedType(e.target.value as ImportType)}>
                <option value="buildings">{t('common.buildings')}</option>
                <option value="units">{t('common.units')}</option>
                <option value="tenants">{t('common.tenants')}</option>
                <option value="leases">{t('common.leases')}</option>
                <option value="payments">{t('common.payments')}</option>
              </select>
            </div>

            <div className="download-template">
              <p>{t('common.downloadTemplate')}:</p>
              <a href={getTemplateUrl(selectedType)} download className="btn-link">
                📥 {t('common.downloadTemplate')} ({selectedType}.csv)
              </a>
            </div>

            <div className="form-group">
              <label>{t('common.csvFile')}:</label>
              <div className="file-upload">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  disabled={importProgress > 0}
                />
                {uploadFile && <p>✓ {uploadFile.name}</p>}
              </div>
            </div>

            {importProgress > 0 && (
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${importProgress}%` }}
                ></div>
                <span className="progress-text">{importProgress}%</span>
              </div>
            )}

            {importResults && (
              <div className="import-results">
                <h3>{t('common.importResults')}</h3>
                <p className="success">✓ {importResults.success} {t('common.imported')}</p>
                {importResults.errors > 0 && (
                  <p className="error">✕ {importResults.errors} {t('common.failed')}</p>
                )}
              </div>
            )}

            <button
              className="btn-primary"
              onClick={handleImport}
              disabled={!uploadFile || importProgress > 0}
            >
              {t('common.startImport')}
            </button>
          </div>
        </div>
      )}

      {/* Export Tab */}
      {activeTab === 'export' && (
        <div className="export-section">
          <h2>{t('common.exportData')}</h2>

          <div className="export-options">
            {(['buildings', 'units', 'tenants', 'leases', 'payments'] as ImportType[]).map(
              (type) => (
                <div key={type} className="export-option">
                  <h3>{t(`common.${type}`)}</h3>
                  <button
                    className="btn-primary"
                    onClick={() => handleExport(type)}
                    disabled={exportLoading}
                  >
                    📥 {t('common.export')}
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkImportExport;
