import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Alert, AuthLayout, Field } from '../components/ui';

const hasActiveSession = () => {
  try {
    return Boolean(localStorage.getItem('token') && JSON.parse(localStorage.getItem('user') || 'null'));
  } catch {
    return false;
  }
};

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', organizationSlug: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (hasActiveSession()) {
      const role = JSON.parse(localStorage.getItem('user') || '{}').role;
      navigate(role === 'visitor' ? '/visitor/dashboard' : '/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleChange = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/login', form);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      if (response.data.organization) {
        localStorage.setItem('organization', JSON.stringify(response.data.organization));
      }
      navigate(response.data.user.role === 'visitor' ? '/visitor/dashboard' : '/dashboard');
    } catch (err) {
      if (err.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
        navigate(`/visitor/verify-otp?email=${encodeURIComponent(err.response.data.email)}`, {
          state: { delivery: err.response.data.delivery, retryAfter: err.response.data.retryAfter },
        });
        return;
      }
      setError(err.response?.data?.message || 'Unable to log in. Check the backend and credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Staff sign in"
      subtitle="Sign in to manage visitors, appointments and passes."
      footer={(
        <>
          New organization? <Link to="/register" className="link">Create an account</Link>
          <span className="mx-2 text-slate-300">|</span>
          <Link to="/visitor/login" className="link">Visitor login</Link>
        </>
      )}
    >
      <form onSubmit={handleLogin} className="space-y-4">
        <Field id="email" label="Email">
          <input id="email" name="email" type="email" className="input" placeholder="you@company.com" value={form.email} onChange={handleChange} autoComplete="username" required />
        </Field>
        <Field id="password" label="Password">
          <input id="password" name="password" type="password" className="input" placeholder="••••••••" value={form.password} onChange={handleChange} autoComplete="current-password" required />
        </Field>
        <Field id="organizationSlug" label="Organization ID (optional)" hint="Only needed if you belong to more than one workspace.">
          <input id="organizationSlug" name="organizationSlug" className="input" placeholder="e.g. abc-public-school" value={form.organizationSlug} onChange={handleChange} autoComplete="organization" />
        </Field>
        <Alert>{error}</Alert>
        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </AuthLayout>
  );
};
export default Login;
