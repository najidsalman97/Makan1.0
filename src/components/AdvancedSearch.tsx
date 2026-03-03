import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/AdvancedSearch.css';

interface SearchResult {
  id: string;
  type: 'tenant' | 'lease' | 'payment' | 'maintenance' | 'dispute' | 'building' | 'unit';
  title: string;
  subtitle?: string;
  date?: string;
  amount?: number;
  status?: string;
}

interface SavedFilter {
  id: string;
  name: string;
  filters: Record<string, any>;
}

const AdvancedSearch: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    entityType: 'all',
    dateFrom: '',
    dateTo: '',
    status: 'all',
    amountFrom: '',
    amountTo: '',
  });
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);

  const handleSearch = async () => {
    if (!searchQuery && Object.values(filters).every((v) => !v || v === 'all')) {
      alert(t('validation.enterSearchTermOrFilter'));
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('q', searchQuery);
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          params.append(key, value);
        }
      });

      const response = await fetch(`/api/search?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();
      setResults(data.results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFilter = async () => {
    const filterName = prompt(t('common.filterName'));
    if (!filterName) return;

    try {
      const response = await fetch('/api/search/filters', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: filterName,
          filters,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSavedFilters([...savedFilters, data.filter]);
      }
    } catch (error) {
      console.error('Error saving filter:', error);
    }
  };

  const handleLoadFilter = (savedFilter: SavedFilter) => {
    setFilters(savedFilter.filters);
  };

  const handleExportResults = () => {
    const fileContent = results.map(r => `${r.type},${r.title},"${r.subtitle || ''}","${r.date || ''}","${r.status || ''}"`).join('\n');
    const csv = 'Type,Title,Subtitle,Date,Status\n' + fileContent;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'search-results.csv';
    link.click();
  };

  const getResultIcon = (type: string): string => {
    const icons: Record<string, string> = {
      tenant: '👤',
      lease: '📋',
      payment: '💰',
      maintenance: '🔧',
      dispute: '⚖️',
      building: '🏢',
      unit: '🚪',
    };
    return icons[type] || '•';
  };

  return (
    <div className={`advanced-search ${i18n.language === 'ar' ? 'rtl' : 'ltr'}`}>
      <h1>🔍 {t('common.advancedSearch')}</h1>

      {/* Search Bar */}
      <div className="search-bar">
        <input
          type="text"
          placeholder={t('placeholder.searchAll')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button className="btn-search" onClick={handleSearch}>
          🔍 {t('common.search')}
        </button>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <h3>{t('common.filters')}</h3>
        <div className="filters-grid">
          <select
            value={filters.entityType}
            onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
          >
            <option value="all">{t('common.allTypes')}</option>
            <option value="tenant">{t('common.tenants')}</option>
            <option value="lease">{t('common.leases')}</option>
            <option value="payment">{t('common.payments')}</option>
          </select>

          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            placeholder={t('common.dateFrom')}
          />

          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            placeholder={t('common.dateTo')}
          />

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="all">{t('common.allStatus')}</option>
            <option value="active">{t('common.active')}</option>
            <option value="inactive">{t('common.inactive')}</option>
          </select>
        </div>

        <div className="filter-actions">
          <button className="btn-secondary" onClick={handleSaveFilter}>
            💾 {t('common.saveFilter')}
          </button>
          <button className="btn-secondary" onClick={() => setFilters({
            entityType: 'all',
            dateFrom: '',
            dateTo: '',
            status: 'all',
            amountFrom: '',
            amountTo: '',
          })}>
            🔄 {t('common.resetFilters')}
          </button>
        </div>
      </div>

      {/* Saved Filters */}
      {savedFilters.length > 0 && (
        <div className="saved-filters">
          <h3>{t('common.savedFilters')}</h3>
          <div className="filter-tags">
            {savedFilters.map((sf) => (
              <button
                key={sf.id}
                className="filter-tag"
                onClick={() => handleLoadFilter(sf)}
              >
                {sf.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      <div className="results-section">
        <h3>
          {t('common.results')} ({results.length})
        </h3>

        {results.length > 0 && (
          <button className="btn-export" onClick={handleExportResults}>
            📥 {t('common.exportResults')}
          </button>
        )}

        <div className="results-list">
          {loading ? (
            <p>{t('common.searching')}</p>
          ) : results.length > 0 ? (
            results.map((result) => (
              <div key={result.id} className="result-item">
                <span className="icon">{getResultIcon(result.type)}</span>
                <div className="result-info">
                  <h4>{result.title}</h4>
                  {result.subtitle && <p>{result.subtitle}</p>}
                </div>
                {result.date && <small>{result.date}</small>}
                {result.status && (
                  <span className="status-badge">{result.status}</span>
                )}
              </div>
            ))
          ) : (
            <p>{t('common.noResults')}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedSearch;
