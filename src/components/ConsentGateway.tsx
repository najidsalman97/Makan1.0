import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { ShieldCheck, ArrowRight } from 'lucide-react';

export default function ConsentGateway({ children }: { children: React.ReactNode }) {
  const [hasConsented, setHasConsented] = useState<boolean | null>(null);
  const [isSliding, setIsSliding] = useState(false);
  const { t, i18n } = useTranslation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (!user.id) return;
    fetch(`/api/compliance/status/${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setHasConsented(data.hasConsented);
        }
      });
  }, [user.id]);

  const handleConsent = async () => {
    try {
      // Basic browser fingerprinting mock
      const fingerprint = navigator.userAgent + navigator.language + window.screen.width;
      await fetch('/api/compliance/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, browserFingerprint: fingerprint })
      });
      setHasConsented(true);
    } catch (error) {
      console.error('Consent failed', error);
    }
  };

  if (hasConsented === null) return <div className="min-h-screen bg-zinc-900 flex items-center justify-center text-white">Loading...</div>;
  if (hasConsented) return <>{children}</>;

  const isArabic = i18n.language === 'ar';

  return (
    <div className="fixed inset-0 bg-zinc-900 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl"
      >
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
          <ShieldCheck className="w-8 h-8 text-blue-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-zinc-900 mb-4">
          {isArabic ? 'اتفاقية خصوصية البيانات والإقامة' : 'Data Privacy & Residency Agreement'}
        </h2>
        
        <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 mb-8">
          <p className="text-zinc-700 leading-relaxed text-sm font-medium">
            {isArabic 
              ? 'أقر بموجبي وأوافق على معالجة بياناتي الشخصية (الرقم المدني والموقع الجغرافي) وتخزينها حصرياً داخل دولة الكويت (منطقة Google Cloud me-central2) وفقاً للوائح الهيئة العامة للاتصالات وتقنية المعلومات (CITRA).'
              : 'I hereby acknowledge and consent to the processing and storage of my personal data (Civil ID and Geo-location) exclusively within the State of Kuwait (Google Cloud me-central2 region) in accordance with CITRA regulations.'}
          </p>
        </div>

        <div className="relative h-14 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-sm font-bold text-zinc-500 uppercase tracking-wider">
              {isArabic ? 'اسحب للموافقة' : 'Slide to Accept'}
            </span>
          </div>
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 300 }}
            dragElastic={0}
            dragMomentum={false}
            onDragEnd={(e, info) => {
              if (info.offset.x > 200) {
                handleConsent();
              } else {
                setIsSliding(false);
              }
            }}
            onDragStart={() => setIsSliding(true)}
            className="absolute top-1 bottom-1 left-1 w-12 bg-blue-600 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing z-10 shadow-md"
          >
            <ArrowRight className="w-5 h-5 text-white" />
          </motion.div>
          {/* Progress bar effect */}
          {isSliding && (
            <motion.div 
              className="absolute top-0 bottom-0 left-0 bg-blue-100"
              style={{ width: '50%' }} // Simplified for visual feedback
            />
          )}
        </div>
      </motion.div>
    </div>
  );
}
