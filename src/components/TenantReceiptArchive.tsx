import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Download, Search, Calendar } from 'lucide-react';

interface Receipt {
  id: string;
  leaseId: string;
  paymentDate: Date;
  amount: number;
  currency: string;
  month: string;
  year: number;
  status: 'paid' | 'pending' | 'disputed';
  pdfUrl: string;
  referenceNumber: string;
}

export default function TenantReceiptArchive() {
  const { t, i18n } = useTranslation();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [filteredReceipts, setFilteredReceipts] = useState<Receipt[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    fetchReceipts();
  }, []);

  useEffect(() => {
    filterReceipts();
  }, [receipts, searchTerm, selectedMonth, selectedYear]);

  const fetchReceipts = async () => {
    try {
      const response = await fetch('/api/tenant/receipt-archive');
      const data = await response.json();
      setReceipts(data.receipts || []);
    } catch (error) {
      console.error('Error fetching receipts:', error);
    }
  };

  const filterReceipts = () => {
    let filtered = receipts;

    if (searchTerm) {
      filtered = filtered.filter(
        (r) =>
          r.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.leaseId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedMonth) {
      filtered = filtered.filter((r) => r.month === selectedMonth);
    }

    if (selectedYear) {
      filtered = filtered.filter((r) => r.year === selectedYear);
    }

    setFilteredReceipts(filtered);
  };

  const downloadReceipt = async (receipt: Receipt, language: 'en' | 'ar' = 'en') => {
    try {
      const response = await fetch(`/api/tenant/receipt-pdf/${receipt.id}?lang=${language}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Receipt_${receipt.referenceNumber}_${language}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading receipt:', error);
    }
  };

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const getPaidAmount = () => receipts.filter((r) => r.status === 'paid').reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8 text-blue-600" />
            Receipt Archive
          </h1>
          <p className="text-slate-600">5-year searchable rent payment history</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 shadow border-l-4 border-emerald-500">
            <p className="text-sm text-slate-500 uppercase font-semibold">Paid</p>
            <p className="text-2xl font-bold text-emerald-600">{getPaidAmount().toLocaleString()} KWD</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-900 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Reference number or lease ID..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">All Months</option>
                {months.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {filteredReceipts.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center border border-slate-200">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-semibold">No receipts found</p>
            </div>
          ) : (
            filteredReceipts.map((receipt) => (
              <div
                key={receipt.id}
                className="bg-white rounded-lg p-4 shadow hover:shadow-lg transition-shadow border-l-4 border-blue-500"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <p className="font-mono text-sm text-slate-500">{receipt.referenceNumber}</p>
                    </div>
                    <p className="text-slate-900 font-semibold">
                      {receipt.month} {receipt.year}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm text-slate-500">Amount</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {receipt.amount.toLocaleString()} {receipt.currency}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => downloadReceipt(receipt, 'en')}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-1 transition-colors text-sm"
                      >
                        <Download className="w-4 h-4" />
                        EN
                      </button>
                      <button
                        onClick={() => downloadReceipt(receipt, 'ar')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-1 transition-colors text-sm"
                      >
                        <Download className="w-4 h-4" />
                        AR
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
