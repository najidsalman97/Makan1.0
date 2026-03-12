import React, { useState } from 'react';
import '../styles/HarisMaintenanceAI.css';

type Result = {
  classification: string;
  confidence: number;
};

export default function HarisMaintenanceAI() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [description, setDescription] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSelectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    setResult(null);
    setError('');

    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl('');
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile || !description.trim()) {
      setError('Please select an image and enter a description.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userRaw = localStorage.getItem('user');
      const user = userRaw ? JSON.parse(userRaw) : null;
      const reporterId = user?.id || 1;

      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('buildingId', '1');
      formData.append('reporterId', String(reporterId));
      formData.append('description', description);

      const response = await fetch('/api/maintenance/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to analyze maintenance issue.');
      }

      setResult({
        classification: data.classification,
        confidence: Number(data.confidence || 0),
      });
    } catch (err: any) {
      setError(err?.message || 'Analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="haris-maintenance-ai">
      <h1>Maintenance Triage</h1>

      <div className="upload-section">
        <div className="upload-area">
          <input type="file" accept="image/*" onChange={onSelectFile} />
          <p>Upload maintenance issue image</p>
        </div>

        {previewUrl && <img src={previewUrl} alt="Preview" className="image-preview" />}

        <div className="result-detail">
          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue (e.g., leaking pipe, broken AC)"
            rows={4}
            style={{ width: '100%', marginTop: 8, padding: 8 }}
          />
        </div>

        <div className="upload-buttons">
          <button className="btn-upload" onClick={handleAnalyze} disabled={loading}>
            {loading ? 'Analyzing...' : 'Analyze Issue'}
          </button>
        </div>

        {error && (
          <div className="result-detail" style={{ borderLeftColor: '#f44336' }}>
            <label>Error</label>
            <div>{error}</div>
          </div>
        )}
      </div>

      {result && (
        <div className="classification-result">
          <div
            className={`severity-badge ${
              result.classification === 'Structural/Landlord' ? 'severity-high' : 'severity-medium'
            }`}
          >
            {result.classification}
          </div>

          <div className="result-detail">
            <label>Confidence</label>
            <div>{Math.round(result.confidence * 100)}%</div>
          </div>

          <div className="action-buttons">
            <button className="btn-action btn-approve">Approve</button>
            <button className="btn-action btn-reassign">Reassign</button>
            <button className="btn-action btn-dispute">Dispute</button>
          </div>
        </div>
      )}
    </div>
  );
}
