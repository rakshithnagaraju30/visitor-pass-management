import { useState } from 'react';
import api, { downloadPdf } from '../services/api';
import FilterBar from '../components/FilterBar';
import useFilteredList from '../hooks/useFilteredList';
import { Alert, EmptyRow, Field, PageHeader } from '../components/ui';

const emptyForm = {
  name: '', email: '', phone: '', photo: '',
  purpose: '', appointmentDate: '', appointmentTime: '',
};

const Visitors = () => {
  const { items: visitors, filters, setFilter, resetFilters, isFiltered, loading: listLoading, error: listError, reload } =
    useFilteredList('/visitors', { search: '', from: '', to: '' });
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

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
      await reload();
    } catch (err) {
      setError(err.response?.data?.message || 'Registration and pass issuance failed');
    } finally { setLoading(false); }
  };

  const handleDownload = async () => {
    try {
      await downloadPdf(`/passes/${success.pass._id}/pdf`, `${success.pass.passNumber}.pdf`);
    } catch {
      setError('Unable to download the PDF pass');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visitors"
        description={`Register a walk-in visitor and issue a pass in one step. Host: ${user.name || 'Current user'}.`}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <form onSubmit={registerAndIssue} className="card">
          <div className="card-header">
            <h2 className="card-title">Register visitor &amp; issue pass</h2>
          </div>
          <div className="card-body space-y-6">
            <fieldset className="grid gap-4 sm:grid-cols-2">
              <legend className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Visitor details</legend>
              <Field id="name" label="Full name">
                <input id="name" name="name" className="input" value={form.name} onChange={handleChange} required />
              </Field>
              <Field id="phone" label="Phone number">
                <input id="phone" name="phone" type="tel" className="input" value={form.phone} onChange={handleChange} required />
              </Field>
              <Field id="email" label="Email" hint="Needed to email the pass.">
                <input id="email" name="email" type="email" className="input" value={form.email} onChange={handleChange} />
              </Field>
              <Field id="photo" label="Photo URL (optional)">
                <input id="photo" name="photo" className="input" value={form.photo} onChange={handleChange} />
              </Field>
            </fieldset>

            <fieldset className="grid gap-4 sm:grid-cols-2">
              <legend className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Appointment details</legend>
              <div className="sm:col-span-2">
                <Field id="purpose" label="Purpose of visit">
                  <input id="purpose" name="purpose" className="input" value={form.purpose} onChange={handleChange} required />
                </Field>
              </div>
              <Field id="appointmentDate" label="Date">
                <input id="appointmentDate" name="appointmentDate" type="date" className="input" min={new Date().toISOString().slice(0, 10)} value={form.appointmentDate} onChange={handleChange} required />
              </Field>
              <Field id="appointmentTime" label="Time">
                <input id="appointmentTime" name="appointmentTime" type="time" className="input" value={form.appointmentTime} onChange={handleChange} required />
              </Field>
            </fieldset>

            <Alert>{error}</Alert>

            <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={loading}>
              {loading ? 'Registering and issuing...' : 'Register & issue pass'}
            </button>
          </div>
        </form>

        <div className="card self-start">
          <div className="card-header">
            <h2 className="card-title">Issued pass</h2>
          </div>
          <div className="card-body">
            {success ? (
              <div className="space-y-4 text-sm">
                <Alert type="success">Pass issued successfully.</Alert>
                {success.pass.qrCode && (
                  <img className="mx-auto h-44 w-44 rounded-lg border border-slate-200 p-2" src={success.pass.qrCode} alt="Visitor pass QR code" />
                )}
                <dl className="space-y-2">
                  {[
                    ['Visitor', success.visitor.name],
                    ['Pass number', success.pass.passNumber],
                    ['Appointment', success.appointment.status],
                    ['Email', success.email?.status || success.pass.emailStatus],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-3">
                      <dt className="text-slate-500">{label}</dt>
                      <dd className="font-semibold text-ink">{value}</dd>
                    </div>
                  ))}
                </dl>
                {success.email?.message && <p className="text-xs text-slate-500">{success.email.message}</p>}
                <button type="button" className="btn btn-secondary w-full" onClick={handleDownload}>Download PDF pass</button>
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-slate-500">The pass appears here after you register a visitor.</p>
            )}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="card-header">
          <h2 className="card-title">Registered visitors</h2>
        </div>
        <FilterBar
          filters={filters}
          onChange={setFilter}
          onReset={resetFilters}
          isFiltered={isFiltered}
          searchPlaceholder="Search name, email or phone"
          dateLabel="Registered"
          resultCount={listLoading ? undefined : visitors.length}
        />
        {listError && <div className="p-5"><Alert>{listError}</Alert></div>}
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Registered</th></tr></thead>
            <tbody>
              {visitors.map((visitor) => (
                <tr key={visitor._id}>
                  <td className="font-medium text-ink">{visitor.name}</td>
                  <td>{visitor.email || '—'}</td>
                  <td>{visitor.phone}</td>
                  <td>{new Date(visitor.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {!listLoading && visitors.length === 0 && (
                <EmptyRow colSpan={4}>{isFiltered ? 'No visitors match these filters.' : 'No visitors yet.'}</EmptyRow>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default Visitors;
