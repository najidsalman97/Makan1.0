import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { 
  Building2, 
  LogOut, 
  TrendingUp, 
  Home, 
  Users, 
  MapPin, 
  FileText,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface DashboardData {
  buildings: any[];
  stats: {
    totalRent: number;
    totalUnits: number;
    occupiedUnits: number;
    occupancyRate: number;
  };
}

export default function LandlordDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [user, setUser] = useState<any>(null);
  const [showMociVerification, setShowMociVerification] = useState(false);
  const [mociLicenseNumber, setMociLicenseNumber] = useState('');
  const [civilId, setCivilId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [showCivilId, setShowCivilId] = useState(false);
  const [auditReason, setAuditReason] = useState('');
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    if (parsedUser.role === 'landlord' && (!parsedUser.mociLicenseVerified || !parsedUser.civilId)) {
      setShowMociVerification(true);
    }

    fetch(`/api/landlord/${parsedUser.id}/dashboard`)
      .then(res => res.json())
      .then(resData => {
        if (resData.success) {
          setData(resData.data);
        }
      });
  }, [navigate]);

  const handleVerifyMoci = async () => {
    if (!mociLicenseNumber || !civilId) return;
    setIsVerifying(true);
    try {
      const res = await fetch(`/api/landlord/${user.id}/verify-moci`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mociLicenseNumber, civilId })
      });
      const result = await res.json();
      if (result.success) {
        const updatedUser = { ...user, mociLicenseVerified: true, mociLicenseNumber, civilId };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setShowMociVerification(false);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleViewAudit = () => {
    if (!showCivilId) {
      const reason = window.prompt("Enter reason for viewing encrypted Civil ID (Audit Log):");
      if (reason && reason.trim().length > 0) {
        setAuditReason(reason);
        setShowCivilId(true);
        // In a real app, this would log the audit reason to the backend
        console.log(`[AUDIT LOG] User ${user.id} viewed Civil ID. Reason: ${reason}`);
        setTimeout(() => {
          setShowCivilId(false);
          setAuditReason('');
        }, 10000); // Hide after 10 seconds
      }
    } else {
      setShowCivilId(false);
      setAuditReason('');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const isImpersonating = localStorage.getItem('impersonating') === 'true';

  const handleReturnToSuperAdmin = () => {
    localStorage.removeItem('impersonating');
    const superAdminUser = localStorage.getItem('superadmin_user');
    if (superAdminUser) {
      localStorage.setItem('user', superAdminUser);
      localStorage.removeItem('superadmin_user');
      navigate('/superadmin');
    } else {
      handleLogout();
    }
  };

  if (!data || !user) return <div className="min-h-screen bg-zinc-50 flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
      {isImpersonating && (
        <div className="bg-amber-500 text-amber-950 px-4 py-2 text-center text-sm font-bold flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4" />
          You are currently impersonating {user.name}.
          <button onClick={handleReturnToSuperAdmin} className="underline hover:text-amber-900 ml-2">
            Return to SuperAdmin
          </button>
        </div>
      )}
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">{t('makan')}</h1>
              <p className="text-xs text-zinc-500 font-medium">{t('dashboard')}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium text-zinc-700 hidden sm:block">
              {t('welcome')}, {user.name}
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-200"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500">{t('total_rent')}</p>
                <p className="text-2xl font-bold text-zinc-900">{data.stats.totalRent.toLocaleString()} {t('kwd')}</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-200"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                <Home className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500">{t('total_units')}</p>
                <p className="text-2xl font-bold text-zinc-900">{data.stats.totalUnits}</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-200"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500">{t('occupancy_rate')}</p>
                <p className="text-2xl font-bold text-zinc-900">{data.stats.occupancyRate.toFixed(0)}%</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Identity & Compliance */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-200">
          <h2 className="text-xl font-bold text-zinc-900 mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            Identity & Compliance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
              <p className="text-sm text-zinc-500 mb-1">MOCI E-Commerce License</p>
              <div className="flex items-center justify-between">
                <p className="font-mono font-bold text-zinc-900">{user.mociLicenseNumber || 'Not Provided'}</p>
                {user.mociLicenseVerified ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4" /> Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                    <AlertTriangle className="w-4 h-4" /> Pending
                  </span>
                )}
              </div>
            </div>
            <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
              <p className="text-sm text-zinc-500 mb-1">Civil ID (Encrypted)</p>
              <div className="flex items-center justify-between">
                <p className="font-mono font-bold text-zinc-900">
                  {user.civilId ? (showCivilId ? user.civilId : `********${user.civilId.slice(-4)}`) : 'Not Provided'}
                </p>
                <button 
                  onClick={handleViewAudit}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  {showCivilId ? 'Hide' : 'View Audit'}
                </button>
              </div>
              {showCivilId && auditReason && (
                <p className="text-[10px] text-amber-600 mt-2">
                  Audit Log: Viewed for "{auditReason}"
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Buildings List */}
        <div>
          <h2 className="text-xl font-bold text-zinc-900 mb-6">{t('buildings')}</h2>
          <div className="space-y-6">
            {data.buildings.map((building, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + (i * 0.1) }}
                key={building.id}
                className="bg-white rounded-3xl shadow-sm border border-zinc-200 overflow-hidden"
              >
                <div className="p-6 border-b border-zinc-100 bg-zinc-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-zinc-400" />
                      {building.name}
                    </h3>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-zinc-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {building.address}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        {t('paci_number')}: <span className="font-mono">{building.paciNumber}</span>
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-zinc-500 font-medium">{t('total_rent')}</p>
                    <p className="text-xl font-bold text-emerald-600">{building.totalRent.toLocaleString()} {t('kwd')}</p>
                  </div>
                </div>
                
                <div className="p-6">
                  <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-4">{t('units')}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {building.units.map((unit: any) => (
                      <div key={unit.id} className="p-4 rounded-2xl border border-zinc-100 bg-zinc-50 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-sm font-bold text-zinc-900">{t('unit')} {unit.unitNumber}</p>
                            <p className="text-xs text-zinc-500 mt-1">{unit.rentAmount} {t('kwd')}</p>
                          </div>
                          <div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              unit.status === 'occupied' ? 'bg-emerald-100 text-emerald-800' :
                              unit.status === 'vacant' ? 'bg-zinc-200 text-zinc-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {t(unit.status)}
                            </span>
                          </div>
                        </div>
                        {unit.lease && unit.lease.isExecutiveDocument && (
                          <div className="mt-2 pt-2 border-t border-zinc-200">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 mb-2">
                              Certified Executive Document
                            </span>
                            <a 
                              href={`/api/landlord/${user.id}/eviction-package/${unit.lease.id}`}
                              className="block w-full text-center text-xs font-bold text-blue-600 bg-blue-50 py-1.5 rounded hover:bg-blue-100 transition-colors"
                            >
                              Download Judicial Package
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      {/* MOCI Verification Modal */}
      {showMociVerification && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">MOCI Identity Disclosure</h2>
            <p className="text-zinc-500 text-sm mb-6">
              To comply with Decree-Law No. 10/2026 (Article 12), you must verify your identity by providing your MOCI E-Commerce License Number.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-1">MOCI License Number</label>
                <input 
                  type="text" 
                  value={mociLicenseNumber}
                  onChange={(e) => setMociLicenseNumber(e.target.value)}
                  placeholder="e.g. 12345678"
                  className="w-full bg-zinc-50 border border-zinc-300 text-zinc-900 text-base rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-1">Civil ID Number</label>
                <input 
                  type="text" 
                  value={civilId}
                  onChange={(e) => setCivilId(e.target.value)}
                  placeholder="e.g. 290010101234"
                  className="w-full bg-zinc-50 border border-zinc-300 text-zinc-900 text-base rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              
              <button 
                onClick={handleVerifyMoci}
                disabled={isVerifying || !mociLicenseNumber || !civilId}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isVerifying ? 'Verifying...' : 'Verify Identity'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
