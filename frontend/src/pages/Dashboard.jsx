import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({ visitors: 0, appointments: 0, activePasses: 0, checkLogs: 0, pendingAppointments: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    let mounted = true;
    api.get('/dashboard/stats')
      .then((response) => { if (mounted) setStats(response.data); })
      .catch((err) => { if (mounted) setError(err.response?.data?.message || 'Could not load dashboard statistics'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const cards = [
    ['Total Visitors', stats.visitors, '/visitors', 'View / Register'],
    ['Appointments', stats.appointments, '/appointments', 'View Appointments'],
    ['Active Passes', stats.activePasses, '/passes', 'View Passes'],
    ['Check-in / Check-out Logs', stats.checkLogs, '/check-logs', 'View Logs'],
  ];

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user.name || 'User'} ({user.role || 'role not set'})</p>
      {loading && <p>Loading statistics...</p>}
      {error && <p className="error-message">{error}</p>}
      <div className="dashboard-grid">
        {cards.map(([title, count, path, label]) => (
          <div className="dashboard-card" key={title}>
            <h3>{title}</h3>
            <h2>{loading ? '—' : count}</h2>
            <Link to={path}>{label}</Link>
          </div>
        ))}
      </div>
      <div className="table-card">
        <h2>Pending appointments</h2>
        <p>{loading ? 'Loading...' : stats.pendingAppointments}</p>
        <Link to="/appointments">Review appointments</Link>
      </div>
    </div>
  );
};
export default Dashboard;
