import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from '../services/api';
import VisitorLayout from '../components/VisitorLayout';
import { Alert, Field, PageHeader } from '../components/ui';



function VisitorAppointment() {
  const [organizations, setOrganizations] = useState([]);

  const [form, setForm] = useState({
    organizationId: "",
    reason: "",
    appointmentDate: "",
    appointmentTime: "",
  });

  const [visitor, setVisitor] = useState({
    name: "",
    email: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      const user = JSON.parse(storedUser);

      setVisitor({
        name: user.name || "",
        email: user.email || "",
      });
    }

    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const response = await api.get(
        '/organizations/public'
      );

      setOrganizations(response.data);
    } catch (err) {
      setError("Unable to load organizations.");
    }
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (
      !form.organizationId ||
      !form.reason ||
      !form.appointmentDate ||
      !form.appointmentTime
    ) {
      setError("Please fill all appointment details.");
      return;
    }

    try {
      setLoading(true);

      await api.post(
        `/appointments/visitor`,
        form
      );

      setMessage(
        "Appointment request submitted successfully."
      );

      setForm({
        organizationId: "",
        reason: "",
        appointmentDate: "",
        appointmentTime: "",
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to submit appointment."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <VisitorLayout>
      <div className="mx-auto max-w-2xl">
        <PageHeader title="Book a visit" description="Send a visit request to an organization. You will get your pass by email once it is approved." />

        <form onSubmit={handleSubmit} className="card">
          <div className="card-body space-y-5">
            <Alert type="success">{message && <>{message} <Link to="/visitor/dashboard" className="link">View my appointments</Link></>}</Alert>
            <Alert>{error}</Alert>

            <Field id="organizationId" label="Organization">
              <select id="organizationId" name="organizationId" className="input" value={form.organizationId} onChange={handleChange} required>
                <option value="">Select an organization</option>
                {organizations.map((organization) => (
                  <option key={organization._id} value={organization._id}>
                    {organization.name}
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="visitorName" label="Your name">
                <input id="visitorName" type="text" className="input" value={visitor.name} disabled />
              </Field>
              <Field id="visitorEmail" label="Email">
                <input id="visitorEmail" type="email" className="input" value={visitor.email} disabled />
              </Field>
            </div>

            <Field id="reason" label="Reason for visit">
              <textarea id="reason" name="reason" rows={3} className="input resize-y" value={form.reason} onChange={handleChange} placeholder="e.g. Admission enquiry, project meeting" required />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="appointmentDate" label="Date">
                <input id="appointmentDate" type="date" name="appointmentDate" className="input" min={new Date().toISOString().slice(0, 10)} value={form.appointmentDate} onChange={handleChange} required />
              </Field>
              <Field id="appointmentTime" label="Time">
                <input id="appointmentTime" type="time" name="appointmentTime" className="input" value={form.appointmentTime} onChange={handleChange} required />
              </Field>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4 sm:px-6">
            <Link to="/visitor/dashboard" className="btn btn-secondary">Cancel</Link>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Submitting..." : "Submit request"}
            </button>
          </div>
        </form>
      </div>
    </VisitorLayout>
  );
}

export default VisitorAppointment;
