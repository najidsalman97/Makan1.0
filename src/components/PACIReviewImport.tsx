import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, AlertCircle, Loader, Copy, Link2 } from 'lucide-react';

interface Property {
  building_id: string;
  area: string;
  block: string;
  street: string;
  unit_number: string;
  property_type: string;
}

interface ExistingProperty {
  id: number;
  name: string;
  address: string;
}

interface PACIReviewImportProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Property[];
  landlordId: number;
  transactionId: string;
}

export default function PACIReviewImport({
  isOpen,
  onClose,
  properties,
  landlordId,
  transactionId
}: PACIReviewImportProps) {
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set());
  const [existingProperties, setExistingProperties] = useState<ExistingProperty[]>([]);
  const [conflicts, setConflicts] = useState<Map<string, ExistingProperty>>(new Map());
  const [conflictActions, setConflictActions] = useState<Map<string, 'link' | 'update'>>(new Map());
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string>('');

  useEffect(() => {
    if (isOpen && properties.length > 0) {
      // Check for conflicts with existing properties
      checkForConflicts();
    }
  }, [isOpen, properties]);

  const checkForConflicts = async () => {
    try {
      const res = await fetch(`/api/landlord/${landlordId}/buildings`);
      const result = await res.json();
      
      if (result.success) {
        setExistingProperties(result.buildings);
        
        // Check which PACI properties already exist in our system
        const conflictMap = new Map<string, ExistingProperty>();
        properties.forEach(prop => {
          const existing = result.buildings.find(
            (b: any) => b.paciNumber === prop.building_id
          );
          if (existing) {
            conflictMap.set(prop.building_id, existing);
          }
        });
        setConflicts(conflictMap);
      }
    } catch (err) {
      console.error('Error checking for conflicts:', err);
    }
  };

  const toggleSelectProperty = (buildingId: string) => {
    const newSelected = new Set(selectedProperties);
    if (newSelected.has(buildingId)) {
      newSelected.delete(buildingId);
    } else {
      newSelected.add(buildingId);
    }
    setSelectedProperties(newSelected);
  };

  const selectAllProperties = () => {
    if (selectedProperties.size === properties.length) {
      setSelectedProperties(new Set());
    } else {
      setSelectedProperties(new Set(properties.map(p => p.building_id)));
    }
  };

  const setConflictAction = (buildingId: string, action: 'link' | 'update') => {
    const newActions = new Map(conflictActions);
    newActions.set(buildingId, action);
    setConflictActions(newActions);
  };

  const handleImport = async () => {
    if (selectedProperties.size === 0) {
      setImportResult({ success: false, message: 'Please select at least one property to import' });
      return;
    }

    setIsImporting(true);

    try {
      const propertiesToImport = properties.filter(p => selectedProperties.has(p.building_id));
      
      const res = await fetch('/api/properties/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          landlordId,
          transactionId,
          properties: propertiesToImport,
          conflicts: Object.fromEntries(conflictActions)
        })
      });

      const result = await res.json();
      
      if (result.success) {
        setImportResult({
          success: true,
          message: `Successfully imported ${result.importedCount} properties. ${result.linkedCount} properties were linked to existing records.`
        });
        
        // Close after success
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setImportResult({
          success: false,
          message: result.message || 'Import failed'
        });
      }
    } catch (err) {
      setImportResult({
        success: false,
        message: 'Failed to import properties'
      });
      console.error(err);
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen || properties.length === 0) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 flex items-center justify-between p-6 border-b border-zinc-200 bg-white">
            <div>
              <h2 className="text-xl font-bold text-zinc-900">Review & Import Properties</h2>
              <p className="text-xs text-zinc-500 mt-1">
                Found {properties.length} properties in PACI registry
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {importResult && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg border ${
                  importResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  {importResult.success ? (
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  )}
                  <p className="text-sm">{importResult.message}</p>
                </div>
              </motion.div>
            )}

            {/* Select All Checkbox */}
            {!importResult && (
              <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                <input
                  type="checkbox"
                  checked={selectedProperties.size === properties.length && properties.length > 0}
                  onChange={selectAllProperties}
                  className="w-5 h-5 rounded border-zinc-300 cursor-pointer"
                />
                <label className="text-sm font-medium text-zinc-700 cursor-pointer flex-1">
                  Select All Properties ({selectedProperties.size}/{properties.length})
                </label>
              </div>
            )}

            {/* Properties List */}
            {!importResult && (
              <div className="space-y-3">
                {properties.map((prop, idx) => {
                  const isConflict = conflicts.has(prop.building_id);
                  const existingProp = conflicts.get(prop.building_id);
                  const isSelected = selectedProperties.has(prop.building_id);
                  const conflictAction = conflictActions.get(prop.building_id);

                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`p-4 border rounded-lg transition-all ${
                        isSelected
                          ? 'border-blue-300 bg-blue-50'
                          : 'border-zinc-200 bg-white hover:border-zinc-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            if (isConflict && !conflictAction) {
                              // Require conflict resolution before selecting
                              alert('Please resolve the conflict first');
                            } else {
                              toggleSelectProperty(prop.building_id);
                            }
                          }}
                          disabled={isConflict && !conflictAction}
                          className="w-5 h-5 rounded border-zinc-300 cursor-pointer mt-1 disabled:opacity-50"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-zinc-900">
                                {prop.area}, Block {prop.block}
                              </p>
                              <p className="text-xs text-zinc-500 mt-1">
                                Street: {prop.street} | Unit: {prop.unit_number} | Type: {prop.property_type}
                              </p>
                              <p className="text-xs text-zinc-400 mt-2 font-mono">
                                PACI ID: {prop.building_id}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(prop.building_id);
                                setCopiedId(prop.building_id);
                                setTimeout(() => setCopiedId(''), 2000);
                              }}
                              className="text-zinc-400 hover:text-zinc-600 flex-shrink-0"
                            >
                              {copiedId === prop.building_id ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>

                          {/* Conflict Resolution */}
                          {isConflict && existingProp && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded"
                            >
                              <p className="text-xs font-semibold text-amber-900 mb-2 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" />
                                Conflict: Already exists in Makan
                              </p>
                              <p className="text-xs text-amber-800 mb-3">
                                Your system already has: <span className="font-semibold">{existingProp.name}</span> ({existingProp.address})
                              </p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setConflictAction(prop.building_id, 'link')}
                                  className={`flex-1 px-3 py-2 rounded text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                                    conflictAction === 'link'
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-white border border-blue-300 text-blue-600 hover:bg-blue-50'
                                  }`}
                                >
                                  <Link2 className="w-3 h-3" />
                                  Link Existing
                                </button>
                                <button
                                  onClick={() => setConflictAction(prop.building_id, 'update')}
                                  className={`flex-1 px-3 py-2 rounded text-xs font-semibold transition-all ${
                                    conflictAction === 'update'
                                      ? 'bg-amber-600 text-white'
                                      : 'bg-white border border-amber-300 text-amber-600 hover:bg-amber-50'
                                  }`}
                                >
                                  Update Record
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {!importResult && (
            <div className="sticky bottom-0 border-t border-zinc-200 bg-white p-4 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-zinc-300 text-zinc-700 font-semibold rounded-lg hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={isImporting || selectedProperties.size === 0}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isImporting ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  `Import ${selectedProperties.size} Properties`
                )}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
