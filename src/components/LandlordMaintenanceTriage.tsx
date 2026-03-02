import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Wrench, CheckCircle2, AlertTriangle, Loader, Zap, Users, TrendingUp, ArrowRight } from 'lucide-react';

interface MaintenanceTicket {
  id: string;
  leaseId: string;
  buildingId: string;
  description: string;
  aiClassification: 'Structural' | 'Usage/Tenant';
  severity: 'low' | 'medium' | 'high' | 'critical';
  reportedBy: string;
  reportedDate: Date;
  geoTag: any;
  status: 'pending' | 'approved' | 'reassigned' | 'info_requested';
  contractorAssigned?: string;
  estimatedCost?: number;
  photoUrl?: string;
}

export default function LandlordMaintenanceTriage() {
  const { t, i18n } = useTranslation();
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceTicket | null>(null);
  const [actions, setActions] = useState<Record<string, string>>({});
  const [contractors, setContractors] = useState<Array<{ id: string; name: string; specialty: string }>>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchTickets();
    fetchContractors();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await fetch('/api/landlord/maintenance-tickets');
      const data = await response.json();
      setTickets(data.tickets || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  const fetchContractors = async () => {
    try {
      const response = await fetch('/api/landlord/contractors');
      const data = await response.json();
      setContractors(data.contractors || []);
    } catch (error) {
      console.error('Error fetching contractors:', error);
    }
  };

  const handleAction = async (ticketId: string, action: string, contractorId?: string) => {
    setIsProcessing(true);

    try {
      const response = await fetch(`/api/landlord/maintenance-tickets/${ticketId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          contractorId,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setActions((prev) => ({ ...prev, [ticketId]: action }));
        fetchTickets();
      }
    } catch (error) {
      console.error('Error processing action:', error);
      alert('Failed to process action');
    } finally {
      setIsProcessing(false);
    }
  };

  const verifyProofOfPresence = async (ticket: MaintenanceTicket) => {
    if (!ticket.geoTag) {
      alert('No geo-tag data available');
      return;
    }

    try {
      const response = await fetch(`/api/haris/verify-geo-tag/${ticket.geoTag.id}`);
      const result = await response.json();

      if (result.verified) {
        alert(`✓ Proof of Presence Verified\nDistance: ${result.distance.toFixed(2)}m`);
      } else {
        alert(`✗ Proof of Presence DISPUTED\nDistance: ${result.distance.toFixed(2)}m`);
      }
    } catch (error) {
      console.error('Error verifying presence:', error);
    }
  };

  const severityColors: Record<string, string> = {
    critical: 'bg-red-100 text-red-800 border-red-300',
    high: 'bg-orange-100 text-orange-800 border-orange-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    low: 'bg-green-100 text-green-800 border-green-300',
  };

  const classificationColors: Record<string, string> = {
    'Structural': 'bg-red-50 border-red-200',
    'Usage/Tenant': 'bg-blue-50 border-blue-200',
  };

  const pendingTickets = tickets.filter((t) => t.status === 'pending');
  const processedTickets = tickets.filter((t) => t.status !== 'pending');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
            <Wrench className="w-8 h-8 text-orange-600" />
            Interactive Maintenance Triage
          </h1>
          <p className="text-slate-600 mt-2">
            AI-classified tickets with options to approve, reassign, or request more information
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 shadow flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Pending</p>
              <p className="text-2xl font-bold text-slate-900">{pendingTickets.length}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Critical</p>
              <p className="text-2xl font-bold text-slate-900">
                {tickets.filter((t) => t.severity === 'critical').length}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Structural</p>
              <p className="text-2xl font-bold text-slate-900">
                {tickets.filter((t) => t.aiClassification === 'Structural').length}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Processed</p>
              <p className="text-2xl font-bold text-slate-900">{processedTickets.length}</p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Pending Review ({pendingTickets.length})</h2>
          <div className="space-y-4">
            {pendingTickets.length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center border border-slate-200">
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900">All caught up!</h3>
                <p className="text-slate-600 mt-2">No pending maintenance tickets</p>
              </div>
            ) : (
              pendingTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                    selectedTicket?.id === ticket.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 bg-white hover:shadow-lg'
                  }`}
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <p className="font-mono text-xs text-slate-500 mb-1">Ticket #{ticket.id.substring(0, 8)}</p>
                      <h3 className="text-lg font-bold text-slate-900">{ticket.description}</h3>
                      <p className="text-sm text-slate-600 mt-2">Reported: {new Date(ticket.reportedDate).toLocaleDateString()}</p>
                      <p className="text-sm text-slate-600">By: {ticket.reportedBy}</p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-bold border ${classificationColors[ticket.aiClassification]}`}
                      >
                        {ticket.aiClassification === 'Structural' ? '🏢' : '👤'} {
                          ticket.aiClassification
                        }
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-bold border ${severityColors[ticket.severity]}`}
                      >
                        {ticket.severity.charAt(0).toUpperCase() + ticket.severity.slice(1)} Severity
                      </div>
                    </div>

                    {ticket.geoTag && (
                      <div>
                        <button
                          onClick={() => verifyProofOfPresence(ticket)}
                          className="w-full bg-purple-100 hover:bg-purple-200 text-purple-900 font-semibold py-2 px-3 rounded-lg text-sm transition-colors"
                        >
                          Verify Geo-Tag
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {selectedTicket && selectedTicket.status === 'pending' && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8 border-l-4 border-blue-500">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Take Action: {selectedTicket.id}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => handleAction(selectedTicket.id, 'approved')}
                disabled={isProcessing}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <CheckCircle2 className="w-5 h-5" />
                Approve
              </button>

              <div className="relative">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAction(selectedTicket.id, 'reassigned', e.target.value);
                    }
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg appearance-none cursor-pointer"
                >
                  <option value="">Reassign to Contractor</option>
                  {contractors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.specialty})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => handleAction(selectedTicket.id, 'info_requested')}
                disabled={isProcessing}
                className="bg-orange-600 hover:bg-orange-700 disabled:bg-slate-300 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <AlertTriangle className="w-5 h-5" />
                Request Info
              </button>
            </div>

            {selectedTicket.aiClassification === 'Structural' && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 font-semibold mb-2">Estimated Cost (Landlord Responsibility):</p>
                <p className="text-2xl font-bold text-red-600">
                  {selectedTicket.estimatedCost?.toLocaleString()} KWD
                </p>
              </div>
            )}
          </div>
        )}

        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Processed ({processedTickets.length})</h2>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {processedTickets.map((ticket) => (
              <div key={ticket.id} className="bg-white rounded-lg p-4 border border-slate-200 flex justify-between items-center">
                <div>
                  <p className="font-bold text-slate-900">{ticket.description}</p>
                  <p className="text-xs text-slate-500 capitalize">{ticket.status}</p>
                </div>
                <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">
                  {ticket.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
