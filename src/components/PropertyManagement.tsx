import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Plus, Trash2, Edit2, Check, X as XIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface PropertyManagementProps {
  onClose?: () => void;
  isModal?: boolean;
}

interface Property {
  id: string;
  buildingName: string;
  address: string;
  paciNumber: string;
  totalUnits: number;
  occupiedUnits: number;
  monthlyRent: number;
  createdDate: string;
}

export default function PropertyManagement({ onClose, isModal = false }: PropertyManagementProps) {
  const { t, i18n } = useTranslation();
  const [properties, setProperties] = useState<Property[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    buildingName: '',
    address: '',
    paciNumber: '',
    totalUnits: '',
    monthlyRent: '',
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const response = await fetch('/api/landlord/properties', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      setProperties(data.properties || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/landlord/properties/${editingId}` : '/api/landlord/properties';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          buildingName: formData.buildingName,
          address: formData.address,
          paciNumber: formData.paciNumber,
          totalUnits: parseInt(formData.totalUnits),
          monthlyRent: parseFloat(formData.monthlyRent),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (editingId) {
          setProperties(properties.map((p) => (p.id === editingId ? data.property : p)));
        } else {
          setProperties([...properties, data.property]);
        }
        resetForm();
      }
    } catch (error) {
      console.error('Error saving property:', error);
      alert('Failed to save property');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return;

    try {
      await fetch(`/api/landlord/properties/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setProperties(properties.filter((p) => p.id !== id));
    } catch (error) {
      console.error('Error deleting property:', error);
      alert('Failed to delete property');
    }
  };

  const resetForm = () => {
    setFormData({
      buildingName: '',
      address: '',
      paciNumber: '',
      totalUnits: '',
      monthlyRent: '',
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (property: Property) => {
    setFormData({
      buildingName: property.buildingName,
      address: property.address,
      paciNumber: property.paciNumber,
      totalUnits: property.totalUnits.toString(),
      monthlyRent: property.monthlyRent.toString(),
    });
    setEditingId(property.id);
    setShowForm(true);
  };

  const containerClass = isModal ? 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4' : 'min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6';
  const contentClass = isModal ? 'bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto' : 'w-full';

  return (
    <div className={containerClass}>
      <div className={contentClass}>
        <div className="max-w-6xl mx-auto p-6" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3 mb-2">
                <Building2 className="w-8 h-8 text-blue-600" />
                {t('common.propertyManagement') || 'Property Management'}
              </h1>
              <p className="text-slate-600">Add and manage your rental properties</p>
            </div>
            {isModal && onClose && (
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <XIcon size={24} />
              </button>
            )}
          </div>

          {!showForm ? (
            <>
              <button
                onClick={() => setShowForm(true)}
                className="mb-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add New Property
              </button>

              {properties.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No properties added yet. Create your first property!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {properties.map((property) => (
                    <motion.div
                      key={property.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-bold text-slate-900">{property.buildingName}</h3>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(property)}
                            className="text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(property.id)}
                            className="text-red-600 hover:text-red-700 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="text-gray-600">Address</p>
                          <p className="font-semibold text-slate-900">{property.address}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">PACI Number</p>
                          <p className="font-semibold text-slate-900">{property.paciNumber}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-gray-600">Units</p>
                            <p className="font-semibold text-slate-900">{property.occupiedUnits}/{property.totalUnits}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Monthly Income</p>
                            <p className="font-semibold text-slate-900">{property.monthlyRent} KWD</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg shadow-lg p-8 max-w-2xl"
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                {editingId ? 'Edit Property' : 'Add New Property'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Building Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.buildingName}
                    onChange={(e) => setFormData({ ...formData, buildingName: e.target.value })}
                    placeholder="e.g., Al-Noor Tower"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Address *</label>
                  <textarea
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Full building address"
                    rows={2}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">PACI Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.paciNumber}
                    onChange={(e) => setFormData({ ...formData, paciNumber: e.target.value })}
                    placeholder="e.g., 1234567890"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">Total Units *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.totalUnits}
                      onChange={(e) => setFormData({ ...formData, totalUnits: e.target.value })}
                      placeholder="0"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">Monthly Income (KWD) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.monthlyRent}
                      onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    {isLoading ? 'Saving...' : (
                      <>
                        <Check className="w-5 h-5" />
                        {editingId ? 'Update Property' : 'Add Property'}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-slate-900 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <XIcon className="w-5 h-5" />
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
