import { Link, Navigate } from 'react-router-dom';

const hasActiveSession = () => {
  const token = localStorage.getItem('token');
  try {
    return Boolean(token && JSON.parse(localStorage.getItem('user') || 'null'));
  } catch {
    return false;
  }
};

const Home = () => {
  if (hasActiveSession()) return <Navigate to="/dashboard" replace />;

  return (
    <main className="home-page">
      <section className="home-content">
        <p className="home-eyebrow">VisitorPass</p>
        <h1>Manage every visit with confidence.</h1>
        <p className="home-description">
          A simple, secure way to register visitors, manage appointments, and
          keep your visitor passes organized.
        </p>
        <div className="home-actions">
          <Link className="home-primary-action" to="/login">Sign in to continue</Link>
          <Link className="home-secondary-action" to="/register">Create an organization</Link>
          <a className="home-secondary-action" href="#features">Learn more</a>
        </div>
      </section>
      <section className="home-features" id="features" aria-label="Features">
        <article>
          <h2>Visitor records</h2>
          <p>Keep visitor details accessible and up to date.</p>
        </article>
        <article>
          <h2>Appointments</h2>
          <p>Plan and track upcoming visits in one place.</p>
        </article>
        <article>
          <h2>Clear oversight</h2>
          <p>Use check-in logs and passes to keep your site informed.</p>
        </article>
      </section>
    </main>
  );
};

export default Home;
