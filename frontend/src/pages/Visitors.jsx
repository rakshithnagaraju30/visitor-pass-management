import { useEffect, useState } from 'react';
import api from '../services/api';

const emptyForm = { name: '', email: '', phone: '', photo: '' };

const Visitors = () => {
  const [visitors, setVisitors] = useState([]);
  const [form, setForm] = useState(emptyForm);

  const fetchVisitors = async () => {
    try {
      const response = await api.get('/visitors');
      setVisitors(response.data);
    } catch (error) {
      window.alert(error.response?.data?.message || 'Failed to load visitors');
    }
  };

  useEffect(() => { fetchVisitors(); }, []);
  const handleChange = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const registerVisitor = async (event) => {
    event.preventDefault();
    try {
      await api.post('/visitors', form);
      window.alert('Visitor registered successfully');
      setForm(emptyForm);
      fetchVisitors();
    } catch (error) {
      window.alert(error.response?.data?.message || 'Failed to register visitor');
    }
  };

  return (
    <div>
      <h1>Visitors</h1>
      <div className="form-card">
        <h2>Register Visitor</h2>
        <form onSubmit={registerVisitor}>
          <input name="name" placeholder="Visitor name" value={form.name} onChange={handleChange} required />
          <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} />
          <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} required />
          <input name="photo" placeholder="Photo URL" value={form.photo} onChange={handleChange} />
          <button type="submit">Register Visitor</button>
        </form>
      </div>
      <div className="table-card">
        <h2>Registered Visitors</h2>
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th></tr></thead>
          <tbody>{visitors.map((visitor) => (
            <tr key={visitor._id}><td>{visitor.name}</td><td>{visitor.email}</td><td>{visitor.phone}</td></tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
};

export default Visitors;