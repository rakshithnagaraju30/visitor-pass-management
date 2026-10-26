import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Alert, AuthLayout, Field } from '../components/ui';

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
    <AuthLayout
      title="Create your organization"
      subtitle="Set up your VisitorPass workspace and administrator account."
      footer={<>Already have an account? <Link to="/login" className="link">Sign in</Link></>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field id="organizationName" label="Organization name">
          <input id="organizationName" name="organizationName" className="input" placeholder="ABC Public School" value={form.organizationName} onChange={handleChange} required />
        </Field>
        <Field id="organizationType" label="Organization type">
          <select id="organizationType" name="organizationType" className="input" value={form.organizationType} onChange={handleChange}>
            <option value="school">School</option>
            <option value="office">Office</option>
            <option value="government">Government</option>
            <option value="hospital">Hospital</option>
            <option value="other">Other</option>
          </select>
        </Field>
        <Field id="name" label="Administrator name">
          <input id="name" name="name" className="input" value={form.name} onChange={handleChange} required />
        </Field>
        <Field id="email" label="Administrator email">
          <input id="email" name="email" type="email" className="input" value={form.email} onChange={handleChange} autoComplete="username" required />
        </Field>
        <Field id="password" label="Password" hint="At least 8 characters.">
          <input id="password" name="password" type="password" className="input" minLength="8" value={form.password} onChange={handleChange} autoComplete="new-password" required />
        </Field>
        <Alert>{error}</Alert>
        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
          {loading ? 'Creating...' : 'Create organization'}
        </button>
      </form>
    </AuthLayout>
  );
};

export default RegisterOrganization;
