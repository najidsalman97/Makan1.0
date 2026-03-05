import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Smartphone, Loader, CheckCircle2, AlertCircle } from 'lucide-react';

interface PACISyncProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (properties: any[]) => void;
  landlordId: number;
}

type AuthStep = 'idle' | 'authenticating' | 'success' | 'error';

export default function PACIPropertySync({ isOpen, onClose, onAuthSuccess, landlordId }: PACISyncProps) {
  const [authStep, setAuthStep] = useState<AuthStep>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [transactionId, setTransactionId] = useState('');

  const handlePACIAuth = async () => {
    setAuthStep('authenticating');
    setErrorMessage('');
    
    try {
      // Call the PACI auth endpoint to initiate Kuwait Mobile ID authentication
      const res = await fetch('/api/paci/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ landlordId })
      });

      const result = await res.json();

      if (result.success) {
        setTransactionId(result.transactionId);
        
        // Simulate successful authentication
        // In real implementation, this would redirect to Hawyti login
        setTimeout(() => {
          setAuthStep('success');
          
          // After successful auth, fetch properties from PACI
          fetchPACIProperties(landlordId, result.transactionId);
        }, 2000);
      } else {
        setAuthStep('error');
        setErrorMessage(result.message || 'Authentication failed');
      }
    } catch (err) {
      setAuthStep('error');
      setErrorMessage('Failed to initiate PACI authentication');
      console.error(err);
    }
  };

  const fetchPACIProperties = async (landlordId: number, transactionId: string) => {
    try {
      const res = await fetch(`/api/paci/properties?landlordId=${landlordId}&transactionId=${transactionId}`);
      const result = await res.json();

      if (result.success) {
        // Pass properties to parent and trigger review screen
        onAuthSuccess(result.properties);
        // The parent component will show the review/import screen
      } else {
        setAuthStep('error');
        setErrorMessage('Failed to fetch properties from PACI');
      }
    } catch (err) {
      setAuthStep('error');
      setErrorMessage('Failed to fetch PACI properties');
      console.error(err);
    }
  };

  const handleRetry = () => {
    setAuthStep('idle');
    setErrorMessage('');
    setTransactionId('');
  };

  const handleClose = () => {
    handleRetry();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-xl max-w-md w-full"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-zinc-200">
            <h2 className="text-xl font-bold text-zinc-900">Sync with PACI</h2>
            <button
              onClick={handleClose}
              className="text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {authStep === 'idle' && (
              <div className="space-y-4">
                <p className="text-zinc-600 text-sm">
                  Synchronize your properties with the Kuwait PACI (Public Authority for Civil Information) registry using your Mobile ID (Hawyti).
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                  <p className="font-semibold mb-2">How it works:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Authenticate with your Mobile ID (Hawyti)</li>
                    <li>Pull registered property ownership data</li>
                    <li>Review and import properties into Makan</li>
                    <li>Compliance event logged for CITRA audit trail</li>
                  </ul>
                </div>
                <button
                  onClick={handlePACIAuth}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Smartphone className="w-5 h-5" />
                  Authenticate with Mobile ID
                </button>
              </div>
            )}

            {authStep === 'authenticating' && (
              <div className="flex flex-col items-center justify-center space-y-4 py-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <Loader className="w-10 h-10 text-blue-600" />
                </motion.div>
                <p className="text-zinc-600 text-center">
                  Authenticating with Kuwait Mobile ID...
                </p>
                <p className="text-xs text-zinc-500">
                  Please complete the authentication on your device
                </p>
              </div>
            )}

            {authStep === 'success' && (
              <div className="flex flex-col items-center justify-center space-y-4 py-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                >
                  <CheckCircle2 className="w-16 h-16 text-emerald-600" />
                </motion.div>
                <p className="text-zinc-600 text-center font-semibold">
                  Authentication Successful
                </p>
                <p className="text-xs text-zinc-500 text-center">
                  Transaction ID: <span className="font-mono">{transactionId}</span>
                </p>
                <p className="text-xs text-zinc-500 text-center">
                  Loading your properties from PACI registry...
                </p>
              </div>
            )}

            {authStep === 'error' && (
              <div className="flex flex-col items-center justify-center space-y-4 py-8">
                <AlertCircle className="w-16 h-16 text-red-600" />
                <p className="text-zinc-600 text-center font-semibold">
                  Authentication Failed
                </p>
                <p className="text-sm text-red-600 text-center">
                  {errorMessage}
                </p>
                <button
                  onClick={handleRetry}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
