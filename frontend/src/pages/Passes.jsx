import { useState } from 'react';
import api, { downloadPdf } from '../services/api';
import FilterBar from '../components/FilterBar';
import useFilteredList from '../hooks/useFilteredList';
import { Alert, EmptyRow, PageHeader, StatusBadge } from '../components/ui';

const PASS_STATUSES = ['active', 'used', 'expired', 'revoked'];

const Passes = () => {
  const { items: passes, filters, setFilter, resetFilters, isFiltered, loading, error, reload } =
    useFilteredList('/passes', { search: '', status: '', from: '', to: '' });
  const [actionError, setActionError] = useState('');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const canRevoke = ['admin', 'security'].includes(user.role);

  const handleDownload = async (pass) => {
    setActionError('');
    try {
      await downloadPdf(`/passes/${pass._id}/pdf`, `${pass.passNumber}.pdf`);
    } catch {
      setActionError('Unable to download the PDF pass');
    }
  };

  const handleRevoke = async (pass) => {
    if (!window.confirm(`Revoke pass ${pass.passNumber}? It can no longer be used for check-in.`)) return;
    setActionError('');
    try {
      await api.put(`/passes/${pass._id}/status`, { status: 'revoked' });
      await reload();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to revoke pass');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Passes"
        description="Passes are issued from Visitors (register & issue) or when a visitor request is approved."
      />

      <Alert>{actionError}</Alert>

      <div className="card overflow-hidden">
        <div className="card-header">
          <h2 className="card-title">Issued passes</h2>
        </div>
        <FilterBar
          filters={filters}
          onChange={setFilter}
          onReset={resetFilters}
          isFiltered={isFiltered}
          searchPlaceholder="Search pass number or visitor"
          statusOptions={PASS_STATUSES}
          dateLabel="Valid"
          resultCount={loading ? undefined : passes.length}
        />
        {error && <div className="p-5"><Alert>{error}</Alert></div>}
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Pass number</th><th>Visitor</th><th>Status</th><th>Valid from</th><th>Valid until</th><th className="text-right">Action</th></tr>
            </thead>
            <tbody>
              {passes.map((pass) => (
                <tr key={pass._id}>
                  <td className="font-mono text-xs font-semibold text-ink">{pass.passNumber}</td>
                  <td className="font-medium text-ink">{pass.visitor?.name || pass.visitor}</td>
                  <td><StatusBadge status={pass.status} /></td>
                  <td>{new Date(pass.validFrom).toLocaleString()}</td>
                  <td>{new Date(pass.validUntil).toLocaleString()}</td>
                  <td className="text-right">
                    <div className="inline-flex gap-2">
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleDownload(pass)}>PDF</button>
                      {canRevoke && pass.status === 'active' && (
                        <button type="button" className="btn btn-danger-outline btn-sm" onClick={() => handleRevoke(pass)}>Revoke</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && passes.length === 0 && (
                <EmptyRow colSpan={6}>{isFiltered ? 'No passes match these filters.' : 'No passes issued yet.'}</EmptyRow>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Passes;
