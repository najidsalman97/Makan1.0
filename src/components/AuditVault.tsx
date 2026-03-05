import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

interface AuditVaultProps {
  landlordId: string;
  onClose: () => void;
}

export default function AuditVault({ landlordId, onClose }: AuditVaultProps) {
  const { t } = useTranslation();
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditLogs();
  }, [landlordId]);

  const fetchAuditLogs = async () => {
    try {
      const response = await fetch(`/api/audit-logs/${landlordId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      setAuditLogs(data.logs || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold">{t('common.auditVault') || 'Audit Vault'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <p className="text-center text-gray-500">{t('common.loading') || 'Loading...'}</p>
          ) : auditLogs.length > 0 ? (
            <div className="space-y-4">
              {auditLogs.map((log, index) => (
                <div key={index} className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-800">{log.action}</h4>
                      <p className="text-sm text-gray-600">{log.details}</p>
                    </div>
                    <span className="text-xs text-gray-500">{log.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">{t('common.noAuditLogs') || 'No audit logs found'}</p>
          )}
        </div>
      </div>
    </div>
  );
}
