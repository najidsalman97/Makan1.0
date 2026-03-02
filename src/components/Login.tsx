import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Building2, Globe } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const [phone, setPhone] = useState('+96512345678');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('user', JSON.stringify(data.user));
        if (data.user.role === 'landlord') {
          navigate('/landlord');
        } else if (data.user.role === 'tenant') {
          navigate('/tenant');
        } else if (data.user.role === 'haris') {
          navigate('/haris');
        } else if (data.user.role === 'superadmin') {
          navigate('/superadmin');
        } else {
          // Other roles not implemented yet
          setError('Portal for this role is under construction.');
        }
      } else {
        setError(t('error_login'));
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const toggleLang = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="absolute top-4 right-4 rtl:left-4 rtl:right-auto">
        <button 
          onClick={toggleLang}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-zinc-200 hover:bg-zinc-50 transition-colors"
        >
          <Globe className="w-4 h-4 text-zinc-600" />
          <span className="text-sm font-medium text-zinc-700">{i18n.language === 'en' ? 'عربي' : 'English'}</span>
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
            <Building2 className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-zinc-900">
          {t('makan')}
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-600">
          {t('subtitle')}
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-white py-8 px-4 shadow-xl shadow-zinc-200/50 sm:rounded-3xl sm:px-10 border border-zinc-100">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-zinc-700">
                {t('phone_number')} / Email
              </label>
              <div className="mt-2">
                <input
                  id="phone"
                  name="phone"
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="block w-full rounded-xl border-0 py-3 px-4 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
                  placeholder="Phone or Email"
                  dir="ltr"
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-xl bg-emerald-600 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-all"
              >
                {t('sign_in')}
              </button>
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-xs text-zinc-500">
                {t('data_residency_disclosure')}
              </p>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
