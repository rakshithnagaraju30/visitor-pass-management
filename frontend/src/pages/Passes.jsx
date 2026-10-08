import { useEffect, useState } from 'react';
import api from '../services/api';

const emptyForm = { visitor: '', appointment: '', passNumber: '', qrCode: '', pdfUrl: '', validFrom: '', validUntil: '', issuedBy: '' };

const Passes = () => {
  const [passes, setPasses] = useState([]);
  const [form, setForm] = useState(emptyForm);

  const fetchPasses = async () => {
    try {
      const response = await api.get('/passes');
      setPasses(response.data);
    } catch (error) {
      window.alert(error.response?.data?.message || 'Failed to load passes');
    }
  };

  useEffect(() => { fetchPasses(); }, []);
  const handleChange = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const createPass = async (event) => {
    event.preventDefault();
    try {
      await api.post('/passes', form);
      window.alert('Pass issued successfully');
      setForm(emptyForm);
      fetchPasses();
    } catch (error) {
      window.alert(error.response?.data?.message || 'Failed to issue pass');
    }
  };

  return (
    <div>
      <h1>Passes</h1>
      <div className="form-card">
        <h2>Issue Pass</h2>
        <form onSubmit={createPass}>
          <input name="visitor" placeholder="Visitor ID" value={form.visitor} onChange={handleChange} required />
          <input name="appointment" placeholder="Appointment ID" value={form.appointment} onChange={handleChange} required />
          <input name="passNumber" placeholder="Pass Number" value={form.passNumber} onChange={handleChange} required />
          <input name="qrCode" placeholder="QR Code data" value={form.qrCode} onChange={handleChange} required />
          <input name="pdfUrl" placeholder="PDF URL" value={form.pdfUrl} onChange={handleChange} />
          <label htmlFor="validFrom">Valid From</label>
          <input id="validFrom" name="validFrom" type="datetime-local" value={form.validFrom} onChange={handleChange} required />
          <label htmlFor="validUntil">Valid Until</label>
          <input id="validUntil" name="validUntil" type="datetime-local" value={form.validUntil} onChange={handleChange} required />
          <input name="issuedBy" placeholder="Issued By User ID" value={form.issuedBy} onChange={handleChange} required />
          <button type="submit">Issue Pass</button>
        </form>
      </div>
      <div className="table-card">
        <h2>Issued Passes</h2>
        <table>
          <thead><tr><th>Pass Number</th><th>Visitor</th><th>Status</th><th>Valid Until</th></tr></thead>
          <tbody>{passes.map((pass) => (
            <tr key={pass._id}><td>{pass.passNumber}</td><td>{pass.visitor?.name || pass.visitor}</td><td>{pass.status}</td><td>{pass.validUntil}</td></tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
};

export default Passes;