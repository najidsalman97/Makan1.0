import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { format, differenceInDays } from 'date-fns';
import { 
  Building2, 
  LogOut, 
  Fingerprint, 
  ShieldCheck, 
  FileSignature, 
  Download, 
  Wrench,
  AlertTriangle,
  CheckCircle2,
  XCircle
} from 'lucide-react';

export default function TenantDashboard() {
  const [data, setData] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('all');
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.role !== 'tenant') {
      navigate('/');
      return;
    }
    setUser(parsedUser);

    fetch(`/api/tenant/${parsedUser.id}/dashboard`)
      .then(res => res.json())
      .then(resData => {
        if (resData.success) {
          setData(resData.data);
        }
      });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleWithdraw = async () => {
    if (window.confirm(t('withdraw_confirm'))) {
      try {
        const res = await fetch(`/api/tenant/${user.id}/withdraw`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ leaseId: data.lease.id })
        });
        const resData = await res.json();
        if (resData.success) {
          alert(t('withdraw_success'));
          setData({ ...data, lease: { ...data.lease, intentToWithdraw: true } });
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleResponsibility = async (ticketId: number, action: 'accepted' | 'disputed') => {
    try {
      const res = await fetch(`/api/tenant/${user.id}/maintenance/${ticketId}/responsibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const resData = await res.json();
      if (resData.success) {
        setData({
          ...data,
          maintenance: data.maintenance.map((t: any) => 
            t.id === ticketId ? { ...t, tenantResponsibility: action } : t
          )
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!data || !user) return <div className="min-h-screen bg-zinc-50 flex items-center justify-center">Loading...</div>;

  const isWithin14Days = data.lease && differenceInDays(new Date(), new Date(data.lease.startDate)) <= 14;
  const showWithdrawButton = isWithin14Days && !data.lease.intentToWithdraw;

  const filteredPayments = selectedMonth === 'all' 
    ? data.payments 
    : data.payments.filter((p: any) => format(new Date(p.dueDate), 'yyyy-MM') === selectedMonth);

  const uniqueMonths = Array.from(new Set(data.payments.map((p: any) => format(new Date(p.dueDate), 'yyyy-MM'))));

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-900 rounded-xl flex items-center justify-center shadow-sm">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-blue-900">{t('makan')}</h1>
              <p className="text-xs text-zinc-500 font-medium">{t('tenant_portal')}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleLogout}
              className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Biometrics Toggle */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Fingerprint className="w-5 h-5 text-blue-900" />
            <span className="text-sm font-medium">{t('enable_biometrics')}</span>
          </div>
          <button 
            onClick={() => setBiometricsEnabled(!biometricsEnabled)}
            className={`w-11 h-6 rounded-full transition-colors relative ${biometricsEnabled ? 'bg-blue-900' : 'bg-zinc-200'}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${biometricsEnabled ? (i18n.language === 'ar' ? '-translate-x-6' : 'translate-x-6') : (i18n.language === 'ar' ? '-translate-x-1' : 'translate-x-1')}`} />
          </button>
        </div>

        {/* 14-Day Right Component */}
        {showWithdrawButton && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3 text-amber-800">
              <AlertTriangle className="w-6 h-6" />
              <span className="text-sm font-medium">Law 10/2026: 14-Day Cooling Off Period Active</span>
            </div>
            <button 
              onClick={handleWithdraw}
              className="w-full sm:w-auto px-4 py-2 bg-amber-600 text-white text-sm font-bold rounded-xl shadow-sm hover:bg-amber-700 transition-colors"
            >
              {t('statutory_withdrawal')}
            </button>
          </motion.div>
        )}

        {/* Digital Signature Verification */}
        {data.lease && (
          <div className="bg-white rounded-3xl shadow-sm border border-zinc-200 overflow-hidden">
            <div className="p-6 border-b border-zinc-100 bg-blue-900 text-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-yellow-400" />
                <h2 className="text-lg font-bold">{t('digital_lease')}</h2>
              </div>
              <button 
                onClick={() => {
                  const errorMsg = window.prompt("Describe the error in your contract (e.g., misspelled name, wrong Civil ID):");
                  if (errorMsg) {
                    fetch(`/api/tenant/${user.id}/correct-contract-error`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ leaseId: data.lease.id, errorDescription: errorMsg })
                    }).then(res => res.json()).then(resData => {
                      if(resData.success) alert("Error correction request sent to landlord.");
                    });
                  }
                }}
                className="text-xs font-bold bg-white text-blue-900 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Correct Contract Error
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-zinc-500">{t('lease_hash')}</p>
                  <p className="font-mono text-xs mt-1 text-zinc-700 bg-zinc-100 p-2 rounded-lg break-all">
                    {data.lease.leaseHash || 'Pending PACI Verification'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-zinc-500">{t('signed_on')}</p>
                  <p className="font-medium text-zinc-900">
                    {format(new Date(data.lease.startDate), 'PPP')}
                  </p>
                </div>
              </div>
              <button className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-blue-900 hover:bg-zinc-100 transition-colors">
                <FileSignature className="w-4 h-4" />
                {t('verify_signature')}
              </button>
            </div>
          </div>
        )}

        {/* Seller Identity (MOCI Compliance) */}
        {data.lease && data.lease.landlord && (
          <div className="bg-white rounded-3xl shadow-sm border border-zinc-200 overflow-hidden">
            <div className="p-6 border-b border-zinc-100 bg-zinc-50 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-zinc-900">Seller Identity</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-zinc-500">Trade Name</p>
                  <p className="font-bold text-zinc-900">{data.lease.landlord.name}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500">MOCI License Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    {data.lease.landlord.mociLicenseVerified ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-4 h-4" /> MOCI Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                        <AlertTriangle className="w-4 h-4" /> Pending Verification
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <a 
                href="https://moci.gov.kw/en/services/consumer-protection/" 
                target="_blank" 
                rel="noreferrer"
                className="block w-full text-center text-sm font-bold text-blue-600 bg-blue-50 py-3 rounded-xl hover:bg-blue-100 transition-colors"
              >
                Report a Violation to MOCI Digital Committee
              </a>
            </div>
          </div>
        )}

        {/* Bilingual Receipt Engine */}
        <div className="bg-white rounded-3xl shadow-sm border border-zinc-200 overflow-hidden">
          <div className="p-6 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-zinc-900">{t('payment_history')}</h2>
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-zinc-50 border border-zinc-200 text-zinc-900 text-sm rounded-xl focus:ring-blue-900 focus:border-blue-900 block p-2.5"
            >
              <option value="all">{t('all_months')}</option>
              {uniqueMonths.map(m => (
                <option key={m as string} value={m as string}>{m as string}</option>
              ))}
            </select>
          </div>
          
          <div className="p-6">
            {data.payments.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-12 h-12 text-blue-900" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 mb-2">{t('welcome_makan')}</h3>
                <p className="text-zinc-500">{t('no_payments')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPayments.map((payment: any) => (
                  <div key={payment.id} className="border border-zinc-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-50/50">
                    <div>
                      <p className="font-bold text-zinc-900">{format(new Date(payment.dueDate), 'MMMM yyyy')}</p>
                      <div className="mt-2 space-y-1 text-sm text-zinc-600">
                        <div className="flex justify-between gap-8">
                          <span>{t('monthly_rent')}</span>
                          <span className="font-mono">{payment.amount.toFixed(3)} {t('kwd')}</span>
                        </div>
                        <div className="flex justify-between gap-8">
                          <span>{t('management_fee')}</span>
                          <span className="font-mono">{payment.managementFee.toFixed(3)} {t('kwd')}</span>
                        </div>
                        <div className="flex justify-between gap-8 pt-2 border-t border-zinc-200 font-bold text-zinc-900">
                          <span>{t('total')}</span>
                          <span className="font-mono">{(payment.amount + payment.managementFee).toFixed(3)} {t('kwd')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold ${
                        payment.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {payment.status.toUpperCase()}
                      </span>
                      {payment.status === 'paid' && (
                        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-900 text-white text-xs font-bold rounded-xl hover:bg-blue-800 transition-colors">
                          <Download className="w-4 h-4" />
                          {t('download_receipt')}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tenant Maintenance View */}
        <div className="bg-white rounded-3xl shadow-sm border border-zinc-200 overflow-hidden">
          <div className="p-6 border-b border-zinc-100">
            <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-zinc-400" />
              {t('maintenance_tickets')}
            </h2>
          </div>
          <div className="p-6">
            {data.maintenance.length === 0 ? (
              <p className="text-zinc-500 text-center py-4">No maintenance tickets found.</p>
            ) : (
              <div className="space-y-4">
                {data.maintenance.map((ticket: any) => (
                  <div key={ticket.id} className="border border-zinc-200 rounded-2xl p-4 bg-zinc-50/50">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-medium text-zinc-900">{ticket.description}</p>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-200 text-zinc-800">
                        {ticket.status}
                      </span>
                    </div>
                    <div className="text-sm text-zinc-500 mb-4">
                      Classification: <span className="font-medium text-zinc-700">{ticket.aiClassification}</span>
                    </div>
                    
                    {ticket.aiClassification === 'Usage/Tenant' && ticket.tenantResponsibility === 'pending' && (
                      <div className="flex gap-2 mt-4 pt-4 border-t border-zinc-200">
                        <button 
                          onClick={() => handleResponsibility(ticket.id, 'accepted')}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          {t('accept_responsibility')}
                        </button>
                        <button 
                          onClick={() => handleResponsibility(ticket.id, 'disputed')}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-zinc-200 text-zinc-800 text-sm font-bold rounded-xl hover:bg-zinc-300 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          {t('dispute_to_landlord')}
                        </button>
                      </div>
                    )}
                    {ticket.tenantResponsibility !== 'pending' && (
                      <div className="mt-2 text-sm font-medium text-zinc-500">
                        Responsibility: <span className={ticket.tenantResponsibility === 'accepted' ? 'text-emerald-600' : 'text-amber-600'}>
                          {ticket.tenantResponsibility.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
