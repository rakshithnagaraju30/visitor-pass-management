import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

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
      navigate('/dashboard', { replace: true });
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
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to log in. Check the backend and credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>VisitorPass</h1>
        <p>Visitor Pass Management System</p>
        <form onSubmit={handleLogin}>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" placeholder="Enter email" value={form.email} onChange={handleChange} autoComplete="username" required />
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" placeholder="Enter password" value={form.password} onChange={handleChange} autoComplete="current-password" required />
          <label htmlFor="organizationSlug">Organization slug (optional)</label>
          <input id="organizationSlug" name="organizationSlug" placeholder="e.g. abc-public-school" value={form.organizationSlug} onChange={handleChange} autoComplete="organization" />
          {error && <p className="error-message">{error}</p>}
          <button type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Login'}</button>
        </form>
        <p className="auth-switch">Need an account? <Link to="/register">Create an organization</Link></p>
      </div>
    </div>
  );
};
export default Login;
