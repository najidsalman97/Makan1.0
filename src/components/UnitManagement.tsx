import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/UnitManagement.css';

interface Unit {
  id: string;
  buildingId: string;
  unitNumber: string;
  type: 'studio' | '1bed' | '2bed' | '3bed' | '4bed';
  area: number;
  monthlyRent: number;
  features: string[];
  photos: Array<{ url: string; type: 'interior' | 'exterior' | 'other' }>;
  currentTenant?: { id: string; name: string; leaseEnd: string };
  maintenanceHistory: Array<{ date: string; description: string; cost: number }>;
  occupancyStatus: 'occupied' | 'vacant' | 'maintenance';
  floorPlan?: string;
  amenities: string[];
  restrictions: string[];
}

const UnitManagement: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const response = await fetch('/api/units', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data = await response.json();
        setUnits(data.units);
      } catch (error) {
        console.error('Error fetching units:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUnits();
  }, []);

  const filteredUnits = units.filter((u) => filter === 'all' || u.occupancyStatus === filter);

  const getStatusIcon = (status: string): string => {
    const icons: Record<string, string> = {
      occupied: '✓',
      vacant: '⊘',
      maintenance: '⚙',
    };
    return icons[status] || '?';
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      occupied: '#4caf50',
      vacant: '#2196f3',
      maintenance: '#ff9800',
    };
    return colors[status] || '#999';
  };

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  return (
    <div className={`unit-management ${i18n.language === 'ar' ? 'rtl' : 'ltr'}`}>
      <h1>🏢 {t('landlord.unitManagement')}</h1>

      {/* Summary */}
      <div className="summary-cards">
        <div className="card">
          <label>{t('common.totalUnits')}</label>
          <p className="value">{units.length}</p>
        </div>
        <div className="card">
          <label>{t('common.occupied')}</label>
          <p className="value" style={{ color: '#4caf50' }}>
            {units.filter((u) => u.occupancyStatus === 'occupied').length}
          </p>
        </div>
        <div className="card">
          <label>{t('common.vacant')}</label>
          <p className="value" style={{ color: '#2196f3' }}>
            {units.filter((u) => u.occupancyStatus === 'vacant').length}
          </p>
        </div>
        <div className="card">
          <label>{t('common.maintenance')}</label>
          <p className="value" style={{ color: '#ff9800' }}>
            {units.filter((u) => u.occupancyStatus === 'maintenance').length}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="controls">
        <button className="btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? t('common.cancel') : t('unit.addNewUnit')}
        </button>
        <div className="filter-buttons">
          {['all', 'occupied', 'vacant', 'maintenance'].map((status) => (
            <button
              key={status}
              className={`filter-btn ${filter === status ? 'active' : ''}`}
              onClick={() => setFilter(status)}
            >
              {t(`unit.status_${status}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Units Grid */}
      <div className="units-grid">
        {filteredUnits.map((unit) => (
          <div key={unit.id} className="unit-card">
            <div className="unit-header">
              <h3>{unit.unitNumber}</h3>
              <span
                className="status-badge"
                style={{ backgroundColor: getStatusColor(unit.occupancyStatus) }}
              >
                {getStatusIcon(unit.occupancyStatus)}
              </span>
            </div>

            <div className="unit-body">
              <p className="type">{unit.type.toUpperCase()}</p>
              <p>
                <strong>{unit.area}m²</strong> | <strong>{unit.monthlyRent} KWD</strong>
              </p>

              {unit.currentTenant && (
                <p className="tenant">
                  👤 {unit.currentTenant.name}
                  <br />
                  <small>
                    {t('common.until')}{' '}
                    {new Date(unit.currentTenant.leaseEnd).toLocaleDateString(i18n.language)}
                  </small>
                </p>
              )}

              <div className="amenities">
                {unit.amenities.slice(0, 2).map((a, i) => (
                  <span key={i} className="tag">
                    {a}
                  </span>
                ))}
              </div>
            </div>

            <button
              className="btn-view"
              onClick={() => setSelectedUnit(unit)}
            >
              {t('common.viewDetails')}
            </button>
          </div>
        ))}
      </div>

      {/* Details Modal */}
      {selectedUnit && (
        <div className="modal-overlay" onClick={() => setSelectedUnit(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('common.unit')} {selectedUnit.unitNumber}</h2>
              <button className="btn-close" onClick={() => setSelectedUnit(null)}>
                ✕
              </button>
            </div>

            <div className="tabs">
              <h3>{t('common.details')}</h3>
              <div className="details-grid">
                <div>
                  <label>{t('common.type')}:</label>
                  <p>{selectedUnit.type}</p>
                </div>
                <div>
                  <label>{t('common.area')}:</label>
                  <p>{selectedUnit.area}m²</p>
                </div>
                <div>
                  <label>{t('common.monthlyRent')}:</label>
                  <p>{selectedUnit.monthlyRent} KWD</p>
                </div>
                <div>
                  <label>{t('common.status')}:</label>
                  <p>{selectedUnit.occupancyStatus}</p>
                </div>
              </div>

              <h3>{t('common.amenities')}</h3>
              <div className="amenities-list">
                {selectedUnit.amenities.map((a, i) => (
                  <span key={i} className="tag">
                    {a}
                  </span>
                ))}
              </div>

              <h3>{t('common.restrictions')}</h3>
              <ul>
                {selectedUnit.restrictions.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>

              <h3>{t('common.maintenanceHistory')}</h3>
              <table className="history-table">
                <thead>
                  <tr>
                    <th>{t('common.date')}</th>
                    <th>{t('common.description')}</th>
                    <th>{t('common.cost')}</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedUnit.maintenanceHistory.map((m, i) => (
                    <tr key={i}>
                      <td>{new Date(m.date).toLocaleDateString(i18n.language)}</td>
                      <td>{m.description}</td>
                      <td>{m.cost} KWD</td>
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

export default UnitManagement;
