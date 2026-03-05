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
  AlertTriangle,
  MessageCircle,
  Lock,
  Archive,
  Download,
  Smartphone
} from 'lucide-react';
import AuditVault from './AuditVault';
import LandlordCommunications from './LandlordCommunications';
import LandlordLeaseAmendments from './LandlordLeaseAmendments';
import LandlordJudicialBundle from './LandlordJudicialBundle';
import PropertyManagement from './PropertyManagement';
import PACIPropertySync from './PACIPropertySync';
import PACIReviewImport from './PACIReviewImport';

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
  const [residencyCompliant, setResidencyCompliant] = useState(true);
  const [residencyRegion, setResidencyRegion] = useState('');
  const [showCommunications, setShowCommunications] = useState(false);
  const [showAuditVault, setShowAuditVault] = useState(false);
  const [showLeaseAmendments, setShowLeaseAmendments] = useState(false);
  const [showJudicialBundle, setShowJudicialBundle] = useState(false);
  const [showPropertyManagement, setShowPropertyManagement] = useState(false);
  const [showPACISync, setShowPACISync] = useState(false);
  const [showPACIReview, setShowPACIReview] = useState(false);
  const [paciProperties, setPACIProperties] = useState<any[]>([]);
  const [paciTransactionId, setPACITransactionId] = useState('');
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

    // Check residency compliance
    fetch(`/api/landlord/${parsedUser.id}/residency-check`)
      .then(res => res.json())
      .then(resData => {
        if (resData.success) {
          setResidencyCompliant(resData.isCompliant);
          setResidencyRegion(resData.region);
        }
      });

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
        {/* Residency Compliance Alert */}
        {!residencyCompliant && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-red-900 text-sm">CITRA Tier 4 Compliance Alert</h3>
              <p className="text-red-800 text-sm mt-1">
                System is running in region: <span className="font-mono font-bold">{residencyRegion}</span>. 
                For MOCI compliance, system must run in <span className="font-mono font-bold">me-central2</span> (Kuwait). 
                Civil ID data entry is disabled.
              </p>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <button
            onClick={() => setShowPropertyManagement(true)}
            className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg p-4 transition-colors text-left"
          >
            <Building2 className="w-6 h-6 text-indigo-600 mb-2" />
            <p className="font-bold text-sm text-indigo-900">Properties</p>
            <p className="text-xs text-indigo-700 mt-1">Add & Manage</p>
          </button>

          <button
            onClick={() => setShowPACISync(true)}
            className="bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 rounded-lg p-4 transition-colors text-left"
          >
            <Smartphone className="w-6 h-6 text-cyan-600 mb-2" />
            <p className="font-bold text-sm text-cyan-900">Sync PACI</p>
            <p className="text-xs text-cyan-700 mt-1">Mobile ID Sync</p>
          </button>

          <button
            onClick={() => setShowCommunications(true)}
            className="bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg p-4 transition-colors text-left"
          >
            <MessageCircle className="w-6 h-6 text-blue-600 mb-2" />
            <p className="font-bold text-sm text-blue-900">Communications</p>
            <p className="text-xs text-blue-700 mt-1">Bulk WhatsApp Reminders</p>
          </button>

          <button
            onClick={() => setShowAuditVault(true)}
            className="bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg p-4 transition-colors text-left"
          >
            <Archive className="w-6 h-6 text-red-600 mb-2" />
            <p className="font-bold text-sm text-red-900">Audit Vault</p>
            <p className="text-xs text-red-700 mt-1">5-Year Immutable Records</p>
          </button>

          <button
            onClick={() => setShowLeaseAmendments(true)}
            className="bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg p-4 transition-colors text-left"
          >
            <Lock className="w-6 h-6 text-purple-600 mb-2" />
            <p className="font-bold text-sm text-purple-900">Lease Amendments</p>
            <p className="text-xs text-purple-700 mt-1">Digital Addendums</p>
          </button>

          <button
            onClick={() => setShowJudicialBundle(true)}
            className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg p-4 transition-colors text-left"
          >
            <Download className="w-6 h-6 text-emerald-600 mb-2" />
            <p className="font-bold text-sm text-emerald-900">Judicial Bundles</p>
            <p className="text-xs text-emerald-700 mt-1">One-Click Eviction Package</p>
          </button>
        </div>

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
                          <div className="mt-2 pt-2 border-t border-zinc-200 space-y-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                              Certified Executive Document
                            </span>
                            <a 
                              href={`/api/landlord/${user.id}/eviction-package-enhanced/${unit.lease.id}`}
                              className="block w-full text-center text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 py-1.5 rounded transition-colors"
                            >
                              📁 Judicial Bundle (Enhanced)
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

      {/* Communications Center Modal */}
      {showCommunications && (
        <LandlordCommunications 
          isModal={true}
          onClose={() => setShowCommunications(false)}
        />
      )}

      {/* Property Management Modal */}
      {showPropertyManagement && (
        <PropertyManagement 
          isModal={true}
          onClose={() => setShowPropertyManagement(false)}
        />
      )}

      {/* Lease Amendments Modal */}
      {showLeaseAmendments && (
        <LandlordLeaseAmendments 
          isModal={true}
          onClose={() => setShowLeaseAmendments(false)}
        />
      )}

      {/* Judicial Bundle Modal */}
      {showJudicialBundle && (
        <LandlordJudicialBundle 
          isModal={true}
          onClose={() => setShowJudicialBundle(false)}
        />
      )}

      {/* Audit Vault Modal */}
      {showAuditVault && user && (
        <AuditVault 
          landlordId={user.id}
          onClose={() => setShowAuditVault(false)}
        />
      )}

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

      {/* PACI Property Sync Modal */}
      <PACIPropertySync
        isOpen={showPACISync}
        onClose={() => setShowPACISync(false)}
        onAuthSuccess={(properties) => {
          setPACIProperties(properties);
          setShowPACISync(false);
          setShowPACIReview(true);
        }}
        landlordId={user?.id || 0}
      />

      {/* PACI Review & Import Modal */}
      <PACIReviewImport
        isOpen={showPACIReview}
        onClose={() => {
          setShowPACIReview(false);
          setPACIProperties([]);
          setPACITransactionId('');
        }}
        properties={paciProperties}
        landlordId={user?.id || 0}
        transactionId={paciTransactionId}
      />
    </div>
  );
}
