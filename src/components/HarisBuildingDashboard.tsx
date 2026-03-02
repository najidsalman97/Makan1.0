import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/HarisBuildingDashboard.css';

interface Building {
  id: string;
  name: string;
  address: string;
  units: number;
  rentStatus: 'green' | 'yellow' | 'red';
  rentStatusLabel: string;
  delinquentUnits: number;
  maintenanceTickets: number;
  avgRentPerUnit: number;
  occupancyRate: number;
  lastUpdated: string;
}

interface DashboardMetrics {
  totalBuildings: number;
  totalUnits: number;
  criticalAlerts: number;
  pendingMaintenance: number;
  occupancyAverage: number;
}

const HarisBuildingDashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'red' | 'yellow' | 'green'>('all');

  useEffect(() => {
    const fetchBuildingData = async () => {
      try {
        const response = await fetch('/api/haris/buildings', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Accept-Language': i18n.language,
          },
        });
        const data = await response.json();
        setBuildings(data.buildings);
        setMetrics(data.metrics);
      } catch (error) {
        console.error('Error fetching building data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBuildingData();
  }, [i18n.language]);

  const getStatusColor = (status: 'green' | 'yellow' | 'red'): string => {
    const colors: Record<string, string> = {
      green: '#4caf50',
      yellow: '#ff9800',
      red: '#f44336',
    };
    return colors[status];
  };

  const getStatusIcon = (status: 'green' | 'yellow' | 'red'): string => {
    const icons: Record<string, string> = {
      green: '✓',
      yellow: '⚠',
      red: '✕',
    };
    return icons[status];
  };

  const filteredBuildings = buildings.filter(
    (b) => filter === 'all' || b.rentStatus === filter
  );

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  return (
    <div className={`haris-dashboard ${i18n.language === 'ar' ? 'rtl' : 'ltr'}`}>
      <h1>{t('haris.buildingHealthDashboard')}</h1>

      {/* Metrics Summary */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">{t('haris.totalBuildings')}</div>
          <div className="metric-value">{metrics?.totalBuildings || 0}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">{t('haris.totalUnits')}</div>
          <div className="metric-value">{metrics?.totalUnits || 0}</div>
        </div>
        <div className="metric-card critical">
          <div className="metric-label">{t('haris.criticalAlerts')}</div>
          <div className="metric-value">{metrics?.criticalAlerts || 0}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">{t('haris.pendingMaintenance')}</div>
          <div className="metric-value">{metrics?.pendingMaintenance || 0}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">{t('haris.avgOccupancy')}</div>
          <div className="metric-value">{metrics?.occupancyAverage.toFixed(1)}%</div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="filter-section">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          {t('common.all')}
        </button>
        <button
          className={`filter-btn ${filter === 'green' ? 'active' : ''}`}
          onClick={() => setFilter('green')}
          style={{ borderColor: getStatusColor('green') }}
        >
          ✓ {t('haris.good')}
        </button>
        <button
          className={`filter-btn ${filter === 'yellow' ? 'active' : ''}`}
          onClick={() => setFilter('yellow')}
          style={{ borderColor: getStatusColor('yellow') }}
        >
          ⚠ {t('haris.caution')}
        </button>
        <button
          className={`filter-btn ${filter === 'red' ? 'active' : ''}`}
          onClick={() => setFilter('red')}
          style={{ borderColor: getStatusColor('red') }}
        >
          ✕ {t('haris.critical')}
        </button>
      </div>

      {/* Buildings List */}
      <div className="buildings-list">
        {filteredBuildings.map((building) => (
          <div key={building.id} className="building-card">
            <div className="building-header">
              <div className="status-indicator" style={{ backgroundColor: getStatusColor(building.rentStatus) }}>
                {getStatusIcon(building.rentStatus)}
              </div>
              <div className="building-info">
                <h3>{building.name}</h3>
                <p className="address">{building.address}</p>
              </div>
              <div className="building-stats">
                <div className="stat">
                  <span className="label">{t('common.units')}:</span>
                  <span className="value">{building.units}</span>
                </div>
                <div className="stat">
                  <span className="label">{t('haris.occupancy')}:</span>
                  <span className="value">{building.occupancyRate}%</span>
                </div>
              </div>
            </div>

            <div className="building-details">
              <div className="detail-item">
                <label>{t('haris.rentStatus')}:</label>
                <span>{building.rentStatusLabel}</span>
              </div>
              <div className="detail-item">
                <label>{t('haris.delinquentUnits')}:</label>
                <span className={building.delinquentUnits > 0 ? 'alert' : ''}>
                  {building.delinquentUnits}
                </span>
              </div>
              <div className="detail-item">
                <label>{t('haris.maintenanceTickets')}:</label>
                <span>{building.maintenanceTickets}</span>
              </div>
              <div className="detail-item">
                <label>{t('common.avgRent')}:</label>
                <span>{building.avgRentPerUnit.toFixed(2)} KWD</span>
              </div>
            </div>

            <button className="btn-details">
              {t('common.viewDetails')}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HarisBuildingDashboard;
