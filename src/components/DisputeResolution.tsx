import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/DisputeResolution.css';

interface Dispute {
  id: string;
  type: 'maintenance' | 'payment' | 'lease' | 'other';
  status: 'open' | 'in_discussion' | 'escalated' | 'resolved' | 'closed';
  createdBy: 'tenant' | 'landlord';
  createdAt: string;
  title: string;
  description: string;
  buildingId: string;
  unitNumber: string;
  tenantId: string;
  tenantName: string;
  landlordId: string;
  landlordName: string;
  evidence: Array<{ url: string; type: string }>;
  timeline: DisputeEvent[];
  resolution?: string;
  resolvedAt?: string;
}

interface DisputeEvent {
  id: string;
  type: 'message' | 'document_upload' | 'status_change' | 'escalation';
  actor: string;
  content: string;
  timestamp: string;
}

const DisputeResolution: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [filter, setFilter] = useState<string>('open');
  const [loading, setLoading] = useState(true);
  const [messageContent, setMessageContent] = useState('');
  const [showNewDispute, setShowNewDispute] = useState(false);

  useEffect(() => {
    const fetchDisputes = async () => {
      try {
        const response = await fetch('/api/disputes', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data = await response.json();
        setDisputes(data.disputes);
      } catch (error) {
        console.error('Error fetching disputes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDisputes();
  }, []);

  const handleAddMessage = async () => {
    if (!selectedDispute || !messageContent) return;

    try {
      const response = await fetch(`/api/disputes/${selectedDispute.id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: messageContent,
        }),
      });

      if (response.ok) {
        const newEvent: DisputeEvent = {
          id: Math.random().toString(),
          type: 'message',
          actor: 'current_user',
          content: messageContent,
          timestamp: new Date().toISOString(),
        };

        setSelectedDispute({
          ...selectedDispute,
          timeline: [...selectedDispute.timeline, newEvent],
        });

        setMessageContent('');
      }
    } catch (error) {
      console.error('Error adding message:', error);
    }
  };

  const handleEscalateDispute = async () => {
    if (!selectedDispute) return;

    try {
      const response = await fetch(`/api/disputes/${selectedDispute.id}/escalate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        setSelectedDispute({ ...selectedDispute, status: 'escalated' });
        alert(t('disputes.escalated'));
      }
    } catch (error) {
      console.error('Error escalating dispute:', error);
    }
  };

  const handleResolveDispute = async (resolution: string) => {
    if (!selectedDispute) return;

    try {
      const response = await fetch(`/api/disputes/${selectedDispute.id}/resolve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resolution }),
      });

      if (response.ok) {
        setSelectedDispute({
          ...selectedDispute,
          status: 'resolved',
          resolution,
          resolvedAt: new Date().toISOString(),
        });
        alert(t('disputes.resolved'));
      }
    } catch (error) {
      console.error('Error resolving dispute:', error);
    }
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      open: '#2196f3',
      in_discussion: '#ff9800',
      escalated: '#f44336',
      resolved: '#4caf50',
      closed: '#9e9e9e',
    };
    return colors[status] || '#999';
  };

  const filteredDisputes = disputes.filter((d) => filter === 'all' || d.status === filter);

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  return (
    <div className={`dispute-resolution ${i18n.language === 'ar' ? 'rtl' : 'ltr'}`}>
      <h1>⚖️ {t('disputes.resolutionCenter')}</h1>

      {/* Summary */}
      <div className="summary-cards">
        <div className="card">
          <label>{t('disputes.openDisputes')}</label>
          <p className="value">{disputes.filter((d) => d.status === 'open').length}</p>
        </div>
        <div className="card">
          <label>{t('disputes.inDiscussion')}</label>
          <p className="value">{disputes.filter((d) => d.status === 'in_discussion').length}</p>
        </div>
        <div className="card">
          <label>{t('disputes.escalated')}</label>
          <p className="value critical">
            {disputes.filter((d) => d.status === 'escalated').length}
          </p>
        </div>
        <div className="card">
          <label>{t('disputes.resolved')}</label>
          <p className="value green">{disputes.filter((d) => d.status === 'resolved').length}</p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="action-bar">
        <button className="btn-primary" onClick={() => setShowNewDispute(!showNewDispute)}>
          {showNewDispute ? t('common.cancel') : t('disputes.createDispute')}
        </button>
      </div>

      {/* Filters */}
      <div className="filter-buttons">
        {['all', 'open', 'in_discussion', 'escalated', 'resolved'].map((status) => (
          <button
            key={status}
            className={`filter-btn ${filter === status ? 'active' : ''}`}
            onClick={() => setFilter(status)}
          >
            {t(`disputes.status_${status}`)}
          </button>
        ))}
      </div>

      {/* Disputes List */}
      <div className="disputes-list">
        {filteredDisputes.map((dispute) => (
          <div key={dispute.id} className="dispute-card">
            <div className="card-header">
              <div className="card-title">
                <h3>{dispute.title}</h3>
                <span className="type-badge">{dispute.type}</span>
              </div>
              <span
                className="status-badge"
                style={{ backgroundColor: getStatusColor(dispute.status) }}
              >
                {t(`disputes.status_${dispute.status}`)}
              </span>
            </div>

            <div className="card-body">
              <p>{dispute.description}</p>
              <div className="parties">
                <span>👤 {dispute.tenantName}</span>
                <span>vs</span>
                <span>🏠 {dispute.landlordName}</span>
              </div>
              <small>{new Date(dispute.createdAt).toLocaleDateString(i18n.language)}</small>
            </div>

            <button
              className="btn-view"
              onClick={() => setSelectedDispute(dispute)}
            >
              {t('common.view')}
            </button>
          </div>
        ))}
      </div>

      {/* Dispute Details Modal */}
      {selectedDispute && (
        <div className="modal-overlay" onClick={() => setSelectedDispute(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedDispute.title}</h2>
              <button className="btn-close" onClick={() => setSelectedDispute(null)}>
                ✕
              </button>
            </div>

            <div className="dispute-details">
              <div className="detail-section">
                <h3>{t('disputes.parties')}</h3>
                <p>
                  <strong>{t('common.tenant')}:</strong> {selectedDispute.tenantName}
                </p>
                <p>
                  <strong>{t('common.landlord')}:</strong> {selectedDispute.landlordName}
                </p>
                <p>
                  <strong>{t('common.unit')}:</strong> {selectedDispute.unitNumber}
                </p>
              </div>

              <div className="detail-section">
                <h3>{t('disputes.timeline')}</h3>
                <div className="timeline">
                  {selectedDispute.timeline.map((event) => (
                    <div key={event.id} className="timeline-event">
                      <div className="event-marker"></div>
                      <div className="event-content">
                        <strong>{event.type}</strong>
                        <p>{event.content}</p>
                        <small>
                          {new Date(event.timestamp).toLocaleString(i18n.language)}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="detail-section">
                <h3>{t('disputes.addMessage')}</h3>
                <textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder={t('placeholder.message')}
                  rows={3}
                />
                <button className="btn-primary" onClick={handleAddMessage}>
                  {t('common.send')}
                </button>
              </div>

              {selectedDispute.status === 'open' && (
                <div className="action-buttons">
                  <button
                    className="btn-escalate"
                    onClick={handleEscalateDispute}
                  >
                    {t('disputes.escalate')}
                  </button>
                </div>
              )}

              {selectedDispute.status === 'escalated' && (
                <div className="action-buttons">
                  <button
                    className="btn-resolve"
                    onClick={() =>
                      handleResolveDispute(
                        'Dispute resolved through mediation. Decision: Landlord responsible.'
                      )
                    }
                  >
                    {t('disputes.markResolved')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisputeResolution;
