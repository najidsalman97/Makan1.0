import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/EnhancedSuperAdmin.css';

interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  totalValue: number;
  systemHealth: number;
  uptime: number;
  avgResponseTime: number;
}

interface AuditAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: string;
  resolved: boolean;
}

interface UserActivity {
  userId: string;
  userName: string;
  role: string;
  lastLogin: string;
  activeNow: boolean;
  actions: number;
}

const EnhancedSuperAdmin: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [alerts, setAlerts] = useState<AuditAlert[]>([]);
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'users' | 'alerts' | 'settings'>('overview');

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [metricsRes, alertsRes, usersRes] = await Promise.all([
        fetch('/api/admin/metrics', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        }),
        fetch('/api/admin/alerts', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        }),
        fetch('/api/admin/user-activity', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        }),
      ]);

      const metricsData = await metricsRes.json();
      const alertsData = await alertsRes.json();
      const usersData = await usersRes.json();

      setMetrics(metricsData.metrics);
      setAlerts(alertsData.alerts);
      setUserActivity(usersData.activity);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await fetch(`/api/admin/alerts/${alertId}/resolve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });

      setAlerts(alerts.map((a) => (a.id === alertId ? { ...a, resolved: true } : a)));
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const handleUserAction = async (userId: string, action: 'suspend' | 'unlock' | 'verify') => {
    try {
      await fetch(`/api/admin/users/${userId}/${action}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });

      alert(t('admin.actionCompleted'));
      fetchDashboardData();
    } catch (error) {
      console.error('Error performing user action:', error);
    }
  };

  const handleExportReport = async (reportType: string) => {
    try {
      const response = await fetch(`/api/admin/export/${reportType}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  return (
    <div className={`enhanced-super-admin ${i18n.language === 'ar' ? 'rtl' : 'ltr'}`}>
      <h1>⚙️ {t('admin.superAdminDashboard')}</h1>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={selectedTab === 'overview' ? 'active' : ''}
          onClick={() => setSelectedTab('overview')}
        >
          {t('admin.overview')}
        </button>
        <button
          className={selectedTab === 'users' ? 'active' : ''}
          onClick={() => setSelectedTab('users')}
        >
          {t('admin.users')}
        </button>
        <button
          className={selectedTab === 'alerts' ? 'active' : ''}
          onClick={() => setSelectedTab('alerts')}
        >
          {t('admin.alerts')}
        </button>
        <button
          className={selectedTab === 'settings' ? 'active' : ''}
          onClick={() => setSelectedTab('settings')}
        >
          {t('admin.settings')}
        </button>
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && metrics && (
        <div className="overview-section">
          <div className="metrics-grid">
            <div className="metric-card">
              <h3>👥 {t('admin.totalUsers')}</h3>
              <p className="metric-value">{metrics.totalUsers}</p>
              <span className="metric-label">{metrics.activeUsers} {t('admin.active')}</span>
            </div>

            <div className="metric-card">
              <h3>💳 {t('admin.transactions')}</h3>
              <p className="metric-value">{metrics.totalTransactions}</p>
              <span className="metric-label">KWD {metrics.totalValue.toFixed(2)}</span>
            </div>

            <div className="metric-card">
              <h3>❤️ {t('admin.systemHealth')}</h3>
              <p className="metric-value">{metrics.systemHealth}%</p>
              <div
                className="health-bar"
                style={{
                  width: `${metrics.systemHealth}%`,
                  backgroundColor:
                    metrics.systemHealth > 80
                      ? '#4caf50'
                      : metrics.systemHealth > 50
                      ? '#ff9800'
                      : '#f44336',
                }}
              />
            </div>

            <div className="metric-card">
              <h3>⏱️ {t('admin.avgResponse')}</h3>
              <p className="metric-value">{metrics.avgResponseTime}ms</p>
              <span className="metric-label">{t('admin.uptime')}: {metrics.uptime}%</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions">
            <h2>{t('admin.quickActions')}</h2>
            <div className="action-buttons">
              <button onClick={() => handleExportReport('users')}>
                📊 {t('admin.exportUsers')}
              </button>
              <button onClick={() => handleExportReport('transactions')}>
                💰 {t('admin.exportTransactions')}
              </button>
              <button onClick={() => handleExportReport('audit-logs')}>
                📋 {t('admin.exportAuditLogs')}
              </button>
              <button onClick={() => window.location.href = '/admin/system-config'}>
                ⚙️ {t('admin.systemConfig')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {selectedTab === 'users' && (
        <div className="users-section">
          <h2>{t('admin.userManagement')}</h2>
          <table className="users-table">
            <thead>
              <tr>
                <th>{t('common.user')}</th>
                <th>{t('common.role')}</th>
                <th>{t('admin.lastLogin')}</th>
                <th>{t('admin.status')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {userActivity.map((user) => (
                <tr key={user.userId}>
                  <td>{user.userName}</td>
                  <td>{t(`role.${user.role}`)}</td>
                  <td>{new Date(user.lastLogin).toLocaleString(i18n.language)}</td>
                  <td>
                    <span className={`status ${user.activeNow ? 'active' : 'inactive'}`}>
                      {user.activeNow ? '🟢 ' : '🔴 '}
                      {user.activeNow ? t('admin.online') : t('admin.offline')}
                    </span>
                  </td>
                  <td>
                    <button
                      className="action-btn edit"
                      onClick={() => handleUserAction(user.userId, 'verify')}
                    >
                      ✓
                    </button>
                    <button
                      className="action-btn suspend"
                      onClick={() => handleUserAction(user.userId, 'suspend')}
                    >
                      ⊘
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Alerts Tab */}
      {selectedTab === 'alerts' && (
        <div className="alerts-section">
          <h2>{t('admin.systemAlerts')}</h2>
          <div className="alerts-list">
            {alerts
              .filter((a) => !a.resolved)
              .map((alert) => (
                <div key={alert.id} className={`alert-card severity-${alert.severity}`}>
                  <div className="alert-header">
                    <span className={`severity-badge ${alert.severity}`}>
                      {alert.severity.toUpperCase()}
                    </span>
                    <span className="timestamp">
                      {new Date(alert.timestamp).toLocaleString(i18n.language)}
                    </span>
                  </div>
                  <p className="alert-message">{alert.message}</p>
                  <button
                    className="btn-resolve"
                    onClick={() => handleResolveAlert(alert.id)}
                  >
                    {t('admin.resolve')}
                  </button>
                </div>
              ))}

            {alerts.filter((a) => !a.resolved).length === 0 && (
              <p className="no-alerts">{t('admin.noAlerts')}</p>
            )}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {selectedTab === 'settings' && (
        <div className="settings-section">
          <h2>{t('admin.systemSettings')}</h2>

          <div className="settings-form">
            <div className="setting-group">
              <label>{t('admin.maintenanceMode')}</label>
              <input type="checkbox" />
              <p>{t('admin.maintenanceModeDesc')}</p>
            </div>

            <div className="setting-group">
              <label>{t('admin.maxLoginAttempts')}</label>
              <input type="number" defaultValue="5" />
            </div>

            <div className="setting-group">
              <label>{t('admin.sessionTimeout')}</label>
              <input type="number" defaultValue="30" /> {t('admin.minutes')}
            </div>

            <div className="setting-group">
              <label>{t('admin.maxUploadSize')}</label>
              <input type="number" defaultValue="50" /> MB
            </div>

            <div className="setting-group">
              <label>{t('admin.backupFrequency')}</label>
              <select>
                <option value="hourly">{t('admin.hourly')}</option>
                <option value="daily">{t('admin.daily')}</option>
                <option value="weekly">{t('admin.weekly')}</option>
              </select>
            </div>

            <button className="btn-save">{t('common.save')}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedSuperAdmin;
