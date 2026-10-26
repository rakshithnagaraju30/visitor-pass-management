import { useEffect, useState } from 'react';
import api, {
  getPendingVisitorAppointments,
} from '../services/api';
import FilterBar from '../components/FilterBar';
import useFilteredList from '../hooks/useFilteredList';
import { Alert, EmptyRow, Field, PageHeader, StatusBadge } from '../components/ui';

const APPOINTMENT_STATUSES = ['pending', 'approved', 'rejected', 'cancelled', 'completed'];

const emptyForm = {
  visitor: '',
  host: '',
  purpose: '',
  appointmentDate: '',
  appointmentTime: '',
};

const formatDate = (value) => new Date(value).toLocaleDateString();

const Appointments = () => {
  const {
    items: appointments,
    filters,
    setFilter,
    resetFilters,
    isFiltered,
    loading: appointmentsLoading,
    error: appointmentsError,
    reload: fetchAppointments,
  } = useFilteredList('/appointments', { search: '', status: '', from: '', to: '' });
  const [form, setForm] = useState(emptyForm);
  const [notice, setNotice] = useState(null);

  const [pendingVisitorAppointments, setPendingVisitorAppointments] =
    useState([]);

  const [visitorAppointmentsLoading, setVisitorAppointmentsLoading] =
    useState(true);

  const loadPendingVisitorAppointments = async () => {
    try {
      setVisitorAppointmentsLoading(true);

      const data = await getPendingVisitorAppointments();

      setPendingVisitorAppointments(data);
    } catch (error) {
      console.error(
        'Failed to load pending visitor appointments:',
        error
      );
    } finally {
      setVisitorAppointmentsLoading(false);
    }
  };

  useEffect(() => {
    loadPendingVisitorAppointments();
  }, []);

  const refresh = async () => {
    await loadPendingVisitorAppointments();
    await fetchAppointments();
  };

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };

  const createAppointment = async (event) => {
    event.preventDefault();
    setNotice(null);

    try {
      await api.post('/appointments', form);
      setNotice({ type: 'success', text: 'Appointment created.' });
      setForm(emptyForm);
      await refresh();
    } catch (error) {
      setNotice({ type: 'error', text: error.response?.data?.message || 'Failed to create appointment' });
    }
  };

  const handleApproveAppointment = async (appointmentId) => {
    setNotice(null);
    try {
      const response = await api.patch(
        `/visits/appointments/${appointmentId}/approve`,
        {}
      );

      const emailNote = response.data.email?.message ? ` ${response.data.email.message}` : '';
      setNotice({
        type: 'success',
        text: `Appointment approved. Pass ${response.data.pass.passNumber} issued.${emailNote}`,
      });

      await refresh();
    } catch (error) {
      console.error('Approve appointment error:', error);
      setNotice({ type: 'error', text: error.response?.data?.message || 'Unable to approve appointment.' });
    }
  };

  const handleRejectAppointment = async (appointmentId) => {
    const rejectionReason = window.prompt(
      'Enter reason for rejection:'
    );

    if (rejectionReason === null) {
      return;
    }

    setNotice(null);
    try {
      await api.patch(
        `/visits/appointments/${appointmentId}/reject`,
        {
          rejectionReason:
            rejectionReason.trim() ||
            'Appointment rejected',
        }
      );

      setNotice({ type: 'success', text: 'Appointment rejected.' });
      await refresh();
    } catch (error) {
      console.error('Reject appointment error:', error);
      setNotice({ type: 'error', text: error.response?.data?.message || 'Unable to reject appointment.' });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Appointments" description="Review visitor requests and manage every scheduled visit." />

      {notice && <Alert type={notice.type}>{notice.text}</Alert>}

      {/* PRE-REGISTERED VISITOR REQUESTS */}
      <section className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Visitor requests</h2>
            <p className="text-sm text-slate-500">Pre-registered appointments waiting for approval</p>
          </div>
          <span className="badge bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200">
            {pendingVisitorAppointments.length} pending
          </span>
        </div>

        {visitorAppointmentsLoading ? (
          <p className="py-10 text-center text-sm text-slate-500">Loading visitor requests...</p>
        ) : pendingVisitorAppointments.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">No pending visitor requests.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {pendingVisitorAppointments.map((appointment) => (
              <li key={appointment._id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-ink">{appointment.visitor?.name || 'Visitor'}</h3>
                    <StatusBadge status="pending" />
                  </div>
                  <p className="text-sm text-slate-500">{appointment.visitor?.email || 'No email'}</p>
                  <p className="mt-2 text-sm text-slate-600">
                    <span className="font-medium text-ink">{formatDate(appointment.appointmentDate)}</span> at{' '}
                    <span className="font-medium text-ink">{appointment.appointmentTime}</span>
                    <span className="mx-2 text-slate-300">·</span>
                    {appointment.reason || appointment.purpose || 'No reason provided'}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button type="button" className="btn btn-success flex-1 sm:flex-none" onClick={() => handleApproveAppointment(appointment._id)}>
                    Approve
                  </button>
                  <button type="button" className="btn btn-danger-outline flex-1 sm:flex-none" onClick={() => handleRejectAppointment(appointment._id)}>
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ALL APPOINTMENTS */}
      <section className="card overflow-hidden">
        <div className="card-header">
          <h2 className="card-title">All appointments</h2>
        </div>

        <FilterBar
          filters={filters}
          onChange={setFilter}
          onReset={resetFilters}
          isFiltered={isFiltered}
          searchPlaceholder="Search visitor or purpose"
          statusOptions={APPOINTMENT_STATUSES}
          dateLabel="Date"
          resultCount={appointmentsLoading ? undefined : appointments.length}
        />

        {appointmentsError && <div className="p-5"><Alert>{appointmentsError}</Alert></div>}

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Visitor</th>
                <th>Host</th>
                <th>Date</th>
                <th>Purpose</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>

            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment._id}>
                  <td className="font-medium text-ink">{appointment.visitor?.name || appointment.visitor}</td>
                  <td>{appointment.host?.name || '—'}</td>
                  <td>{formatDate(appointment.appointmentDate)} {appointment.appointmentTime}</td>
                  <td className="max-w-xs truncate">{appointment.purpose}</td>
                  <td><StatusBadge status={appointment.status} /></td>
                  <td className="text-right">
                    {appointment.status === 'pending' && (
                      <div className="inline-flex gap-2">
                        <button type="button" className="btn btn-success btn-sm" onClick={() => handleApproveAppointment(appointment._id)}>
                          Approve
                        </button>
                        <button type="button" className="btn btn-danger-outline btn-sm" onClick={() => handleRejectAppointment(appointment._id)}>
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}

              {!appointmentsLoading && appointments.length === 0 && (
                <EmptyRow colSpan={6}>
                  {isFiltered ? 'No appointments match these filters.' : 'No appointments yet.'}
                </EmptyRow>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* MANUAL APPOINTMENT (by record IDs) */}
      <details className="card group">
        <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-brand-600 sm:px-6">
          <span className="mr-1 inline-block transition-transform group-open:rotate-90">&#9656;</span> Create an appointment for an existing visitor
        </summary>
        <form onSubmit={createAppointment} className="grid gap-4 border-t border-slate-200 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
          <Field id="visitor" label="Visitor ID">
            <input id="visitor" name="visitor" className="input" value={form.visitor} onChange={handleChange} required />
          </Field>
          <Field id="host" label="Host / user ID">
            <input id="host" name="host" className="input" value={form.host} onChange={handleChange} required />
          </Field>
          <Field id="purpose" label="Purpose">
            <input id="purpose" name="purpose" className="input" value={form.purpose} onChange={handleChange} required />
          </Field>
          <Field id="appointmentDate" label="Date">
            <input id="appointmentDate" name="appointmentDate" type="date" className="input" value={form.appointmentDate} onChange={handleChange} required />
          </Field>
          <Field id="appointmentTime" label="Time">
            <input id="appointmentTime" name="appointmentTime" type="time" className="input" value={form.appointmentTime} onChange={handleChange} required />
          </Field>
          <div className="flex items-end">
            <button type="submit" className="btn btn-primary w-full">Create appointment</button>
          </div>
        </form>
      </details>
    </div>
  );
};

export default Appointments;
