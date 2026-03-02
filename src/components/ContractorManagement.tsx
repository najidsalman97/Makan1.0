import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/ContractorManagement.css';

interface Contractor {
  id: string;
  businessName: string;
  phone: string;
  email: string;
  specialization: string[];
  rating: number;
  completedJobs: number;
  availability: 'available' | 'busy' | 'unavailable';
  bankDetails?: { accountHolder: string; accountNumber: string; iban: string };
  contractTerms?: string;
}

interface MaintenanceAssignment {
  id: string;
  requestId: string;
  contractorId: string;
  buildingId: string;
  unitNumber: string;
  description: string;
  status: 'assigned' | 'in_progress' | 'completed' | 'pending_review';
  assignedDate: string;
  completionDate?: string;
  cost: number;
  contractorPayment?: number;
  feedbackRating?: number;
}

const ContractorManagement: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [assignments, setAssignments] = useState<MaintenanceAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);
  const [filter, setFilter] = useState<string>('available');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [contractorsRes, assignmentsRes] = await Promise.all([
          fetch('/api/contractors', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          }),
          fetch('/api/maintenance/assignments', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          }),
        ]);

        const contractors = await contractorsRes.json();
        const assignments = await assignmentsRes.json();

        setContractors(contractors.contractors);
        setAssignments(assignments.assignments);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAssignMaintenance = async (
    maintenanceRequestId: string,
    contractorId: string
  ) => {
    try {
      const response = await fetch('/api/maintenance/assign', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: maintenanceRequestId,
          contractorId,
        }),
      });

      if (response.ok) {
        alert(t('contractor.assignmentCreated'));
      }
    } catch (error) {
      console.error('Error assigning maintenance:', error);
    }
  };

  const handleMarkComplete = async (assignmentId: string) => {
    try {
      const response = await fetch(`/api/maintenance/assignments/${assignmentId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        setAssignments(
          assignments.map((a) =>
            a.id === assignmentId ? { ...a, status: 'completed' } : a
          )
        );
        alert(t('contractor.jobCompleted'));
      }
    } catch (error) {
      console.error('Error marking complete:', error);
    }
  };

  const getRatingDisplay = (rating: number) => {
    return Array(5)
      .fill(0)
      .map((_, i) => (i < Math.floor(rating) ? '⭐' : '☆'))
      .join('');
  };

  const filteredContractors = contractors.filter(
    (c) => filter === 'all' || c.availability === filter
  );

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  return (
    <div className={`contractor-management ${i18n.language === 'ar' ? 'rtl' : 'ltr'}`}>
      <h1>👷 {t('haris.contractorManagement')}</h1>

      {/* Summary */}
      <div className="summary-cards">
        <div className="card">
          <label>{t('contractor.totalContractors')}</label>
          <p className="value">{contractors.length}</p>
        </div>
        <div className="card">
          <label>{t('contractor.available')}</label>
          <p className="value green">
            {contractors.filter((c) => c.availability === 'available').length}
          </p>
        </div>
        <div className="card">
          <label>{t('contractor.activeAssignments')}</label>
          <p className="value">
            {assignments.filter((a) => a.status === 'in_progress').length}
          </p>
        </div>
        <div className="card">
          <label>{t('contractor.avgRating')}</label>
          <p className="value">
            {(contractors.reduce((sum, c) => sum + c.rating, 0) / contractors.length).toFixed(1)}/5
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-buttons">
        {['all', 'available', 'busy', 'unavailable'].map((status) => (
          <button
            key={status}
            className={`filter-btn ${filter === status ? 'active' : ''}`}
            onClick={() => setFilter(status)}
          >
            {t(`contractor.status_${status}`)}
          </button>
        ))}
      </div>

      {/* Contractors List */}
      <div className="contractors-grid">
        {filteredContractors.map((contractor) => (
          <div key={contractor.id} className="contractor-card">
            <div className="card-header">
              <h3>{contractor.businessName}</h3>
              <span className="rating">{getRatingDisplay(contractor.rating)}</span>
            </div>

            <div className="card-body">
              <p>📞 {contractor.phone}</p>
              <p>📧 {contractor.email}</p>
              <p className="specialization">
                {contractor.specialization.slice(0, 2).join(', ')}
              </p>
              <p className="jobs">✓ {contractor.completedJobs} {t('common.completed')}</p>
            </div>

            <button
              className="btn-view"
              onClick={() => setSelectedContractor(contractor)}
            >
              {t('common.viewDetails')}
            </button>
          </div>
        ))}
      </div>

      {/* Contractor Details Modal */}
      {selectedContractor && (
        <div className="modal-overlay" onClick={() => setSelectedContractor(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedContractor.businessName}</h2>
              <button className="btn-close" onClick={() => setSelectedContractor(null)}>
                ✕
              </button>
            </div>

            <div className="contractor-details">
              <div className="info-section">
                <h3>{t('common.contactInfo')}</h3>
                <p><strong>{t('common.phone')}:</strong> {selectedContractor.phone}</p>
                <p><strong>{t('common.email')}:</strong> {selectedContractor.email}</p>
              </div>

              <div className="specialization-section">
                <h3>{t('contractor.specializations')}</h3>
                <div className="tags">
                  {selectedContractor.specialization.map((s, i) => (
                    <span key={i} className="tag">{s}</span>
                  ))}
                </div>
              </div>

              <div className="stats-section">
                <h3>{t('contractor.statistics')}</h3>
                <p><strong>{t('contractor.rating')}:</strong> {selectedContractor.rating}/5</p>
                <p><strong>{t('contractor.completedJobs')}:</strong> {selectedContractor.completedJobs}</p>
                <p><strong>{t('contractor.availability')}:</strong> {selectedContractor.availability}</p>
              </div>

              <h3>{t('contractor.activeAssignments')}</h3>
              <table className="assignments-table">
                <thead>
                  <tr>
                    <th>{t('common.unit')}</th>
                    <th>{t('common.description')}</th>
                    <th>{t('common.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments
                    .filter(
                      (a) =>
                        a.contractorId === selectedContractor.id &&
                        a.status !== 'completed'
                    )
                    .map((a) => (
                      <tr key={a.id}>
                        <td>{a.unitNumber}</td>
                        <td>{a.description}</td>
                        <td>{a.status}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractorManagement;
