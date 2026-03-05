import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Download, Zap, Mail, AlertTriangle, X } from 'lucide-react';

interface LandlordJudicialBundleProps {
  onClose?: () => void;
  isModal?: boolean;
}

interface DelinquentLease {
  id: string;
  unitNumber: string;
  tenantName: string;
  tenantEmail: string;
  monthsOverdue: number;
  totalArrears: number;
  lastPaymentDate: Date;
}

export default function LandlordJudicialBundle({ onClose, isModal = false }: LandlordJudicialBundleProps) {
  const { t, i18n } = useTranslation();
  const [bundles, setBundles] = useState<any[]>([]);
  const [delinquent, setDelinquent] = useState<DelinquentLease[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [bundleStatus, setBundleStatus] = useState<'idle' | 'generating' | 'ready' | 'error'>('idle');

  useEffect(() => {
    fetchDelinquentLeases();
  }, []);

  const fetchDelinquentLeases = async () => {
    try {
      const response = await fetch('/api/landlord/delinquent-leases');
      const data = await response.json();
      setDelinquent(data.delinquent || []);
    } catch (error) {
      console.error('Error fetching delinquent leases:', error);
    }
  };

  const generateJudicialBundle = async () => {
    setIsGenerating(true);
    setBundleStatus('generating');

    try {
      const response = await fetch('/api/landlord/generate-judicial-bundle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaseIds: delinquent.map((d) => d.id),
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setBundles((prev) => [data, ...prev]);
        setBundleStatus('ready');
      }
    } catch (error) {
      console.error('Error generating bundle:', error);
      setBundleStatus('error');
    } finally {
      setIsGenerating(false);
    }
  };

  const totalArrears = delinquent.reduce((sum, d) => sum + d.totalArrears, 0);

  return (
    <div className={isModal ? 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4' : 'min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-6'}>
      <div className={isModal ? 'bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto' : 'w-full'}>
        <div className="max-w-6xl mx-auto" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3 mb-2">
                <FileText className="w-8 h-8 text-red-600" />
                {t('common.judicialBundle') || 'Judicial Bundle Generator'}
              </h1>
              <p className="text-slate-600">One-click eviction package for law enforcement</p>
            </div>
            {isModal && onClose && (
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            )}
          </div>

          <div className="bg-red-100 border-2 border-red-300 rounded-lg p-4 mb-6">
          <div className="flex gap-2 items-start">
            <AlertTriangle className="w-6 h-6 text-red-600 mt-1 flex-shrink-0" />
            <div>
              <p className="font-bold text-red-900">Law 10/2026 Compliance</p>
              <p className="text-sm text-red-800">
                This bundle is legally binding. Ensure all documents are accurate before proceeding.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Delinquent Leases ({delinquent.length})</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-600">
              <p className="text-sm text-slate-600 uppercase font-semibold">Delinquent Units</p>
              <p className="text-3xl font-bold text-red-600">{delinquent.length}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 border-l-4 border-orange-600">
              <p className="text-sm text-slate-600 uppercase font-semibold">Avg Months Overdue</p>
              <p className="text-3xl font-bold text-orange-600">
                {(delinquent.reduce((sum, d) => sum + d.monthsOverdue, 0) / delinquent.length || 0).toFixed(1)}
              </p>
            </div>
            <div className="bg-red-100 rounded-lg p-4 border-l-4 border-red-800">
              <p className="text-sm text-slate-600 uppercase font-semibold">Total Arrears</p>
              <p className="text-3xl font-bold text-red-800">{totalArrears.toLocaleString()} KWD</p>
            </div>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto">
            {delinquent.map((lease) => (
              <div key={lease.id} className="border-2 border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-slate-900">{lease.unitNumber}</p>
                    <p className="text-sm text-slate-600">{lease.tenantName}</p>
                  </div>
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-bold">
                    {lease.monthsOverdue} months overdue
                  </span>
                </div>
                <p className="text-sm">Arrears: {lease.totalArrears} KWD</p>
              </div>
            ))}
          </div>
        </div>

        {delinquent.length > 0 && (
          <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-lg shadow-lg p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">Ready to proceed?</h3>
            <button
              onClick={generateJudicialBundle}
              disabled={isGenerating}
              className="w-full bg-white text-red-600 font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-100 disabled:opacity-50 transition-all"
            >
              <Zap className="w-5 h-5" />
              {isGenerating ? 'Generating Bundle...' : 'Generate Judicial Bundle'}
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
  );
}
