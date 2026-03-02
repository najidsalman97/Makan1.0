import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/TenantProfileManagement.css';

interface TenantProfile {
  id: string;
  civilId: string;
  name: string;
  phone: string;
  email: string;
  nationality: string;
  employmentStatus: 'employed' | 'self_employed' | 'student' | 'unemployed';
  employer?: string;
  leases: Array<{ leaseId: string; unitNumber: string; startDate: string; endDate: string }>;
  paymentHistory: Array<{ date: string; amount: number; status: 'paid' | 'late' | 'missed' }>;
  rating: number;
  maintenanceComplaints: number;
  documents: Array<{ type: string; url: string; uploadedAt: string }>;
  communicationHistory: Array<{ date: string; type: string; content: string }>;
  createdAt: string;
}

const TenantProfileManagement: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [tenants, setTenants] = useState<TenantProfile[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<TenantProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'recent'>('name');

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const response = await fetch('/api/tenants/profiles', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data = await response.json();
        setTenants(data.tenants);
      } catch (error) {
        console.error('Error fetching tenants:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTenants();
  }, []);

  const filteredTenants = tenants
    .filter((t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.phone.includes(searchTerm) ||
      t.civilId.includes(searchTerm)
    )
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'rating') return b.rating - a.rating;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const getRatingDisplay = (rating: number) => {
    const stars = Array(5)
      .fill(0)
      .map((_, i) => (i < Math.floor(rating) ? '⭐' : '☆'));
    return stars.join('');
  };

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  return (
    <div className={`tenant-profile-management ${i18n.language === 'ar' ? 'rtl' : 'ltr'}`}>
      <h1>👥 {t('landlord.tenantProfiles')}</h1>

      {/* Search & Sort */}
      <div className="controls">
        <input
          type="text"
          placeholder={t('placeholder.searchTenant')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
          <option value="name">{t('common.sortByName')}</option>
          <option value="rating">{t('common.sortByRating')}</option>
          <option value="recent">{t('common.sortByRecent')}</option>
        </select>
      </div>

      {/* Tenants Grid */}
      <div className="tenants-grid">
        {filteredTenants.map((tenant) => (
          <div key={tenant.id} className="tenant-card">
            <div className="card-header">
              <h3>{tenant.name}</h3>
              <button
                className="btn-expand"
                onClick={() => setSelectedTenant(tenant)}
              >
                →
              </button>
            </div>

            <div className="card-body">
              <p className="phone">📞 {tenant.phone}</p>
              <p className="rating">
                {getRatingDisplay(tenant.rating)} ({tenant.rating}/5)
              </p>
              <p className="status">
                {tenant.employmentStatus === 'employed' ? '✓ Employed' : tenant.employmentStatus}
              </p>
              <p className="complaints">
                ⚠️ {tenant.maintenanceComplaints} {t('common.complaints')}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Tenant Details Modal */}
      {selectedTenant && (
        <div className="modal-overlay" onClick={() => setSelectedTenant(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedTenant.name}</h2>
              <button className="btn-close" onClick={() => setSelectedTenant(null)}>
                ✕
              </button>
            </div>

            <div className="tabs">
              <div className="tab-content">
                <h3>{t('common.personalInfo')}</h3>
                <div className="info-grid">
                  <div>
                    <label>{t('common.civilId')}:</label>
                    <p>{selectedTenant.civilId}</p>
                  </div>
                  <div>
                    <label>{t('common.email')}:</label>
                    <p>{selectedTenant.email}</p>
                  </div>
                  <div>
                    <label>{t('common.nationality')}:</label>
                    <p>{selectedTenant.nationality}</p>
                  </div>
                  <div>
                    <label>{t('common.employment')}:</label>
                    <p>{selectedTenant.employmentStatus}</p>
                  </div>
                </div>

                <h3>{t('common.rating')}</h3>
                <p className="rating-display">
                  {getRatingDisplay(selectedTenant.rating)} {selectedTenant.rating}/5
                </p>

                <h3>{t('common.leaseHistory')}</h3>
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>{t('common.unit')}</th>
                      <th>{t('common.startDate')}</th>
                      <th>{t('common.endDate')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTenant.leases.map((lease, i) => (
                      <tr key={i}>
                        <td>{lease.unitNumber}</td>
                        <td>
                          {new Date(lease.startDate).toLocaleDateString(i18n.language)}
                        </td>
                        <td>
                          {new Date(lease.endDate).toLocaleDateString(i18n.language)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <h3>{t('common.paymentHistory')}</h3>
                <div className="payment-summary">
                  {selectedTenant.paymentHistory.slice(0, 5).map((payment, i) => (
                    <div key={i} className={`payment-entry ${payment.status}`}>
                      <span>
                        {new Date(payment.date).toLocaleDateString(i18n.language)}
                      </span>
                      <span>{payment.amount} KWD</span>
                      <span className="status">{payment.status}</span>
                    </div>
                  ))}
                </div>

                <h3>{t('common.documents')}</h3>
                <div className="documents-list">
                  {selectedTenant.documents.map((doc, i) => (
                    <div key={i} className="document-item">
                      <a href={doc.url} target="_blank" rel="noopener noreferrer">
                        📄 {doc.type}
                      </a>
                      <small>{new Date(doc.uploadedAt).toLocaleDateString(i18n.language)}</small>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantProfileManagement;
