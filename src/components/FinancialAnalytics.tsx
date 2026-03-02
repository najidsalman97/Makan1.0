import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/FinancialAnalytics.css';

interface FinancialMetrics {
  totalRent: number;
  totalCollected: number;
  outstandingDebt: number;
  occupancyRate: number;
  delinquencyRate: number;
  avgRentPerUnit: number;
  managementFeesCollected: number;
}

interface MonthlyTrend {
  month: string;
  collected: number;
  outstanding: number;
}

interface Building {
  id: string;
  name: string;
  totalRent: number;
  collected: number;
  occupancyRate: number;
  delinquentUnits: number;
}

const FinancialAnalytics: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [trends, setTrends] = useState<MonthlyTrend[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch(`/api/landlord/analytics?period=${period}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Accept-Language': i18n.language,
          },
        });
        const data = await response.json();
        setMetrics(data.metrics);
        setTrends(data.trends);
        setBuildings(data.buildings);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [period, i18n.language]);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat(i18n.language === 'ar' ? 'ar-KW' : 'en-KW', {
      style: 'currency',
      currency: 'KWD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const getCollectionRate = (collected: number, total: number): string => {
    return total > 0 ? ((collected / total) * 100).toFixed(1) : '0';
  };

  const getDelinquencyColor = (rate: number): string => {
    if (rate < 5) return '#4caf50';
    if (rate < 15) return '#ff9800';
    return '#f44336';
  };

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  return (
    <div className={`financial-analytics ${i18n.language === 'ar' ? 'rtl' : 'ltr'}`}>
      <h1>{t('landlord.financialAnalytics')}</h1>

      {/* Period Selector */}
      <div className="period-selector">
        <button
          className={`period-btn ${period === 'month' ? 'active' : ''}`}
          onClick={() => setPeriod('month')}
        >
          {t('analytics.monthly')}
        </button>
        <button
          className={`period-btn ${period === 'quarter' ? 'active' : ''}`}
          onClick={() => setPeriod('quarter')}
        >
          {t('analytics.quarterly')}
        </button>
        <button
          className={`period-btn ${period === 'year' ? 'active' : ''}`}
          onClick={() => setPeriod('year')}
        >
          {t('analytics.yearly')}
        </button>
      </div>

      {/* Key Metrics */}
      {metrics && (
        <div className="metrics-grid">
          <div className="metric-card">
            <h3>{t('analytics.totalRent')}</h3>
            <p className="value">{formatCurrency(metrics.totalRent)}</p>
          </div>

          <div className="metric-card highlight">
            <h3>{t('analytics.totalCollected')}</h3>
            <p className="value" style={{ color: '#4caf50' }}>
              {formatCurrency(metrics.totalCollected)}
            </p>
            <p className="subtext">
              {getCollectionRate(metrics.totalCollected, metrics.totalRent)}%
            </p>
          </div>

          <div className="metric-card alert">
            <h3>{t('analytics.outstanding')}</h3>
            <p className="value" style={{ color: '#f44336' }}>
              {formatCurrency(metrics.outstandingDebt)}
            </p>
          </div>

          <div className="metric-card">
            <h3>{t('analytics.occupancyRate')}</h3>
            <p className="value">{metrics.occupancyRate.toFixed(1)}%</p>
          </div>

          <div className="metric-card">
            <h3>{t('analytics.delinquencyRate')}</h3>
            <p
              className="value"
              style={{ color: getDelinquencyColor(metrics.delinquencyRate) }}
            >
              {metrics.delinquencyRate.toFixed(1)}%
            </p>
          </div>

          <div className="metric-card">
            <h3>{t('analytics.managementFees')}</h3>
            <p className="value">{formatCurrency(metrics.managementFeesCollected)}</p>
          </div>

          <div className="metric-card">
            <h3>{t('analytics.avgRent')}</h3>
            <p className="value">{formatCurrency(metrics.avgRentPerUnit)}</p>
          </div>
        </div>
      )}

      {/* Monthly Trends Chart */}
      <div className="section">
        <h2>{t('analytics.collectionTrends')}</h2>
        <div className="trends-table">
          <table>
            <thead>
              <tr>
                <th>{t('analytics.month')}</th>
                <th>{t('analytics.collected')}</th>
                <th>{t('analytics.outstanding')}</th>
                <th>{t('analytics.rate')}</th>
              </tr>
            </thead>
            <tbody>
              {trends.map((trend) => (
                <tr key={trend.month}>
                  <td>{trend.month}</td>
                  <td>{formatCurrency(trend.collected)}</td>
                  <td>{formatCurrency(trend.outstanding)}</td>
                  <td>
                    {(
                      (trend.collected / (trend.collected + trend.outstanding)) *
                      100
                    ).toFixed(1)}
                    %
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Building Performance */}
      <div className="section">
        <h2>{t('analytics.buildingPerformance')}</h2>
        <div className="buildings-performance">
          {buildings.map((building) => (
            <div key={building.id} className="building-perf-card">
              <div className="building-header">
                <h3>{building.name}</h3>
                <span className="occupancy">
                  {building.occupancyRate}% {t('analytics.occupied')}
                </span>
              </div>

              <div className="performance-details">
                <div className="detail">
                  <span className="label">{t('analytics.totalRent')}:</span>
                  <span className="value">{formatCurrency(building.totalRent)}</span>
                </div>

                <div className="detail">
                  <span className="label">{t('analytics.collected')}:</span>
                  <span className="value green">
                    {formatCurrency(building.collected)}
                  </span>
                </div>

                <div className="detail">
                  <span className="label">{t('analytics.delinquent')}:</span>
                  <span className="value red">{building.delinquentUnits} {t('common.units')}</span>
                </div>

                <div className="collection-rate">
                  <div className="rate-label">
                    {t('analytics.collectionRate')}:
                    <span className="percentage">
                      {getCollectionRate(building.collected, building.totalRent)}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${getCollectionRate(building.collected, building.totalRent)}%`,
                        backgroundColor:
                          building.delinquentUnits === 0 ? '#4caf50' : '#ff9800',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FinancialAnalytics;
