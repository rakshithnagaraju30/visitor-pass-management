import { useEffect, useState } from 'react';
import api from '../services/api';

const CheckLogs = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await api.get('/check-logs');
        setLogs(response.data);
      } catch (error) {
        window.alert(error.response?.data?.message || 'Failed to load check logs');
      }
    };
    fetchLogs();
  }, []);

  return (
    <div>
      <h1>Check Logs</h1>
      <div className="table-card">
        <table>
          <thead><tr><th>Visitor</th><th>Pass</th><th>Action</th><th>Scanned By</th><th>Time</th></tr></thead>
          <tbody>{logs.map((log) => (
            <tr key={log._id}>
              <td>{log.visitor?.name || log.visitor}</td>
              <td>{log.pass?.passNumber || log.pass}</td>
              <td>{log.action}</td>
              <td>{log.scannedBy?.name || log.scannedBy}</td>
              <td>{log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
};

export default CheckLogs;