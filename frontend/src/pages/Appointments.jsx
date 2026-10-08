import { useEffect, useState } from 'react';
import api from '../services/api';

const emptyForm = { visitor: '', host: '', purpose: '', appointmentDate: '', appointmentTime: '' };

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [form, setForm] = useState(emptyForm);

  const fetchAppointments = async () => {
    try {
      const response = await api.get('/appointments');
      
      if (response.data.length === 0) {
        window.alert('No appointments found');
        return;
      }

      setAppointments(response.data);
      
    } catch (error) {
      window.alert(error.response?.data?.message || 'Failed to load appointments');
    }
  };

  useEffect(() => { fetchAppointments(); }, []);
  const handleChange = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const createAppointment = async (event) => {
    event.preventDefault();
    try {
      await api.post('/appointments', form);
      window.alert('Appointment created');
      setForm(emptyForm);
      fetchAppointments();
    } catch (error) {
      window.alert(error.response?.data?.message || 'Failed to create appointment');
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/appointments/${id}/status`, { status });
      fetchAppointments();
    } catch (error) {
      window.alert(error.response?.data?.message || 'Failed to update appointment');
    }
  };

  return (
    <div>
      <h1>Appointments</h1>
      <div className="form-card">
        <h2>Create Appointment</h2>
        <form onSubmit={createAppointment}>
          <input name="visitor" placeholder="Visitor ID" value={form.visitor} onChange={handleChange} required />
          <input name="host" placeholder="Host/User ID" value={form.host} onChange={handleChange} required />
          <input name="purpose" placeholder="Purpose" value={form.purpose} onChange={handleChange} required />
          <input name="appointmentDate" type="date" value={form.appointmentDate} onChange={handleChange} required />
          <input name="appointmentTime" type="time" value={form.appointmentTime} onChange={handleChange} required />
          <button type="submit">Create Appointment</button>
        </form>
      </div>
      <div className="table-card">
        <h2>Appointments</h2>
        <table>
          <thead><tr><th>Visitor</th><th>Host</th><th>Date</th><th>Purpose</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>{appointments.map((appointment) => (
            <tr key={appointment._id}>
              <td>{appointment.visitor?.name || appointment.visitor}</td>
              <td>{appointment.host?.name || appointment.host}</td>
              <td>{appointment.appointmentDate}</td>
              <td>{appointment.purpose}</td>
              <td>{appointment.status}</td>
              <td>{appointment.status === 'pending' && (
                <>
                  <button type="button" onClick={() => updateStatus(appointment._id, 'approved')}>Approve</button>
                  <button type="button" onClick={() => updateStatus(appointment._id, 'rejected')}>Reject</button>
                </>
              )}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
};

export default Appointments;