import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Alert, AuthLayout } from '../components/ui';

const RESEND_SECONDS = 60;

const deliveryNote = (delivery) => {
  if (delivery === 'logged') return 'Email is not configured on the server, so the code was written to the backend console.';
  if (delivery === 'failed' || delivery === 'not_configured') return 'We could not send the email. Try resending the code.';
  return '';
};

const VisitorVerifyOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = new URLSearchParams(location.search).get('email') || '';

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState(deliveryNote(location.state?.delivery));
  const [cooldown, setCooldown] = useState(location.state?.retryAfter || RESEND_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  if (!email) {
    return (
      <AuthLayout
        title="Verify email"
        footer={<Link to="/visitor/register" className="link">Back to registration</Link>}
      >
        <Alert>No email address to verify.</Alert>
      </AuthLayout>
    );
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!/^\d{6}$/.test(otp)) {
      setError('Enter the 6-digit code from your email.');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/auth/visitor/verify-otp', { email, otp });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/visitor/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to verify the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setMessage('');
    try {
      const response = await api.post('/auth/visitor/resend-otp', { email });
      setMessage(deliveryNote(response.data.delivery) || 'A new code has been sent to your email.');
      setOtp('');
      setCooldown(RESEND_SECONDS);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to resend the code.');
      if (err.response?.data?.retryAfter) setCooldown(err.response.data.retryAfter);
    }
  };

  return (
    <AuthLayout
      title="Verify your email"
      subtitle={<>Enter the 6-digit code we sent to <strong className="text-ink">{email}</strong>. The code expires in 10 minutes.</>}
      footer={(
        <>
          Didn&apos;t get the code?{' '}
          <button type="button" className="link disabled:cursor-default disabled:text-slate-400 disabled:no-underline" onClick={handleResend} disabled={cooldown > 0}>
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
          </button>
        </>
      )}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="input py-3 text-center text-2xl font-semibold tracking-[0.5em] tabular-nums"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="000000"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          aria-label="Verification code"
          autoFocus
          required
        />
        <Alert>{error}</Alert>
        <Alert type="info">{message}</Alert>
        <button type="submit" className="btn btn-primary w-full" disabled={loading || otp.length !== 6}>
          {loading ? 'Verifying...' : 'Verify email'}
        </button>
      </form>
    </AuthLayout>
  );
};

export default VisitorVerifyOtp;
