import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare, Send, Search, Users, CheckCircle2, Loader, X } from 'lucide-react';

interface LandlordCommunicationsProps {
  onClose?: () => void;
  isModal?: boolean;
}

interface Tenant {
  id: string;
  name: string;
  phone: string;
  email: string;
  unitNumber: string;
  monthsOverdue: number;
  amountDue: number;
}

export default function LandlordCommunications({ onClose, isModal = false }: LandlordCommunicationsProps) {
  const { t, i18n } = useTranslation();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [messageTemplate, setMessageTemplate] = useState('default');
  const [customMessage, setCustomMessage] = useState('');
  const [channel, setChannel] = useState<'whatsapp' | 'sms'>('whatsapp');
  const [isSending, setIsSending] = useState(false);
  const [campaignResult, setCampaignResult] = useState<any>(null);

  useEffect(() => {
    fetchDelinquentTenants();
  }, []);

  const fetchDelinquentTenants = async () => {
    try {
      const response = await fetch('/api/landlord/delinquent-tenants');
      const data = await response.json();
      setTenants(data.tenants || []);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    }
  };

  const toggleTenant = (tenantId: string) => {
    setSelectedTenants((prev) =>
      prev.includes(tenantId) ? prev.filter((id) => id !== tenantId) : [...prev, tenantId]
    );
  };

  const selectAll = () => {
    if (selectedTenants.length === filteredTenants.length) {
      setSelectedTenants([]);
    } else {
      setSelectedTenants(filteredTenants.map((t) => t.id));
    }
  };

  const sendCampaign = async () => {
    if (selectedTenants.length === 0) {
      alert('Please select at least one tenant');
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch('/api/landlord/send-bulk-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantIds: selectedTenants,
          channel,
          templateType: messageTemplate,
          customMessage: messageTemplate === 'custom' ? customMessage : undefined,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCampaignResult(data.results);
      }
    } catch (error) {
      console.error('Error sending campaign:', error);
      alert('Failed to send campaign');
    } finally {
      setIsSending(false);
    }
  };

  const filteredTenants = tenants.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.unitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.phone.includes(searchTerm)
  );

  return (
    <div className={isModal ? 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4' : 'min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6'}>
      <div className={isModal ? 'bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto' : 'w-full'}>
        <div className="max-w-7xl mx-auto" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3 mb-2">
                <MessageSquare className="w-8 h-8 text-blue-600" />
                {t('common.communications') || 'Bulk Communications'}
              </h1>
              <p className="text-slate-600">Send WhatsApp/SMS reminders with unique K-Net payment links</p>
            </div>
            {isModal && onClose && (
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Select Tenants</h2>

              <div className="mb-4">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name, unit, or phone..."
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <button
                  onClick={selectAll}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold py-2 px-3 rounded-lg text-sm transition-colors mb-3"
                >
                  {selectedTenants.length === filteredTenants.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredTenants.map((tenant) => (
                  <label
                    key={tenant.id}
                    className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTenants.includes(tenant.id)}
                      onChange={() => toggleTenant(tenant.id)}
                      className="mt-1 w-4 h-4 accent-blue-600"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm">{tenant.name}</p>
                      <p className="text-xs text-slate-600">{tenant.unitNumber}</p>
                      <p className="text-xs text-red-600 font-bold">{tenant.monthsOverdue} months overdue</p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-bold text-blue-900">{selectedTenants.length} selected</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Compose Message</h2>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-900 mb-3">Channel</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setChannel('whatsapp')}
                    className={`p-4 rounded-lg border-2 transition-all font-bold ${
                      channel === 'whatsapp'
                        ? 'border-green-500 bg-green-50 text-green-900'
                        : 'border-slate-200 bg-white text-slate-900'
                    }`}
                  >
                    💬 WhatsApp
                  </button>
                  <button
                    onClick={() => setChannel('sms')}
                    className={`p-4 rounded-lg border-2 transition-all font-bold ${
                      channel === 'sms'
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-slate-200 bg-white text-slate-900'
                    }`}
                  >
                    📱 SMS
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-900 mb-3">Message Template</label>
                <select
                  value={messageTemplate}
                  onChange={(e) => setMessageTemplate(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="default">Default Reminder</option>
                  <option value="urgent">Urgent Notice</option>
                  <option value="reminder">Friendly Reminder</option>
                  <option value="custom">Custom Message</option>
                </select>
              </div>

              <button
                onClick={sendCampaign}
                disabled={isSending || selectedTenants.length === 0}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                {isSending ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send to {selectedTenants.length} Tenant{selectedTenants.length !== 1 ? 's' : ''}
                  </>
                )}
              </button>

              {campaignResult && (
                <div className="mt-6 bg-emerald-50 rounded-lg shadow p-6 border-l-4 border-emerald-500">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    <h3 className="text-lg font-bold text-slate-900">Campaign Complete</h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-600">Total Sent</p>
                      <p className="text-2xl font-bold text-slate-900">{campaignResult.totalSent}</p>
                    </div>
                    <div className="text-center p-3 bg-emerald-50 rounded-lg">
                      <p className="text-sm text-slate-600">Successful</p>
                      <p className="text-2xl font-bold text-emerald-600">{campaignResult.successful}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
