import { useEffect, useState } from 'react';
import api from '../services/api';

const emptyForm = {
  name: '', email: '', phone: '', photo: '',
  purpose: '', appointmentDate: '', appointmentTime: '',
};

const Visitors = () => {
  const [visitors, setVisitors] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchVisitors = async () => {
    try {
      const response = await api.get('/visitors');
      setVisitors(Array.isArray(response.data) ? response.data : response.data.visitors || []);
    } catch (err) { setError(err.response?.data?.message || 'Failed to load visitors'); }
  };
  useEffect(() => { fetchVisitors(); }, []);
  const handleChange = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const registerAndIssue = async (event) => {
    event.preventDefault();
    setLoading(true); setError(''); setSuccess(null);
    try {
      const response = await api.post('/visits/register-and-issue', {
        visitor: { name: form.name, email: form.email, phone: form.phone, photo: form.photo },
        appointment: { purpose: form.purpose, appointmentDate: form.appointmentDate, appointmentTime: form.appointmentTime },
      });
      setSuccess(response.data);
      setForm(emptyForm);
      await fetchVisitors();
    } catch (err) {
      setError(err.response?.data?.message || 'Registration and pass issuance failed');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <h1>Register Visitor & Issue Pass</h1>
      <p className="muted">Complete visitor registration and appointment details in one submission. Host: {user.name || 'Current user'}.</p>
      <div className="form-card">
        <h2>Visitor and appointment details</h2>
        <form onSubmit={registerAndIssue} className="workflow-form">
          <h3>Visitor details</h3>
          <input name="name" placeholder="Visitor full name" value={form.name} onChange={handleChange} required />
          <input name="phone" placeholder="Phone number" value={form.phone} onChange={handleChange} required />
          <input name="email" type="email" placeholder="Email address (needed for email delivery)" value={form.email} onChange={handleChange} />
          <input name="photo" placeholder="Photo URL (optional for now)" value={form.photo} onChange={handleChange} />
          <h3>Appointment details</h3>
          <input name="purpose" placeholder="Purpose of visit" value={form.purpose} onChange={handleChange} required />
          <label htmlFor="appointmentDate">Appointment date</label>
          <input id="appointmentDate" name="appointmentDate" type="date" min={new Date().toISOString().slice(0, 10)} value={form.appointmentDate} onChange={handleChange} required />
          <label htmlFor="appointmentTime">Appointment time</label>
          <input id="appointmentTime" name="appointmentTime" type="time" value={form.appointmentTime} onChange={handleChange} required />
          <button type="submit" disabled={loading}>{loading ? 'Registering and issuing...' : 'Register & Issue Pass'}</button>
        </form>
        {error && <p className="error-message">{error}</p>}
        {success && (
          <div className="success-card">
            <h3>Pass issued successfully</h3>
            <p><strong>Visitor:</strong> {success.visitor.name}</p>
            <p><strong>Appointment status:</strong> {success.appointment.status}</p>
            <p><strong>Pass number:</strong> {success.pass.passNumber}</p>
            <p><strong>Email status:</strong> {success.email?.status || success.pass.emailStatus}</p>
            {success.email?.message && <p>{success.email.message}</p>}
            {success.pass.qrCode && <img className="pass-qr" src={success.pass.qrCode} alt="Visitor pass QR code" />}
            <p><a href={`${api.defaults.baseURL}/passes/${success.pass._id}/pdf`} onClick={async (event) => {
              event.preventDefault();
              try {
                const pdf = await api.get(`/passes/${success.pass._id}/pdf`, { responseType: 'blob' });
                const url = URL.createObjectURL(pdf.data);
                const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${success.pass.passNumber}.pdf`; anchor.click(); URL.revokeObjectURL(url);
              } catch { setError('Unable to download the PDF pass'); }
            }}>Download PDF pass</a></p>
          </div>
        )}
      </div>
      <div className="table-card">
        <h2>Registered visitors</h2>
        <table><thead><tr><th>Name</th><th>Email</th><th>Phone</th></tr></thead>
          <tbody>{visitors.map((visitor) => <tr key={visitor._id}><td>{visitor.name}</td><td>{visitor.email || '—'}</td><td>{visitor.phone}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
};
export default Visitors;
