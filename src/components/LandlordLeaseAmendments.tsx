import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Plus, Trash2, CheckCircle2, Loader, X } from 'lucide-react';

interface LandlordLeaseAmendmentsProps {
  onClose?: () => void;
  isModal?: boolean;
}

interface Lease {
  id: string;
  tenantName: string;
  unitNumber: string;
  rentAmount: number;
  startDate: Date;
  endDate: Date;
}

interface Amendment {
  id: string;
  leaseId: string;
  type: 'rent_increase' | 'term_extension' | 'tenant_change' | 'rules_update' | 'other';
  description: string;
  oldValue?: string | number;
  newValue?: string | number;
  effectiveDate: Date;
  status: 'draft' | 'pending' | 'signed' | 'archived';
  createDate: Date;
}

export default function LandlordLeaseAmendments({ onClose, isModal = false }: LandlordLeaseAmendmentsProps) {
  const { t, i18n } = useTranslation();
  const [leases, setLeases] = useState<Lease[]>([]);
  const [amendments, setAmendments] = useState<Amendment[]>([]);
  const [selectedLease, setSelectedLease] = useState<Lease | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'rent_increase' as Amendment['type'],
    description: '',
    oldValue: '',
    newValue: '',
    effectiveDate: new Date().toISOString().split('T')[0],
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchLeases();
    fetchAmendments();
  }, []);

  const fetchLeases = async () => {
    try {
      const response = await fetch('/api/landlord/leases');
      const data = await response.json();
      setLeases(data.leases || []);
    } catch (error) {
      console.error('Error fetching leases:', error);
    }
  };

  const fetchAmendments = async () => {
    try {
      const response = await fetch('/api/landlord/lease-amendments');
      const data = await response.json();
      setAmendments(data.amendments || []);
    } catch (error) {
      console.error('Error fetching amendments:', error);
    }
  };

  const createAmendment = async () => {
    if (!selectedLease) {
      alert('Please select a lease');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/landlord/lease-amendments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaseId: selectedLease.id,
          ...formData,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        fetchAmendments();
        setShowForm(false);
        setFormData({
          type: 'rent_increase',
          description: '',
          oldValue: '',
          newValue: '',
          effectiveDate: new Date().toISOString().split('T')[0],
        });
      }
    } catch (error) {
      console.error('Error creating amendment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getLeaseAmendments = (leaseId: string) => amendments.filter((a) => a.leaseId === leaseId);

  const typeLabels: Record<Amendment['type'], string> = {
    rent_increase: '📈 Rent Increase',
    term_extension: '📅 Term Extension',
    tenant_change: '👤 Tenant Change',
    rules_update: '📋 Rules Update',
    other: '📝 Other',
  };

  return (
    <div className={isModal ? 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4' : 'min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 p-6'}>
      <div className={isModal ? 'bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto' : 'w-full'}>
        <div className="max-w-6xl mx-auto" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3 mb-2">
                <FileText className="w-8 h-8 text-teal-600" />
                {t('common.leaseAmendments') || 'Lease Amendments'}
              </h1>
              <p className="text-slate-600">Digital addendums with e-signature & version control</p>
            </div>
            {isModal && onClose && (
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Leases</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {leases.map((lease) => (
                <button
                  key={lease.id}
                  onClick={() => setSelectedLease(lease)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedLease?.id === lease.id
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-slate-200 bg-white hover:shadow'
                  }`}
                >
                  <p className="font-bold text-slate-900">{lease.unitNumber}</p>
                  <p className="text-sm text-slate-600">{lease.tenantName}</p>
                  <p className="text-sm text-slate-500">{lease.rentAmount} KWD/month</p>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedLease ? (
              <>
                <div className="bg-gradient-to-br from-teal-100 to-cyan-100 rounded-lg p-6 mb-6 border-2 border-teal-500">
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{selectedLease.unitNumber}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-600 font-semibold">Tenant</p>
                      <p className="text-slate-900">{selectedLease.tenantName}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 font-semibold">Monthly Rent</p>
                      <p className="text-slate-900">{selectedLease.rentAmount} KWD</p>
                    </div>
                  </div>
                </div>

                {!showForm ? (
                  <button
                    onClick={() => setShowForm(true)}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors mb-6"
                  >
                    <Plus className="w-5 h-5" />
                    Create New Amendment
                  </button>
                ) : (
                  <div className="bg-white rounded-lg p-6 mb-6 border-2 border-teal-500">
                    <h4 className="text-lg font-bold text-slate-900 mb-4">New Amendment</h4>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">Amendment Type</label>
                        <select
                          value={formData.type}
                          onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                        >
                          {Object.entries(typeLabels).map(([key, label]) => (
                            <option key={key} value={key}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">Description</label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Detailed description..."
                          rows={4}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={createAmendment}
                          disabled={isLoading}
                          className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                        >
                          {isLoading ? <Loader className="w-4 h-4 animate-spin mx-auto" /> : 'Create'}
                        </button>
                        <button
                          onClick={() => setShowForm(false)}
                          className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold py-2 px-4 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <h4 className="text-lg font-bold text-slate-900 mb-3">Amendments History</h4>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {getLeaseAmendments(selectedLease.id).length === 0 ? (
                    <div className="bg-slate-50 rounded-lg p-8 text-center border border-slate-200">
                      <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-600">No amendments for this lease</p>
                    </div>
                  ) : (
                    getLeaseAmendments(selectedLease.id).map((amendment) => (
                      <div key={amendment.id} className="bg-white rounded-lg p-4 border border-slate-200">
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-bold text-slate-900">{typeLabels[amendment.type]}</p>
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            {amendment.status}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700">{amendment.description}</p>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="bg-slate-50 rounded-lg p-12 text-center border border-slate-200">
                <p className="text-slate-600 font-semibold">Select a lease to view amendments</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
