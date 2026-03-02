import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, CheckCircle2, ArrowRight, Loader, AlertCircle, Plus } from 'lucide-react';

interface BuildingData {
  paciNumber: string;
  address: string;
  units: number;
  defaultRentKwd: number;
  defaultManagementFeeKwd: number;
}

export default function LandlordOnboarding() {
  const { t, i18n } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [paciLookupQuery, setPaciLookupQuery] = useState('');
  const [foundBuildings, setFoundBuildings] = useState<BuildingData[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingData | null>(null);
  const [bulkUnits, setBulkUnits] = useState<Array<{ unitNumber: string; rent: number }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [completedSteps, setCompletedSteps] = useState({});

  const searchPaciBuilding = async () => {
    if (!paciLookupQuery.trim()) {
      alert('Please enter a PACI Building ID');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/landlord/paci-lookup/${paciLookupQuery}`);
      const data = await response.json();

      if (data.buildings && data.buildings.length > 0) {
        setFoundBuildings(data.buildings);
        setCompletedSteps((prev) => ({ ...prev, 1: true }));
      } else {
        alert('No buildings found with that PACI ID');
      }
    } catch (error) {
      console.error('Error looking up PACI building:', error);
      alert('Failed to look up PACI building');
    } finally {
      setIsLoading(false);
    }
  };

  const selectBuilding = (building: BuildingData) => {
    setSelectedBuilding(building);
    setCurrentStep(3);
    setCompletedSteps((prev) => ({ ...prev, 2: true }));
  };

  const addUnitRow = () => {
    setBulkUnits([...bulkUnits, { unitNumber: '', rent: selectedBuilding?.defaultRentKwd || 0 }]);
  };

  const updateUnitRow = (index: number, field: string, value: any) => {
    const updated = [...bulkUnits];
    updated[index][field as keyof typeof updated[0]] = value;
    setBulkUnits(updated);
  };

  const completeBulkAddition = async () => {
    if (bulkUnits.length === 0) {
      alert('Please add at least one unit');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/landlord/add-bulk-units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buildingPaci: selectedBuilding?.paciNumber,
          units: bulkUnits,
        }),
      });

      if (response.ok) {
        setCompletedSteps((prev) => ({ ...prev, 3: true }));
        setCurrentStep(4);
      }
    } catch (error) {
      console.error('Error adding units:', error);
      alert('Failed to add units');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-slate-900 flex items-center justify-center gap-3 mb-2">
            <Building2 className="w-8 h-8 text-emerald-600" />
            Portfolio Onboarding Wizard
          </h1>
          <p className="text-slate-600">Set up your properties in Makan in 4 easy steps</p>
        </div>

        {currentStep === 1 && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <span className="text-xl font-bold text-emerald-600">1</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">PACI Building Lookup</h2>
                <p className="text-slate-600 text-sm">Search your building by PACI ID</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Enter PACI Building ID
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={paciLookupQuery}
                    onChange={(e) => setPaciLookupQuery(e.target.value)}
                    placeholder="e.g., 3KW2024001"
                    className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <button
                    onClick={searchPaciBuilding}
                    disabled={isLoading}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center gap-2"
                  >
                    {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                    Search
                  </button>
                </div>
              </div>

              {foundBuildings.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-bold text-slate-900 mb-3">Found Buildings:</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {foundBuildings.map((building) => (
                      <div
                        key={building.paciNumber}
                        className="border-2 border-slate-200 rounded-lg p-4 cursor-pointer hover:border-emerald-600 hover:bg-emerald-50 transition-all"
                        onClick={() => selectBuilding(building)}
                      >
                        <p className="font-bold text-slate-900">{building.address}</p>
                        <p className="text-sm text-slate-600">PACI: {building.paciNumber}</p>
                        <p className="text-sm text-slate-600">{building.units} units available</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === 3 && selectedBuilding && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-xl font-bold text-purple-600">3</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Add Units</h2>
                <p className="text-slate-600 text-sm">Bulk create units with rent amounts</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-slate-200">
                      <th className="text-left py-3 px-4 font-bold text-slate-900">Unit Number</th>
                      <th className="text-left py-3 px-4 font-bold text-slate-900">Monthly Rent (KWD)</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkUnits.map((unit, index) => (
                      <tr key={index} className="border-b border-slate-100">
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={unit.unitNumber}
                            onChange={(e) => updateUnitRow(index, 'unitNumber', e.target.value)}
                            placeholder="e.g., A-101"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            value={unit.rent}
                            onChange={(e) => updateUnitRow(index, 'rent', parseFloat(e.target.value))}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => setBulkUnits(bulkUnits.filter((_, i) => i !== index))}
                            className="text-red-600 hover:text-red-700 font-bold"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                onClick={addUnitRow}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Unit Row
              </button>

              <button
                onClick={completeBulkAddition}
                disabled={isLoading || bulkUnits.length === 0}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                {isLoading ? 'Adding Units...' : 'Add All Units'}
              </button>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl shadow-lg p-12 text-center border-2 border-emerald-500">
            <CheckCircle2 className="w-20 h-20 text-emerald-600 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Setup Complete! 🎉</h2>
            <p className="text-slate-700 text-lg mb-8">
              Your portfolio is now set up in Makan. Start managing your properties!
            </p>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => window.location.href = '/landlord'}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-lg transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
