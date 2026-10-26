import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Analytics from '../components/Analytics';
import { Alert, PageHeader } from '../components/ui';

const Dashboard = () => {
  const [stats, setStats] = useState({
    visitors: 0,
    appointments: 0,
    activePasses: 0,
    checkLogs: 0,
    pendingAppointments: 0,
    currentlyInside: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const user = JSON.parse(
    localStorage.getItem('user') || '{}'
  );

  useEffect(() => {
    let mounted = true;

    const loadDashboardStats = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await api.get('/dashboard/stats');

        if (mounted) {
          setStats({
            visitors: response.data.visitors ?? 0,
            appointments: response.data.appointments ?? 0,
            activePasses: response.data.activePasses ?? 0,
            checkLogs: response.data.checkLogs ?? 0,
            pendingAppointments:
              response.data.pendingAppointments ?? 0,
            currentlyInside: response.data.currentlyInside ?? 0,
          });
        }
      } catch (err) {
        if (mounted) {
          setError(
            err.response?.data?.message ||
              'Could not load dashboard statistics'
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadDashboardStats();

    return () => {
      mounted = false;
    };
  }, []);

  const canReviewAppointments = ['admin', 'employee'].includes(user.role);
  const canViewLogs = ['admin', 'security'].includes(user.role);

  const cards = [
    { title: 'Total visitors', count: stats.visitors, path: '/visitors', label: 'View / register' },
    canReviewAppointments && { title: 'Appointments', count: stats.appointments, path: '/appointments', label: 'View appointments' },
    { title: 'Active passes', count: stats.activePasses, path: '/passes', label: 'View passes' },
    canViewLogs && { title: 'Visitors on site', count: stats.currentlyInside, path: '/check-logs', label: 'View check-ins' },
    canViewLogs && { title: 'Check-in / out logs', count: stats.checkLogs, path: '/check-logs', label: 'View logs' },
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${user.name || 'User'}. Here is what is happening today.`}
      />

      <Alert>{error}</Alert>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
        {cards.map(({ title, count, path, label }) => (
          <div className="card flex flex-col p-5" key={title}>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">{loading ? '—' : count}</p>
            <Link to={path} className="link mt-4 text-sm">{label} &rarr;</Link>
          </div>
        ))}
      </div>

      {canReviewAppointments && (
        <div className="card flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
            </span>
            <div>
              <h2 className="text-base font-semibold">Pending appointments</h2>
              <p className="text-sm text-slate-500">
                {loading
                  ? 'Loading...'
                  : `${stats.pendingAppointments} appointment${stats.pendingAppointments === 1 ? '' : 's'} waiting for review`}
              </p>
            </div>
          </div>
          <Link to="/appointments" className="btn btn-primary">Review appointments</Link>
        </div>
      )}

      {user.role === 'admin' && <Analytics />}
    </div>
  );
};

export default Dashboard;
