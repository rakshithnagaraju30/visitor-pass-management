import { PageHeader, StatusBadge } from '../components/ui';

const Profile = () => {
  let user = {};
  let organization = {};
  try {
    user = JSON.parse(localStorage.getItem('user') || '{}');
    organization = JSON.parse(localStorage.getItem('organization') || '{}');
  } catch {
    user = {};
  }

  const initials = (user.name || 'U').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  const details = [
    ['Email', user.email || 'Not available'],
    ['Phone', user.phone || 'Not provided'],
    ['Organization', organization.name || 'Not available'],
    ['Organization ID', organization.slug || 'Not available'],
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description="Your account details." />

      <div className="card max-w-2xl">
        <div className="flex items-center gap-4 border-b border-slate-200 p-6">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-lg font-bold text-brand-700" aria-hidden="true">
            {initials}
          </span>
          <div>
            <h2 className="text-lg font-semibold">{user.name || 'User'}</h2>
            {user.role && <StatusBadge status={user.role} />}
          </div>
        </div>
        <dl className="divide-y divide-slate-100">
          {details.map(([label, value]) => (
            <div key={label} className="grid gap-1 px-6 py-4 sm:grid-cols-3">
              <dt className="text-sm font-medium text-slate-500">{label}</dt>
              <dd className="text-sm text-ink sm:col-span-2">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
};

export default Profile;
