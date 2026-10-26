import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import api from '../services/api';
import FilterBar from '../components/FilterBar';
import useFilteredList from '../hooks/useFilteredList';
import { Alert, EmptyRow, Field, PageHeader, StatusBadge } from '../components/ui';

const CheckLogs = () => {
  const { items: checkLogs, filters, setFilter, resetFilters, isFiltered, loading: listLoading, error: listError, reload } =
    useFilteredList('/check-logs', { search: '', action: '', from: '', to: '' });
  const [passNumber, setPassNumber] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner('vpm-qr-reader', { fps: 10, qrbox: { width: 220, height: 220 } }, false);
    scanner.render((decodedText) => {
      try {
        const decoded = JSON.parse(decodedText);
        setPassNumber(decoded.passNumber || decodedText);
      } catch {
        setPassNumber(decodedText.trim());
      }
      setMessage('QR code scanned. Choose Check-in or Check-out.');
      setError('');
    }, () => {});
    return () => { scanner.clear().catch(() => {}); };
  }, []);

  const recordAction = async (action) => {
    if (!passNumber.trim()) { setError('Scan a pass QR code or enter a pass number first'); return; }
    setBusy(true); setError(''); setMessage('');
    try {
      const response = await api.post('/check-logs', { pass: passNumber.trim(), action });
      setMessage(response.data.message);
      await reload();
      setPassNumber('');
    } catch (err) { setError(err.response?.data?.message || 'Unable to record check event'); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Check-in / check-out" description="Scan a visitor pass at the entrance and on exit." />

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Scan visitor pass</h2>
        </div>
        <div className="card-body grid gap-6 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-sm text-slate-500">Allow camera access and point it at the QR code on the visitor&apos;s pass.</p>
            <div id="vpm-qr-reader" className="qr-reader" />
          </div>

          <div className="space-y-4">
            <Field id="passNumber" label="Pass number" hint="Filled in automatically after a scan, or type it manually.">
              <input id="passNumber" className="input font-mono" value={passNumber} onChange={(event) => setPassNumber(event.target.value)} placeholder="VPM-..." />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" className="btn btn-success" disabled={busy} onClick={() => recordAction('check-in')}>
                {busy ? 'Processing...' : 'Check-in'}
              </button>
              <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => recordAction('check-out')}>
                Check-out
              </button>
            </div>
            <Alert type="success">{message}</Alert>
            <Alert>{error}</Alert>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="card-header">
          <h2 className="card-title">Check logs</h2>
        </div>
        <FilterBar
          filters={filters}
          onChange={setFilter}
          onReset={resetFilters}
          isFiltered={isFiltered}
          searchPlaceholder="Search visitor or pass number"
          statusKey="action"
          statusLabel="Action"
          statusOptions={['check-in', 'check-out']}
          resultCount={listLoading ? undefined : checkLogs.length}
        />
        {listError && <div className="p-5"><Alert>{listError}</Alert></div>}
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Visitor</th><th>Pass</th><th>Action</th><th>Scanned by</th><th>Time</th></tr></thead>
            <tbody>
              {checkLogs.map((log) => (
                <tr key={log._id}>
                  <td className="font-medium text-ink">{log.visitor?.name || '—'}</td>
                  <td className="font-mono text-xs">{log.pass?.passNumber || '—'}</td>
                  <td><StatusBadge status={log.action} /></td>
                  <td>{log.scannedBy?.name || '—'}</td>
                  <td>{log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}</td>
                </tr>
              ))}
              {!listLoading && checkLogs.length === 0 && (
                <EmptyRow colSpan={5}>{isFiltered ? 'No check logs match these filters.' : 'No check logs yet.'}</EmptyRow>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default CheckLogs;
