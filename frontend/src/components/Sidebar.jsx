import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();
  let user = {};

  try {
    user = JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    localStorage.removeItem('user');
  }

  const isActive = (path) => (location.pathname === path ? 'active' : '');

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h2>VisitorPass</h2>
        <p>Management System</p>
      </div>
      <nav>
        <Link className={isActive('/dashboard')} to="/dashboard">Dashboard</Link>
        {(user.role === 'admin' || user.role === 'security') && (
          <Link className={isActive('/visitors')} to="/visitors">Visitors</Link>
        )}
        {(user.role === 'admin' || user.role === 'employee') && (
          <Link className={isActive('/appointments')} to="/appointments">Appointments</Link>
        )}
        {(user.role === 'admin' || user.role === 'security') && (
          <Link className={isActive('/passes')} to="/passes">Passes</Link>
        )}
        {(user.role === 'admin' || user.role === 'security') && (
          <Link className={isActive('/check-logs')} to="/check-logs">Check Logs</Link>
        )}
        {user.role === 'admin' && (
          <Link className={isActive('/users')} to="/users">Users</Link>
        )}
        <Link className={isActive('/profile')} to="/profile">Profile</Link>
      </nav>
    </aside>
  );
};

export default Sidebar;