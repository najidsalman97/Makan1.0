import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/EnhancedAuditReports.css';

interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, any>;
  ipAddress: string;
  hash: string;
}

interface ComplianceReport {
  id: string;
  reportType: 'compliance' | 'security' | 'transaction' | 'user_activity';
  period: string;
  totalRecords: number;
  violations: number;
  generatedAt: string;
  pdfUrl?: string;
}

const EnhancedAuditReports: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState<'compliance' | 'security' | 'transaction' | 'user_activity'>('compliance');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [searchAudit, setSearchAudit] = useState('');

  useEffect(() => {
    const fetchAuditData = async () => {
      try {
        const [logsRes, reportsRes] = await Promise.all([
          fetch('/api/audit/logs?limit=100', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          }),
          fetch('/api/audit/reports', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          }),
        ]);

        const logs = await logsRes.json();
        const reports = await reportsRes.json();

        setAuditLogs(logs.logs);
        setReports(reports.reports);
      } catch (error) {
        console.error('Error fetching audit data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAuditData();
  }, []);

  const handleGenerateReport = async () => {
    if (!dateRange.from || !dateRange.to) {
      alert(t('validation.selectDateRange'));
      return;
    }

    try {
      const response = await fetch('/api/audit/generate-report', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportType,
          dateFrom: dateRange.from,
          dateTo: dateRange.to,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setReports([data.report, ...reports]);
        alert(t('audit.reportGenerated'));
      }
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  const handleDownloadReport = async (reportId: string) => {
    try {
      const response = await fetch(`/api/audit/reports/${reportId}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-report-${reportId}.pdf`;
      a.click();
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  const filteredLogs = auditLogs.filter((log) =>
    log.user.toLowerCase().includes(searchAudit.toLowerCase()) ||
    log.action.toLowerCase().includes(searchAudit.toLowerCase()) ||
    log.entityId.includes(searchAudit)
  );

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  return (
    <div className={`enhanced-audit-reports ${i18n.language === 'ar' ? 'rtl' : 'ltr'}`}>
      <h1>📋 {t('audit.enhancedReports')}</h1>

      {/* Report Generator */}
      <div className="generator-section">
        <h2>{t('audit.generateReport')}</h2>
        <div className="generator-form">
          <select value={reportType} onChange={(e) => setReportType(e.target.value as any)}>
            <option value="compliance">{t('audit.type_compliance')}</option>
            <option value="security">{t('audit.type_security')}</option>
            <option value="transaction">{t('audit.type_transaction')}</option>
            <option value="user_activity">{t('audit.type_user_activity')}</option>
          </select>

          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
          />

          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
          />

          <button className="btn-primary" onClick={handleGenerateReport}>
            {t('audit.generate')}
          </button>
        </div>
      </div>

      {/* Previous Reports */}
      <div className="reports-section">
        <h2>{t('audit.previousReports')}</h2>
        <div className="reports-list">
          {reports.map((report) => (
            <div key={report.id} className="report-card">
              <div className="report-header">
                <h3>{t(`audit.type_${report.reportType}`)}</h3>
                <span className="date">{report.period}</span>
              </div>

              <div className="report-body">
                <p>📊 {report.totalRecords} {t('audit.records')}</p>
                {report.violations > 0 && (
                  <p className="violations">⚠ {report.violations} {t('audit.violations')}</p>
                )}
              </div>

              <button
                className="btn-download"
                onClick={() => handleDownloadReport(report.id)}
              >
                📥 {t('common.download')}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Logs */}
      <div className="audit-logs-section">
        <h2>{t('audit.auditLogs')}</h2>

        <input
          type="text"
          placeholder={t('placeholder.searchLogs')}
          value={searchAudit}
          onChange={(e) => setSearchAudit(e.target.value)}
          className="search-input"
        />

        <table className="audit-logs-table">
          <thead>
            <tr>
              <th>{t('common.timestamp')}</th>
              <th>{t('common.user')}</th>
              <th>{t('common.action')}</th>
              <th>{t('common.entity')}</th>
              <th>{t('common.hash')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => (
              <tr key={log.id}>
                <td>{new Date(log.timestamp).toLocaleString(i18n.language)}</td>
                <td>{log.user}</td>
                <td>{log.action}</td>
                <td>
                  {log.entityType}/{log.entityId}
                </td>
                <td className="hash">{log.hash.substring(0, 16)}...</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EnhancedAuditReports;
