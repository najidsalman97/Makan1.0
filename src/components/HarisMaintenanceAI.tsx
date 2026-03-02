import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AIClassificationService, { ClassificationResult } from '../services/AIClassificationService';
import '../styles/HarisMaintenanceAI.css';

const HarisMaintenanceAI: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [classification, setClassification] = useState<ClassificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
      setClassification(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!selectedImage || !description) {
      setError(t('validation.requiredFields'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await AIClassificationService.classifyMaintenanceIssue(
        selectedImage,
        description
      );
      setClassification(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string): string => {
    const colors: Record<string, string> = {
      critical: '#f44336',
      high: '#ff9800',
      medium: '#2196f3',
      low: '#4caf50',
    };
    return colors[severity] || '#999';
  };

  return (
    <div className={`haris-maintenance-ai ${i18n.language === 'ar' ? 'rtl' : 'ltr'}`}>
      <h1>🤖 {t('haris.aiMaintenanceCapture')}</h1>

      <div className="ai-container">
        {/* Image Upload */}
        <div className="upload-section">
          <div
            className="image-preview"
            onClick={() => fileInputRef.current?.click()}
            style={{
              backgroundImage: selectedImage ? `url(${selectedImage})` : 'none',
            }}
          >
            {!selectedImage && (
              <div className="upload-placeholder">
                <span>📷 {t('haris.clickToUpload')}</span>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            style={{ display: 'none' }}
          />

          {selectedImage && (
            <button
              className="btn-remove"
              onClick={() => {
                setSelectedImage(null);
                setClassification(null);
              }}
            >
              {t('common.remove')}
            </button>
          )}
        </div>

        {/* Description */}
        <div className="form-group">
          <label>{t('haris.issueDescription')}:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('placeholder.description')}
            rows={4}
          />
        </div>

        {/* Analyze Button */}
        <button
          className="btn-analyze"
          onClick={handleAnalyze}
          disabled={loading || !selectedImage}
        >
          {loading ? t('common.analyzing') : t('haris.analyzeWithAI')}
        </button>

        {error && <div className="error-message">{error}</div>}

        {/* Classification Result */}
        {classification && (
          <div className="classification-result">
            <h2>🔍 {t('haris.analysisResult')}</h2>

            <div className="result-grid">
              <div className="result-card">
                <span className="label">{t('haris.category')}:</span>
                <span className="value category">
                  {classification.category === 'structural'
                    ? '🏗️ Structural'
                    : classification.category === 'usage'
                    ? '👤 Usage'
                    : '❓ Unclear'}
                </span>
              </div>

              <div
                className="result-card"
                style={{ backgroundColor: getSeverityColor(classification.severity) }}
              >
                <span className="label">{t('haris.severity')}:</span>
                <span className="value">{classification.severity.toUpperCase()}</span>
              </div>

              <div className="result-card">
                <span className="label">{t('haris.responsibleParty')}:</span>
                <span className="value">
                  {classification.responsibleParty === 'landlord'
                    ? '🏠 Landlord'
                    : classification.responsibleParty === 'tenant'
                    ? '👥 Tenant'
                    : '⚖️ Both'}
                </span>
              </div>

              <div className="result-card">
                <span className="label">{t('haris.confidence')}:</span>
                <span className="value">{(classification.confidence * 100).toFixed(1)}%</span>
              </div>
            </div>

            <div className="description-box">
              <strong>{t('common.description')}:</strong>
              <p>{classification.description}</p>
            </div>

            <div className="estimate-box">
              <strong>{t('haris.estimatedCost')}:</strong>
              <p>{classification.estimatedCost || 'TBD'}</p>
            </div>

            <div className="action-box">
              <strong>{t('haris.recommendedAction')}:</strong>
              <p>{classification.recommendedAction}</p>
            </div>

            <div className="tags">
              {classification.tags.map((tag, i) => (
                <span key={i} className="tag">
                  {tag}
                </span>
              ))}
            </div>

            <div className="action-buttons">
              <button className="btn-approve">{t('common.approve')}</button>
              <button className="btn-reassign">{t('haris.reassignToContractor')}</button>
              <button className="btn-dispute">{t('common.dispute')}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HarisMaintenanceAI;
