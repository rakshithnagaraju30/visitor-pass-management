import { NavLink, useNavigate } from 'react-router-dom';
import { Logo } from './ui';

// Shell for the visitor portal: top bar with navigation and logout
const VisitorLayout = ({ children }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/visitor/login');
  };

  const linkClass = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-ink'}`;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Logo to="/visitor/dashboard" />
          <nav className="ml-2 hidden gap-1 sm:flex" aria-label="Visitor">
            <NavLink to="/visitor/dashboard" className={linkClass}>My appointments</NavLink>
            <NavLink to="/visitor/appointments" className={linkClass}>Book a visit</NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm font-medium text-slate-600 md:inline">{user.name}</span>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleLogout}>Logout</button>
          </div>
        </div>
        <nav className="flex gap-1 border-t border-slate-100 px-4 py-2 sm:hidden" aria-label="Visitor">
          <NavLink to="/visitor/dashboard" className={linkClass}>My appointments</NavLink>
          <NavLink to="/visitor/appointments" className={linkClass}>Book a visit</NavLink>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
};

export default VisitorLayout;
