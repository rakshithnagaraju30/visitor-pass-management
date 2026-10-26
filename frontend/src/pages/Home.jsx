import { Link, Navigate } from 'react-router-dom';
import { Logo } from '../components/ui';

const getUser = () => {
  const token = localStorage.getItem('token');

  try {
    const user = JSON.parse(
      localStorage.getItem('user') || 'null'
    );

    return token && user ? user : null;
  } catch {
    return null;
  }
};

// Stroke icons (24x24 viewBox) used in the feature cards
const ICONS = {
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </>
  ),
  check: (
    <>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="M22 4 12 14.01l-3-3" />
    </>
  ),
  qr: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h3v3h-3zM18 18h3v3h-3z" />
    </>
  ),
  entry: (
    <>
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <path d="m10 17 5-5-5-5M15 12H3" />
    </>
  ),
  shield: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  chart: (
    <>
      <path d="M3 3v18h18" />
      <path d="M8 17v-5M13 17V8M18 17v-8" />
    </>
  ),
};

const Icon = ({ name }) => (
  <svg
    className="mb-4 h-10 w-10 rounded-lg bg-brand-50 p-2.5 text-brand-600"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {ICONS[name]}
  </svg>
);

const FEATURES = [
  {
    icon: 'calendar',
    title: 'Visitor pre-registration',
    text: 'Visitors request an appointment online before they arrive, so the front desk is ready for them.',
  },
  {
    icon: 'check',
    title: 'Approval workflow',
    text: 'Hosts and admins review each request and approve or reject it with a reason.',
  },
  {
    icon: 'qr',
    title: 'Digital QR passes',
    text: 'Approved visits get a pass with a QR code, delivered by email and downloadable as a PDF.',
  },
  {
    icon: 'entry',
    title: 'Fast check-in & check-out',
    text: 'Security scans the pass at the entrance and every entry and exit is logged automatically.',
  },
  {
    icon: 'shield',
    title: 'Verified visitors',
    text: 'Visitor accounts are confirmed with a one-time email code, and every action is role-protected.',
  },
  {
    icon: 'chart',
    title: 'Insights for admins',
    text: 'Search every record and see daily visits, peak hours and approval trends at a glance.',
  },
];

const STEPS = [
  {
    title: 'Request a visit',
    text: 'The visitor creates an account, chooses the organization and submits the date, time and purpose.',
  },
  {
    title: 'Approve & issue a pass',
    text: 'A host or admin approves the request and a QR pass is issued instantly.',
  },
  {
    title: 'Scan at the entrance',
    text: 'Security scans the QR code to check the visitor in, and again when they leave.',
  },
];

// Decorative QR-style pattern for the pass preview (not a scannable code)
const QR_SIZE = 21;
const isFinder = (row, col) => {
  const inBox = (r, c) => r >= 0 && r < 7 && c >= 0 && c < 7;
  const corners = [[row, col], [row, col - (QR_SIZE - 7)], [row - (QR_SIZE - 7), col]];
  return corners.find(([r, c]) => inBox(r, c));
};
const qrCells = [];
for (let row = 0; row < QR_SIZE; row += 1) {
  for (let col = 0; col < QR_SIZE; col += 1) {
    const finder = isFinder(row, col);
    let filled;
    if (finder) {
      const [r, c] = finder;
      const ring = Math.max(Math.abs(r - 3), Math.abs(c - 3));
      filled = ring !== 2;
    } else {
      filled = ((row * 7 + col * 13 + row * col) % 5) < 2;
    }
    if (filled) qrCells.push(`M${col} ${row}h1v1h-1z`);
  }
}

const PASS_DETAILS = [
  ['Visitor', 'Priya Sharma'],
  ['Host', 'Rahul Verma'],
  ['Date & time', 'Today, 10:30 AM'],
  ['Purpose', 'Project discussion'],
];

