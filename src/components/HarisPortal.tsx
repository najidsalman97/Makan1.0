import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { 
  Building2, 
  LogOut, 
  Search, 
  MessageCircle, 
  Camera, 
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  Globe
} from 'lucide-react';

export default function HarisPortal() {
  const [data, setData] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState<number | null>(null);
  
  // Maintenance Form State
  const [isReporting, setIsReporting] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.role !== 'haris') {
      navigate('/');
      return;
    }
    setUser(parsedUser);

    fetch(`/api/haris/${parsedUser.id}/dashboard`)
      .then(res => res.json())
      .then(resData => {
        if (resData.success) {
          setData(resData.data);
          if (resData.data.buildings.length > 0) {
            setSelectedBuilding(resData.data.buildings[0].id);
          }
        }
      });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const toggleLang = () => {
    const langs = ['ar', 'en', 'ur'];
    const currentIndex = langs.indexOf(i18n.language);
    const nextLang = langs[(currentIndex + 1) % langs.length];
    i18n.changeLanguage(nextLang);
    document.documentElement.dir = nextLang === 'ar' || nextLang === 'ur' ? 'rtl' : 'ltr';
  };

  const handleWhatsApp = (phone: string, unitNumber: string) => {
    const message = encodeURIComponent(t('whatsapp_message', { unit: unitNumber }));
    window.open(`https://wa.me/${phone.replace('+', '')}?text=${message}`, '_blank');
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile || !description || !selectedBuilding) return;

    setIsUploading(true);
    
    // Simulate getting location
    let lat = null;
    let lng = null;
    if (navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch (e) {
        console.log("Geolocation not available");
      }
    }

    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('buildingId', selectedBuilding.toString());
    if (selectedUnit) formData.append('unitId', selectedUnit.toString());
    formData.append('reporterId', user.id.toString());
    formData.append('description', description);
    if (lat) formData.append('latitude', lat.toString());
    if (lng) formData.append('longitude', lng.toString());

    try {
      const res = await fetch('/api/maintenance/upload', {
        method: 'POST',
        body: formData,
      });
      const result = await res.json();
      if (result.success) {
        setAiResult(result);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  if (!data || !user) return <div className="min-h-screen bg-zinc-900 flex items-center justify-center text-white">Loading...</div>;

  const currentBuilding = data.buildings.find((b: any) => b.id === selectedBuilding);
  
  const filteredUnits = currentBuilding?.units.filter((u: any) => 
    u.unitNumber.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 pb-20" dir={i18n.language === 'ar' || i18n.language === 'ur' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-blue-900 text-white shadow-md sticky top-0 z-20">
        <div className="px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-yellow-400" />
            <div>
              <h1 className="text-lg font-bold tracking-tight">{t('makan')}</h1>
              <p className="text-xs text-blue-200 font-medium">{t('haris_portal')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleLang}
              className="flex items-center gap-1 px-2 py-1 bg-blue-800 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
            >
              <Globe className="w-4 h-4" />
              {i18n.language.toUpperCase()}
            </button>
            <button 
              onClick={handleLogout}
              className="p-2 text-blue-200 hover:text-white transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6 max-w-lg mx-auto">
        
        {/* Building Selector */}
        {data.buildings.length > 1 && (
          <select 
            value={selectedBuilding || ''}
            onChange={(e) => setSelectedBuilding(parseInt(e.target.value))}
            className="w-full bg-white border border-zinc-300 text-zinc-900 text-base rounded-xl focus:ring-blue-900 focus:border-blue-900 block p-3 shadow-sm"
          >
            {data.buildings.map((b: any) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        )}

        {/* Dashboard Stats */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-zinc-200">
          <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">{t('building_health')}</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-black text-blue-900">{data.stats.totalUnits}</p>
              <p className="text-xs font-medium text-zinc-500 mt-1">{t('total_units')}</p>
            </div>
            <div>
              <p className="text-2xl font-black text-emerald-600">{data.stats.paidToday}</p>
              <p className="text-xs font-medium text-zinc-500 mt-1">{t('paid_today')}</p>
            </div>
            <div>
              <p className="text-2xl font-black text-red-600">{data.stats.pastDue}</p>
              <p className="text-xs font-medium text-zinc-500 mt-1">{t('past_due')}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <button 
          onClick={() => {
            setIsReporting(true);
            setAiResult(null);
            setImageFile(null);
            setDescription('');
          }}
          className="w-full flex items-center justify-center gap-3 bg-yellow-400 text-blue-900 py-4 rounded-2xl font-bold text-lg shadow-sm hover:bg-yellow-500 transition-colors"
        >
          <Camera className="w-6 h-6" />
          {t('report_issue')}
        </button>

        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
            <Search className="w-5 h-5 text-zinc-400" />
          </div>
          <input 
            type="text" 
            className="block w-full p-4 ps-10 text-base text-zinc-900 border border-zinc-300 rounded-2xl bg-white focus:ring-blue-900 focus:border-blue-900 shadow-sm" 
            placeholder={t('search_units')} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Unit List */}
        <div className="space-y-3">
          {filteredUnits.map((unit: any) => (
            <div key={unit.id} className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                  unit.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                  unit.paymentStatus === 'past_due' ? 'bg-red-100 text-red-700' :
                  unit.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-zinc-100 text-zinc-500'
                }`}>
                  {unit.unitNumber}
                </div>
                <div>
                  <p className="font-bold text-zinc-900">{t('unit')} {unit.unitNumber}</p>
                  <p className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
                    {unit.paymentStatus === 'paid' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                    {unit.paymentStatus === 'past_due' && <AlertCircle className="w-3 h-3 text-red-600" />}
                    {unit.paymentStatus === 'pending' && <Clock className="w-3 h-3 text-yellow-600" />}
                    {t(unit.paymentStatus)}
                  </p>
                </div>
              </div>
              
              {unit.paymentStatus === 'past_due' && unit.tenantPhone && (
                <button 
                  onClick={() => handleWhatsApp(unit.tenantPhone, unit.unitNumber)}
                  className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white shadow-sm hover:bg-green-600 transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* Maintenance Reporting Modal */}
      {isReporting && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="p-4 border-b border-zinc-100 flex justify-between items-center bg-blue-900 text-white">
              <h3 className="font-bold text-lg">{t('report_issue')}</h3>
              <button onClick={() => setIsReporting(false)} className="text-blue-200 hover:text-white">
                <LogOut className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              {!aiResult ? (
                <form onSubmit={handleReportSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-2">{t('unit')} (Optional)</label>
                    <select 
                      value={selectedUnit || ''}
                      onChange={(e) => setSelectedUnit(parseInt(e.target.value))}
                      className="w-full bg-zinc-50 border border-zinc-300 text-zinc-900 text-base rounded-xl p-3"
                    >
                      <option value="">Building General Area</option>
                      {currentBuilding?.units.map((u: any) => (
                        <option key={u.id} value={u.id}>{u.unitNumber}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-2">{t('take_photo')}</label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="environment"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setImageFile(e.target.files[0]);
                        }
                      }}
                    />
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-full h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors ${imageFile ? 'border-emerald-500 bg-emerald-50' : 'border-zinc-300 bg-zinc-50 hover:bg-zinc-100'}`}
                    >
                      {imageFile ? (
                        <>
                          <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                          <span className="text-sm font-medium text-emerald-700">Image Selected</span>
                        </>
                      ) : (
                        <>
                          <Camera className="w-8 h-8 text-zinc-400 mb-2" />
                          <span className="text-sm font-medium text-zinc-500">Tap to open camera</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-2">{t('describe_issue')}</label>
                    <textarea 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-300 text-zinc-900 text-base rounded-xl p-3 min-h-[100px]"
                      placeholder="e.g. Broken pipe in bathroom..."
                      required
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={isUploading || !imageFile || !description}
                    className="w-full flex items-center justify-center gap-2 bg-blue-900 text-white py-4 rounded-2xl font-bold text-lg shadow-sm hover:bg-blue-800 disabled:opacity-50 transition-colors"
                  >
                    {isUploading ? (
                      <>{t('uploading')}</>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        {t('submit_report')}
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h4 className="text-lg font-bold text-zinc-900 mb-2">Report Submitted</h4>
                  <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 mt-4 text-left">
                    <p className="text-xs text-zinc-500 uppercase font-bold mb-1">{t('draft_status')}</p>
                    <p className="font-medium text-zinc-900">{aiResult.classification}</p>
                    <p className="text-xs text-zinc-500 mt-2">Confidence: {(aiResult.confidence * 100).toFixed(0)}%</p>
                  </div>
                  <button 
                    onClick={() => setIsReporting(false)}
                    className="w-full mt-6 bg-zinc-200 text-zinc-800 py-3 rounded-xl font-bold hover:bg-zinc-300 transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
