import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { downloadPdf, getMyAppointments } from '../services/api';
import VisitorLayout from '../components/VisitorLayout';
import { Alert, PageHeader, StatusBadge } from '../components/ui';

const SECTIONS = [
  {
    title: "Upcoming",
    statuses: ["pending", "approved"],
    empty: "No active appointments.",
  },
  {
    title: "Rejected / cancelled",
    statuses: ["rejected", "cancelled"],
    empty: "Nothing here.",
  },
  {
    title: "Completed",
    statuses: ["completed"],
    empty: "No completed visits yet.",
  },
];

const AppointmentCard = ({ appointment, onCancel, onError }) => {
  const { pass } = appointment;
  const canCancel = ["pending", "approved"].includes(appointment.status);

  const handleDownload = async () => {
    try {
      await downloadPdf(
        `/appointments/my-appointments/${appointment._id}/pass-pdf`,
        `${pass.passNumber}.pdf`
      );
    } catch {
      onError("Unable to download the pass PDF.");
    }
  };

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-ink">
          {appointment.organizationId?.name || "Organization"}
        </h3>
        <StatusBadge status={appointment.status} />
      </div>

      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex gap-2">
          <dt className="w-16 shrink-0 text-slate-500">When</dt>
          <dd className="text-ink">{new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.appointmentTime}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-16 shrink-0 text-slate-500">Reason</dt>
          <dd className="text-ink">{appointment.purpose || appointment.reason}</dd>
        </div>
        {appointment.host?.name && (
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-slate-500">Host</dt>
            <dd className="text-ink">{appointment.host.name}</dd>
          </div>
        )}
      </dl>

      {appointment.rejectionReason && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          <span className="font-semibold">Reason:</span> {appointment.rejectionReason}
        </p>
      )}

      {pass && (
        <div className="mt-4 border-t border-dashed border-slate-200 pt-4">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="font-mono text-xs font-semibold text-ink">{pass.passNumber}</span>
            <StatusBadge status={pass.status} />
          </div>

          {pass.status === "active" && pass.qrCode && (
            <img className="mx-auto my-3 h-40 w-40 rounded-lg border border-slate-200 p-2" src={pass.qrCode} alt={`QR code for pass ${pass.passNumber}`} />
          )}

          <button type="button" className="btn btn-secondary btn-sm mt-2 w-full" onClick={handleDownload}>
            Download PDF pass
          </button>
        </div>
      )}

      {canCancel && (
        <button type="button" className="btn btn-danger-outline btn-sm mt-2 w-full" onClick={() => onCancel(appointment)}>
          Cancel appointment
        </button>
      )}
    </article>
  );
};

function VisitorDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const loadAppointments = async () => {
    try {
      const data = await getMyAppointments();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load appointments."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const handleCancel = async (appointment) => {
    if (!window.confirm("Cancel this appointment? Any issued pass will be revoked.")) return;
    setError("");
    try {
      await api.patch(`/appointments/my-appointments/${appointment._id}/cancel`);
      await loadAppointments();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to cancel the appointment.");
    }
  };

  return (
    <VisitorLayout>
      <PageHeader
        title="My appointments"
        description={user.name ? `Welcome, ${user.name}. Track your requests and passes here.` : undefined}
        actions={<Link to="/visitor/appointments" className="btn btn-primary">Book a visit</Link>}
      />

      <div className="mb-6"><Alert>{error}</Alert></div>

      {loading ? (
        <p className="py-10 text-center text-sm text-slate-500">Loading appointments...</p>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-3">
          {SECTIONS.map((section) => {
            const items = appointments.filter((item) =>
              section.statuses.includes(item.status)
            );

            return (
              <section key={section.title} className="rounded-xl border border-slate-200 bg-slate-100/60 p-4">
                <h2 className="mb-3 flex items-center justify-between text-sm font-semibold text-ink">
                  {section.title}
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">{items.length}</span>
                </h2>

                {items.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-slate-300 py-8 text-center text-sm text-slate-500">{section.empty}</p>
                ) : (
                  <div className="space-y-3">
                    {items.map((appointment) => (
                      <AppointmentCard
                        key={appointment._id}
                        appointment={appointment}
                        onCancel={handleCancel}
                        onError={setError}
                      />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </VisitorLayout>
  );
}

export default VisitorDashboard;
