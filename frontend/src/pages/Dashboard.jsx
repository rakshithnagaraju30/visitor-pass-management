import { Link } from 'react-router-dom';

const Dashboard = () => {
  let user = {};
  try {
    user = JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    user = {};
  }

  const cards = [
    ['Total Visitors', '120', '/visitors', 'View Visitors'],
    ['Appointments', '35', '/appointments', 'View Appointments'],
    ['Active Passes', '18', '/passes', 'View Passes'],
    ['Check Logs', '245', '/check-logs', 'View Logs'],
  ];

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user.name || 'User'}</p>
      <div className="dashboard-grid">
        {cards.map(([title, count, path, label]) => (
          <div className="dashboard-card" key={title}>
            <h3>{title}</h3>
            <h2>{count}</h2>
            <Link to={path}>{label}</Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;