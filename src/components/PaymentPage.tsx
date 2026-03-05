import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Building2, ShieldCheck, CreditCard } from 'lucide-react';

export default function PaymentPage() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [showDisclosure, setShowDisclosure] = useState(true);

  useEffect(() => {
    fetch(`/api/payment/${id}`)
      .then(res => res.json())
      .then(resData => {
        if (resData.success) {
          setData(resData.data);
        }
      });
  }, [id]);

  if (!data) return <div className="min-h-screen bg-zinc-50 flex items-center justify-center">Loading...</div>;

  // Extract additional payment data
  const paymentAmount = parseFloat(data.amount);
  const managementFee = 1.000; // Default Makan fee
  const rentAmount = paymentAmount - managementFee;

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-zinc-200 overflow-hidden">
          <div className="p-8 text-center bg-blue-900 text-white">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-1">Makan Rent Payment</h1>
            <p className="text-blue-200 text-sm">Secure K-Net Gateway</p>
          </div>

          <div className="p-8 space-y-6">
            <div className="text-center">
              <p className="text-sm text-zinc-500 font-medium uppercase tracking-wider mb-1">Amount Due</p>
              <p className="text-4xl font-bold text-zinc-900">{data.amount.toFixed(3)} KWD</p>
            </div>

            <div className="bg-zinc-50 rounded-2xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Tenant</span>
                <span className="font-bold text-zinc-900">{data.tenantName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Unit</span>
                <span className="font-bold text-zinc-900">{data.unitNumber}</span>
              </div>
            </div>

            <button 
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
            >
              <CreditCard className="w-5 h-5" />
              Pay via K-Net
            </button>
          </div>

          {/* Transparency Footer (Article 4 & 12) */}
          <div className="bg-zinc-100 p-4 text-xs text-zinc-500 border-t border-zinc-200">
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="w-full">
                <p className="font-bold text-zinc-700 mb-1 flex items-center gap-1">
                  Verified Merchant (MOCI Compliant)
                  {data.mociLicenseNumber && <span className="text-emerald-600">✓</span>}
                </p>
                <p>Trade Name: {data.landlordName}</p>
                <p>MOCI License: {data.mociLicenseNumber || 'Pending Verification'}</p>
                <a 
                  href="https://moci.gov.kw/en/services/consumer-protection/" 
                  target="_blank" 
                  rel="noreferrer"
                  className="block mt-2 text-center text-blue-600 font-bold hover:underline bg-blue-50 py-1.5 rounded"
                >
                  Report a Violation to MOCI Digital Committee
                </a>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}
