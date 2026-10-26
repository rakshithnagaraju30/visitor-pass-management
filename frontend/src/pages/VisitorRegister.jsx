import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Alert, AuthLayout, Field } from '../components/ui';

const VisitorRegister = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');

    if (!form.name || !form.email || !form.phone || !form.password) {
      setError('Please fill all fields.');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      setLoading(true);

      const response = await api.post('/auth/visitor/register', {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });

      // The account is active only after the emailed OTP is verified
      navigate(`/visitor/verify-otp?email=${encodeURIComponent(response.data.email)}`, {
        state: { delivery: response.data.delivery, retryAfter: response.data.retryAfter },
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to register. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create a visitor account"
      subtitle="Request appointments with registered organizations and receive your pass by email."
      footer={<>Already have an account? <Link to="/visitor/login" className="link">Login</Link></>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field id="name" label="Full name">
          <input id="name" type="text" name="name" className="input" value={form.name} onChange={handleChange} autoComplete="name" required />
        </Field>
        <Field id="email" label="Email address" hint="We will send a verification code to this address.">
          <input id="email" type="email" name="email" className="input" value={form.email} onChange={handleChange} autoComplete="email" required />
        </Field>
        <Field id="phone" label="Phone number">
          <input id="phone" type="tel" name="phone" className="input" value={form.phone} onChange={handleChange} autoComplete="tel" required />
        </Field>
        <Field id="password" label="Password" hint="At least 6 characters.">
          <input id="password" type="password" name="password" className="input" value={form.password} onChange={handleChange} autoComplete="new-password" required minLength={6} />
        </Field>
        <Alert>{error}</Alert>
        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
          {loading ? 'Creating account...' : 'Sign up'}
        </button>
      </form>
    </AuthLayout>
  );
};

export default VisitorRegister;