const PassPreview = () => (
  <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lift" aria-hidden="true">
    <div className="flex items-center justify-between bg-ink px-5 py-4 font-semibold text-white">
      <span>Visitor Pass</span>
      <span className="badge bg-emerald-100 text-emerald-700">Approved</span>
    </div>

    <div className="flex justify-between gap-4 p-5">
      <dl className="min-w-0 space-y-3">
        {PASS_DETAILS.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-slate-500">{label}</dt>
            <dd className="text-sm font-semibold text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      <svg
        className="h-24 w-24 shrink-0 self-center rounded-lg border border-slate-200 p-1.5 text-ink sm:h-28 sm:w-28"
        viewBox={`-1 -1 ${QR_SIZE + 2} ${QR_SIZE + 2}`}
        shapeRendering="crispEdges"
      >
        <path d={qrCells.join('')} fill="currentColor" />
      </svg>
    </div>

    <div className="flex justify-between gap-3 border-t border-dashed border-slate-200 px-5 py-3 text-xs text-slate-500">
      <span className="font-semibold tabular-nums text-slate-700">VPM-8K2Q-4F1A</span>
      <span>Show this QR code at security</span>
    </div>
  </div>
);

const SectionHeading = ({ eyebrow, title, id }) => (
  <div className="mx-auto mb-12 max-w-2xl text-center">
    <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">{eyebrow}</p>
    <h2 id={id} className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
  </div>
);

const Home = () => {
  const user = getUser();

  // If already logged in, send user to the correct dashboard
  if (user) {
    if (user.role === 'visitor') {
      return <Navigate to="/visitor/dashboard" replace />;
    }

    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />
          <nav className="flex items-center gap-6 text-sm font-medium" aria-label="Primary">
            <a href="#features" className="hidden text-slate-600 hover:text-ink md:inline">Features</a>
            <a href="#how-it-works" className="hidden text-slate-600 hover:text-ink md:inline">How it works</a>
            <Link to="/visitor/login" className="hidden text-slate-600 hover:text-ink md:inline">Visitor login</Link>
            <Link to="/login" className="btn btn-secondary btn-sm">Staff sign in</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="bg-gradient-to-b from-brand-50/60 to-white">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
            <div>
              <p className="inline-flex rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
                Visitor management for schools, offices &amp; hospitals
              </p>
              <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-[3.4rem] lg:leading-[1.08]">
                Every visit, registered, approved and on record.
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
                VisitorPass replaces paper registers with online appointments,
                QR passes and a complete check-in history for your organization.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link className="btn btn-primary px-6 py-3 text-base" to="/register">Create an organization</Link>
                <Link className="btn btn-secondary px-6 py-3 text-base" to="/visitor/register">Book a visit</Link>
              </div>
              <p className="mt-5 text-sm text-slate-500">
                Already have an account? <Link to="/login" className="link">Staff sign in</Link>
                <span className="mx-2 text-slate-300" aria-hidden="true">|</span>
                <Link to="/visitor/login" className="link">Visitor login</Link>
              </p>
            </div>

            <div className="flex justify-center rounded-3xl bg-gradient-to-br from-brand-100/70 via-white to-slate-100 p-6 sm:p-10">
              <PassPreview />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6" id="features" aria-labelledby="features-title">
          <SectionHeading eyebrow="Features" title="Everything the front desk needs" id="features-title" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <article key={feature.title} className="card p-6 transition-shadow hover:shadow-lift">
                <Icon name={feature.icon} />
                <h3 className="text-base font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-slate-200 bg-slate-50" id="how-it-works" aria-labelledby="steps-title">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <SectionHeading eyebrow="How it works" title="From request to entry in three steps" id="steps-title" />
            <ol className="grid gap-10 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step.title}>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 font-bold text-white">{index + 1}</span>
                  <h3 className="mt-4 text-base font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 px-4 py-20 sm:px-6 md:grid-cols-2" aria-label="Get started">
          <article className="flex flex-col items-start rounded-2xl bg-brand-600 p-8 sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-100">For organizations</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Run your front desk on VisitorPass</h2>
            <p className="mt-3 flex-1 leading-relaxed text-brand-100">
              Register your organization, add employees and security staff,
              and start approving visitors in minutes.
            </p>
            <Link className="btn mt-6 w-full bg-white text-brand-700 hover:bg-brand-50 sm:w-auto" to="/register">Create an organization</Link>
          </article>

          <article className="card flex flex-col items-start p-8 sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">For visitors</p>
            <h2 className="mt-2 text-2xl font-bold">Visiting an organization?</h2>
            <p className="mt-3 flex-1 leading-relaxed text-slate-600">
              Create a free visitor account, request an appointment and
              receive your pass by email once it is approved.
            </p>
            <Link className="btn btn-secondary mt-6 w-full sm:w-auto" to="/visitor/register">Create a visitor account</Link>
          </article>
        </section>
      </main>

      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>© {new Date().getFullYear()} VisitorPass</span>
          <nav className="flex flex-wrap gap-5" aria-label="Footer">
            <Link to="/login" className="hover:text-ink">Staff sign in</Link>
            <Link to="/visitor/login" className="hover:text-ink">Visitor login</Link>
            <Link to="/register" className="hover:text-ink">Create an organization</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default Home;
