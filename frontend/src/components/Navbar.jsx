import { useNavigate } from 'react-router-dom';

const Navbar = ({ onMenu }) => {
  const navigate = useNavigate();
  let user = {};
  let organization = {};

  try {
    user = JSON.parse(localStorage.getItem('user') || '{}');
    organization = JSON.parse(localStorage.getItem('organization') || '{}');
  } catch {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('organization');
  }

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('organization');
    navigate('/', { replace: true });
  };

  const initials = (user.name || 'U')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
      <button type="button" className="btn btn-ghost -ml-2 p-2 lg:hidden" onClick={onMenu} aria-label="Open menu">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{organization.name || 'Visitor Pass Management'}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold leading-tight text-ink">{user.name || 'User'}</p>
          <p className="text-xs capitalize text-slate-500">{user.role}</p>
        </div>
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700" aria-hidden="true">
          {initials}
        </span>
        <button type="button" className="btn btn-secondary btn-sm" onClick={logout}>
          Logout
        </button>
      </div>
    </header>
  );
};

export default Navbar;
