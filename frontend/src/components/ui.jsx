import { Link, useNavigate } from 'react-router-dom';

// Small shared building blocks so every page uses the same look.

export const Logo = ({ to = '/', inverted = false }) => (
  <Link to={to} className="inline-flex items-center gap-2.5">
    <img
      src={`${process.env.PUBLIC_URL}/logo.png`}
      alt=""
      className="h-9 w-9 rounded-lg object-cover shadow-sm ring-1 ring-black/5"
    />
    <span className={`text-lg font-bold tracking-tight ${inverted ? 'text-white' : 'text-ink'}`}>VisitorPass</span>
  </Link>
);

export const PageHeader = ({ title, description, actions }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div>
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </div>
);

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
  approved: 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200',
  active: 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200',
  completed: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  used: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  'check-in': 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  'check-out': 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200',
  rejected: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200',
  revoked: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200',
  cancelled: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200',
  expired: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200',
  admin: 'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200',
  employee: 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200',
  security: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
};

export const StatusBadge = ({ status }) => (
  <span className={`badge ${STATUS_STYLES[status] || 'bg-slate-100 text-slate-600'}`}>
    {status ? status.charAt(0).toUpperCase() + status.slice(1) : ''}
  </span>
);

export const Alert = ({ type = 'error', children }) => {
  if (!children) return null;
  const className = { error: 'alert-error', success: 'alert-success', info: 'alert-info' }[type];
  return <div className={className} role={type === 'error' ? 'alert' : 'status'}>{children}</div>;
};

export const EmptyRow = ({ colSpan, children }) => (
  <tr>
    <td colSpan={colSpan} className="!py-10 text-center !text-slate-500">{children}</td>
  </tr>
);

// Centered card used by every sign-in / sign-up screen
export const AuthLayout = ({ title, subtitle, children, footer }) => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-brand-50/70 to-slate-50">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
          <span aria-hidden="true">&larr;</span> Back
        </button>
      </header>

      <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-6 sm:items-center sm:pt-0">
        <div className="card w-full max-w-md p-6 sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>}
          <div className="mt-6">{children}</div>
          {footer && <div className="mt-6 border-t border-slate-200 pt-5 text-center text-sm text-slate-500">{footer}</div>}
        </div>
      </main>
    </div>
  );
};

export const Field = ({ id, label, hint, children }) => (
  <div>
    <label htmlFor={id} className="label">{label}</label>
    {children}
    {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
  </div>
);
