import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import api from '../services/api';

const CheckLogs = () => {
  const [checkLogs, setCheckLogs] = useState([]);
  const [passNumber, setPassNumber] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const fetchLogs = async () => {
    try {
      const response = await api.get('/check-logs');
      setCheckLogs(Array.isArray(response.data) ? response.data : []);
    } catch (err) { setError(err.response?.data?.message || 'Failed to load check logs'); }
  };

  useEffect(() => {
    fetchLogs();
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
      await fetchLogs();
      setPassNumber('');
    } catch (err) { setError(err.response?.data?.message || 'Unable to record check event'); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <h1>Security Check-in / Check-out</h1>
      <div className="form-card">
        <h2>Scan visitor pass</h2>
        <p className="muted">Allow camera access, scan the visitor QR code, then select the correct action. You can also enter the pass number manually.</p>
        <div id="vpm-qr-reader" className="qr-reader" />
        <label htmlFor="passNumber">Pass number</label>
        <input id="passNumber" value={passNumber} onChange={(event) => setPassNumber(event.target.value)} placeholder="VPM-..." />
        <div className="action-row">
          <button type="button" disabled={busy} onClick={() => recordAction('check-in')}>{busy ? 'Processing...' : 'Check-in'}</button>
          <button type="button" disabled={busy} onClick={() => recordAction('check-out')}>Check-out</button>
        </div>
        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}
      </div>
      <div className="table-card">
        <h2>Recent check logs</h2>
        <table>
          <thead><tr><th>Visitor</th><th>Pass</th><th>Action</th><th>Scanned by</th><th>Time</th></tr></thead>
          <tbody>{checkLogs.map((log) => (
            <tr key={log._id}>
              <td>{log.visitor?.name || '—'}</td>
              <td>{log.pass?.passNumber || '—'}</td>
              <td>{log.action}</td>
              <td>{log.scannedBy?.name || '—'}</td>
              <td>{log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
};
export default CheckLogs;
