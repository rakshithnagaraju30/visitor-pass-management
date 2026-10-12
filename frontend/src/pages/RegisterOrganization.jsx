import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const RegisterOrganization = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    organizationName: '',
    organizationType: 'school',
    name: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/organizations/register', form);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('organization', JSON.stringify(response.data.organization));
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to register organization.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Create your organization</h1>
        <p>Set up your VisitorPass workspace and administrator account.</p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="organizationName">Organization name</label>
          <input id="organizationName" name="organizationName" value={form.organizationName} onChange={handleChange} required />
          <label htmlFor="organizationType">Organization type</label>
          <select id="organizationType" name="organizationType" value={form.organizationType} onChange={handleChange}>
            <option value="school">School</option>
            <option value="office">Office</option>
            <option value="government">Government</option>
            <option value="hospital">Hospital</option>
            <option value="other">Other</option>
          </select>
          <label htmlFor="name">Administrator name</label>
          <input id="name" name="name" value={form.name} onChange={handleChange} required />
          <label htmlFor="email">Administrator email</label>
          <input id="email" name="email" type="email" value={form.email} onChange={handleChange} autoComplete="username" required />
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" minLength="8" value={form.password} onChange={handleChange} autoComplete="new-password" required />
          {error && <p className="error-message">{error}</p>}
          <button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create organization'}</button>
        </form>
        <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
};

export default RegisterOrganization;
