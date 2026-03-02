import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { 
  Building2, 
  LogOut, 
  Globe,
  Users,
  Home,
  FileText,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Settings,
  MessageCircle,
  Download,
  Activity
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function SuperAdmin() {
  const [data, setData] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [feeSetting, setFeeSetting] = useState('1.000');
  const [isSavingFee, setIsSavingFee] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [archiveData, setArchiveData] = useState<any[]>([]);
  const [isLoadingArchive, setIsLoadingArchive] = useState(false);
  const [residencyRegion, setResidencyRegion] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.role !== 'superadmin') {
      navigate('/');
      return;
    }
    setUser(parsedUser);

    fetchData(parsedUser.id);
  }, [navigate]);

  useEffect(() => {
    const checkResidency = async () => {
      try {
        const res = await fetch('/api/compliance/residency-check');
        const data = await res.json();
        if (data.success) {
          setResidencyRegion(data.region);
        }
      } catch (e) {
        console.error(e);
      }
    };
    checkResidency();
    const interval = setInterval(checkResidency, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async (userId: number) => {
    try {
      const res = await fetch('/api/superadmin/dashboard', {
        headers: { 'x-user-id': userId.toString() }
      });
      const resData = await res.json();
      if (resData.success) {
        setData(resData.data);
        if (resData.data.settings?.makan_management_fee) {
          setFeeSetting(resData.data.settings.makan_management_fee);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const toggleLang = () => {
    const langs = ['ar', 'en'];
    const currentIndex = langs.indexOf(i18n.language);
    const nextLang = langs[(currentIndex + 1) % langs.length];
    i18n.changeLanguage(nextLang);
    document.documentElement.dir = nextLang === 'ar' ? 'rtl' : 'ltr';
  };

  const handleSaveFee = async () => {
    setIsSavingFee(true);
    try {
      await fetch('/api/superadmin/settings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user.id.toString()
        },
        body: JSON.stringify({ key: 'makan_management_fee', value: feeSetting })
      });
      alert('Fee updated successfully');
    } catch (error) {
      alert('Error updating fee');
    } finally {
      setIsSavingFee(false);
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastMessage) return;
    try {
      const res = await fetch('/api/superadmin/broadcast', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user.id.toString()
        },
        body: JSON.stringify({ message: broadcastMessage })
      });
      const result = await res.json();
      if (result.success) {
        alert(`Broadcast sent to ${result.count} landlords: ${broadcastMessage}`);
        setBroadcastMessage('');
      } else {
        alert('Failed to send broadcast');
      }
    } catch (error) {
      alert('Error sending broadcast');
    }
  };

  const handleImpersonate = (landlord: any) => {
    if (window.confirm(`Impersonate ${landlord.name}?`)) {
      localStorage.setItem('superadmin_user', JSON.stringify(user));
      localStorage.setItem('impersonating', 'true');
      localStorage.setItem('user', JSON.stringify(landlord));
      navigate('/landlord');
    }
  };

  const downloadCSV = () => {
    if (!data) return;
    const csvRows = [];
    csvRows.push(['Landlord Name', 'Email', 'Phone', 'MOCI Verified']);
    data.landlords.forEach((l: any) => {
      csvRows.push([l.name, l.email, l.phone, l.mociLicenseVerified ? 'Yes' : 'No']);
    });
    const csvString = csvRows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'moci_audit_report.csv';
    a.click();
  };

  const openArchiveBrowser = async () => {
    setIsArchiveModalOpen(true);
    setIsLoadingArchive(true);
    try {
      const res = await fetch('/api/superadmin/archive', {
        headers: { 'x-user-id': user.id.toString() }
      });
      const resData = await res.json();
      if (resData.success) {
        setArchiveData(resData.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingArchive(false);
    }
  };

  if (!data || !user) return <div className="min-h-screen bg-zinc-900 flex items-center justify-center text-white">Loading SuperAdmin...</div>;

  const heatmapData = Object.keys(data.heatmap || {}).map(area => ({
    name: area,
    value: data.heatmap[area]
  })).sort((a, b) => b.value - a.value);

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 pb-20" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-zinc-900 text-white shadow-md sticky top-0 z-20">
        {residencyRegion && residencyRegion !== 'me-central2' && (
          <div className="bg-red-600 text-white px-4 py-2 text-center text-sm font-bold flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            CRITICAL ALERT: Data Residency Violation. Server region is {residencyRegion}, expected me-central2.
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-emerald-400" />
            <div>
              <h1 className="text-lg font-bold tracking-tight">Makan</h1>
              <p className="text-xs text-zinc-400 font-medium tracking-widest uppercase">God Mode</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleLang}
              className="flex items-center gap-1 px-2 py-1 bg-zinc-800 rounded-lg text-xs font-medium hover:bg-zinc-700 transition-colors"
            >
              <Globe className="w-4 h-4" />
              {i18n.language.toUpperCase()}
            </button>
            <button 
              onClick={handleLogout}
              className="p-2 text-zinc-400 hover:text-white transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        
        {/* 1. Macro-Analytics & Growth Metrics */}
        <section>
          <h2 className="text-xl font-bold text-zinc-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" />
            Macro-Analytics & Growth
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-zinc-500 uppercase">Active Landlords</h3>
              </div>
              <p className="text-3xl font-black text-zinc-900">{data.stats.activeLandlords}</p>
              <p className="text-xs text-zinc-500 mt-2">
                <span className="text-emerald-600 font-bold">{data.stats.verifiedLandlords}</span> MOCI Verified
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
              <div className="flex items-center gap-3 mb-2">
                <Home className="w-5 h-5 text-purple-600" />
                <h3 className="text-sm font-bold text-zinc-500 uppercase">Portfolio Scale</h3>
              </div>
              <p className="text-3xl font-black text-zinc-900">{data.stats.totalUnits}</p>
              <p className="text-xs text-zinc-500 mt-2">
                Across {data.stats.totalBuildings} buildings & {data.stats.activeLeases} leases
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-zinc-500 uppercase">Rent Processed</h3>
              </div>
              <p className="text-3xl font-black text-zinc-900">{data.stats.totalRent.toLocaleString()} <span className="text-sm">KWD</span></p>
              <p className="text-xs text-zinc-500 mt-2">Via Upayments</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 bg-emerald-50 border-emerald-100">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-emerald-800 uppercase">Makan Fees Earned</h3>
              </div>
              <p className="text-3xl font-black text-emerald-700">{data.stats.totalFees.toLocaleString()} <span className="text-sm">KWD</span></p>
              <p className="text-xs text-emerald-600 mt-2">Platform Revenue</p>
            </div>
          </div>
        </section>

        {/* Heatmap */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
          <h3 className="text-sm font-bold text-zinc-500 uppercase mb-4">Property Density Heatmap (Kuwait)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={heatmapData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#f4f4f5' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" fill="#0ea5e9" radius={[0, 4, 4, 0]}>
                  {heatmapData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#0284c7' : '#38bdf8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 2. Legal Compliance & Audit Trail */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Legal Compliance
              </h2>
              <button onClick={downloadCSV} className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700">
                <Download className="w-4 h-4" /> Export MOCI Audit
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
              <div className="p-4 border-b border-zinc-100 bg-zinc-50 flex justify-between items-center">
                <h3 className="font-bold text-zinc-700">Executive Document Tracker</h3>
                <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">{data.stats.executiveDocs} PACI Signed</span>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-zinc-600">Pending Signatures</span>
                  <span className="text-sm font-bold text-amber-600">{data.stats.pendingDocs}</span>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${data.stats.executiveDocs + data.stats.pendingDocs > 0 ? (data.stats.executiveDocs / (data.stats.executiveDocs + data.stats.pendingDocs)) * 100 : 0}%` }}></div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
              <div className="p-4 border-b border-zinc-100 bg-zinc-50">
                <h3 className="font-bold text-zinc-700">14-Day Withdrawal Audit (Law 10/2026)</h3>
              </div>
              <div className="divide-y divide-zinc-100 max-h-60 overflow-y-auto">
                {data.withdrawals.length === 0 ? (
                  <p className="p-4 text-sm text-zinc-500 text-center">No withdrawals recorded.</p>
                ) : (
                  data.withdrawals.map((w: any) => (
                    <div key={w.id} className="p-4 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-sm text-zinc-900">{w.tenant.name}</p>
                        <p className="text-xs text-zinc-500">Lease #{w.id}</p>
                      </div>
                      <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded-full">Intent Logged</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
              <div className="p-4 border-b border-zinc-100 bg-zinc-50">
                <h3 className="font-bold text-zinc-700">MOCI License Verification</h3>
              </div>
              <div className="divide-y divide-zinc-100 max-h-60 overflow-y-auto">
                {data.landlords.slice(0, 10).map((l: any) => (
                  <div key={l.id} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-sm text-zinc-900">{l.name}</p>
                      <p className="text-xs text-zinc-500">{l.phone}</p>
                    </div>
                    {l.mociLicenseVerified ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
              <div className="p-4 border-b border-zinc-100 bg-zinc-50">
                <h3 className="font-bold text-zinc-700">Archive Browser (5-Year Vault)</h3>
              </div>
              <div className="p-4 text-center text-sm text-zinc-500">
                <p>Immutable Audit Logs are securely stored.</p>
                <button onClick={openArchiveBrowser} className="mt-2 text-blue-600 font-bold hover:underline">Open Vault Browser</button>
              </div>
            </div>
          </section>

          {/* 3 & 4. Support, Admin Controls */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-zinc-600" />
              Admin Controls & Oversight
            </h2>

            <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6">
              <h3 className="font-bold text-zinc-700 mb-4">System Settings</h3>
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Makan Management Fee (KWD)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={feeSetting}
                    onChange={(e) => setFeeSetting(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-300 text-zinc-900 text-base rounded-xl p-3"
                  />
                </div>
                <button 
                  onClick={handleSaveFee}
                  disabled={isSavingFee}
                  className="bg-zinc-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-zinc-800 transition-colors"
                >
                  {isSavingFee ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6">
              <h3 className="font-bold text-zinc-700 mb-4">Emergency Compliance Alert</h3>
              <textarea 
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Enter message to broadcast to all Landlords via WhatsApp..."
                className="w-full bg-zinc-50 border border-zinc-300 text-zinc-900 text-base rounded-xl p-3 min-h-[100px] mb-4"
              />
              <button 
                onClick={handleBroadcast}
                className="w-full flex items-center justify-center gap-2 bg-amber-500 text-amber-950 py-3 rounded-xl font-bold hover:bg-amber-400 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                Broadcast to {data.stats.activeLandlords} Landlords
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
              <div className="p-4 border-b border-zinc-100 bg-zinc-50 flex justify-between items-center">
                <h3 className="font-bold text-zinc-700">AI Engine Performance</h3>
                <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{data.stats.aiAccuracy.toFixed(1)}% Accuracy</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
              <div className="p-4 border-b border-zinc-100 bg-zinc-50">
                <h3 className="font-bold text-zinc-700">Global Maintenance Feed</h3>
              </div>
              <div className="divide-y divide-zinc-100 max-h-60 overflow-y-auto">
                {data.maintenance.slice(0, 10).map((m: any) => {
                  const isOld = (new Date().getTime() - new Date(m.createdAt).getTime()) > 48 * 60 * 60 * 1000;
                  const isUrgent = m.status !== 'resolved' && m.aiClassification === 'Structural/Landlord' && isOld;
                  
                  return (
                    <div key={m.id} className={`p-4 ${isUrgent ? 'bg-red-50' : ''}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-sm text-zinc-900">{m.description}</p>
                          <p className="text-xs text-zinc-500 mt-1">Building #{m.buildingId} • {m.aiClassification}</p>
                        </div>
                        {isUrgent && <AlertTriangle className="w-5 h-5 text-red-500" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
              <div className="p-4 border-b border-zinc-100 bg-zinc-50">
                <h3 className="font-bold text-zinc-700">Impersonate Landlord</h3>
              </div>
              <div className="p-4">
                <select 
                  value=""
                  onChange={(e) => {
                    if(e.target.value) {
                      const ll = data.landlords.find((l: any) => l.id.toString() === e.target.value);
                      if(ll) handleImpersonate(ll);
                    }
                  }}
                  className="w-full bg-zinc-50 border border-zinc-300 text-zinc-900 text-base rounded-xl p-3"
                >
                  <option value="">Select a Landlord to impersonate...</option>
                  {data.landlords.map((l: any) => (
                    <option key={l.id} value={l.id}>{l.name} ({l.phone})</option>
                  ))}
                </select>
              </div>
            </div>

          </section>
        </div>
      </main>

      {/* Archive Modal */}
      {isArchiveModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
              <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-zinc-500" />
                Immutable Audit Logs (5-Year Vault)
              </h2>
              <button 
                onClick={() => setIsArchiveModalOpen(false)}
                className="p-2 hover:bg-zinc-200 rounded-full transition-colors"
              >
                <XCircle className="w-6 h-6 text-zinc-500" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {isLoadingArchive ? (
                <div className="flex justify-center items-center h-32 text-zinc-500">Loading vault records...</div>
              ) : archiveData.length === 0 ? (
                <div className="text-center text-zinc-500 py-8">No records found in the vault.</div>
              ) : (
                <div className="space-y-4">
                  {archiveData.map((log: any) => (
                    <div key={log.id} className="border border-zinc-200 rounded-2xl p-4 bg-zinc-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <p className="font-bold text-zinc-900">Payment ID: {log.paymentId}</p>
                        <p className="text-xs text-zinc-500 font-mono mt-1">Hash: {log.receiptHash}</p>
                        <p className="text-xs text-zinc-500 mt-1">Archived: {new Date(log.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-600">{log.payment?.amount} KWD</p>
                        <a 
                          href={log.pdfUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 mt-2"
                        >
                          <Download className="w-3 h-3" /> View PDF
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
