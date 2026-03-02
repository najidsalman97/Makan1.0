import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/HarisResidentLog.css';

interface ResidentContact {
  id: string;
  buildingId: string;
  unitNumber: string;
  tenantName: string;
  contactType: 'phone_call' | 'physical_visit' | 'message' | 'reminder';
  notes: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'follow_up_needed';
  proofOfPresence?: {
    gpsCoords: string;
    photoUrl?: string;
    timestamp: string;
  };
}

const HarisResidentLog: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [contacts, setContacts] = useState<ResidentContact[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [buildings, setBuildings] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    unitNumber: '',
    tenantName: '',
    contactType: 'physical_visit' as const,
    notes: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [buildingsRes, contactsRes] = await Promise.all([
          fetch('/api/haris/buildings', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          }),
          fetch('/api/haris/resident-log', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          }),
        ]);

        const buildingsData = await buildingsRes.json();
        const contactsData = await contactsRes.json();

        setBuildings(buildingsData.buildings);
        setContacts(contactsData.contacts);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddContact = async () => {
    if (!selectedBuilding || !formData.tenantName || !formData.unitNumber) {
      alert(t('validation.requiredFields'));
      return;
    }

    try {
      const response = await fetch('/api/haris/resident-log', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          buildingId: selectedBuilding,
          ...formData,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const newContact = await response.json();
        setContacts([...contacts, newContact]);
        setFormData({
          unitNumber: '',
          tenantName: '',
          contactType: 'physical_visit',
          notes: '',
        });
        setShowForm(false);
      }
    } catch (error) {
      console.error('Error adding contact:', error);
    }
  };

  const getContactTypeIcon = (type: string): string => {
    const icons: Record<string, string> = {
      phone_call: '☎',
      physical_visit: '👤',
      message: '💬',
      reminder: '🔔',
    };
    return icons[type] || '•';
  };

  const getStatusBadge = (status: string): string => {
    const badges: Record<string, string> = {
      completed: '✓ Completed',
      pending: '⏳ Pending',
      follow_up_needed: '⚠ Follow-up',
    };
    return badges[status] || status;
  };

  const filteredContacts = selectedBuilding
    ? contacts.filter((c) => c.buildingId === selectedBuilding)
    : contacts;

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  return (
    <div className={`haris-resident-log ${i18n.language === 'ar' ? 'rtl' : 'ltr'}`}>
      <h1>{t('haris.residentLog')}</h1>

      {/* Building Filter */}
      <div className="section-header">
        <div className="filter-group">
          <label>{t('common.building')}:</label>
          <select
            value={selectedBuilding}
            onChange={(e) => setSelectedBuilding(e.target.value)}
          >
            <option value="">{t('common.allBuildings')}</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? t('common.cancel') : t('common.addContact')}
        </button>
      </div>

      {/* Add Contact Form */}
      {showForm && (
        <div className="form-container">
          <div className="form-group">
            <label>{t('common.unitNumber')}:</label>
            <input
              type="text"
              value={formData.unitNumber}
              onChange={(e) =>
                setFormData({ ...formData, unitNumber: e.target.value })
              }
              placeholder={t('placeholder.unitNumber')}
            />
          </div>

          <div className="form-group">
            <label>{t('common.tenantName')}:</label>
            <input
              type="text"
              value={formData.tenantName}
              onChange={(e) =>
                setFormData({ ...formData, tenantName: e.target.value })
              }
              placeholder={t('placeholder.tenantName')}
            />
          </div>

          <div className="form-group">
            <label>{t('haris.contactType')}:</label>
            <select
              value={formData.contactType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  contactType: e.target.value as any,
                })
              }
            >
              <option value="phone_call">{t('haris.phoneCall')}</option>
              <option value="physical_visit">{t('haris.physicalVisit')}</option>
              <option value="message">{t('haris.message')}</option>
              <option value="reminder">{t('haris.reminder')}</option>
            </select>
          </div>

          <div className="form-group">
            <label>{t('common.notes')}:</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder={t('placeholder.notes')}
              rows={3}
            />
          </div>

          <button className="btn-primary" onClick={handleAddContact}>
            {t('common.save')}
          </button>
        </div>
      )}

      {/* Contacts List */}
      <div className="contacts-list">
        {filteredContacts.map((contact) => (
          <div key={contact.id} className="contact-card">
            <div className="contact-header">
              <div className="contact-icon">
                {getContactTypeIcon(contact.contactType)}
              </div>
              <div className="contact-info">
                <h4>{contact.tenantName}</h4>
                <p className="unit">{t('common.unit')} {contact.unitNumber}</p>
              </div>
              <div className="contact-status">
                <span className={`badge ${contact.status}`}>
                  {getStatusBadge(contact.status)}
                </span>
              </div>
            </div>

            <div className="contact-body">
              <p className="notes">{contact.notes}</p>
              <div className="contact-meta">
                <span className="timestamp">
                  {new Date(contact.timestamp).toLocaleString(i18n.language)}
                </span>
              </div>

              {contact.proofOfPresence && (
                <div className="proof-of-presence">
                  <strong>{t('haris.proofOfPresence')}:</strong>
                  <p className="gps">📍 {contact.proofOfPresence.gpsCoords}</p>
                  {contact.proofOfPresence.photoUrl && (
                    <img
                      src={contact.proofOfPresence.photoUrl}
                      alt="Proof"
                      className="proof-photo"
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HarisResidentLog;
