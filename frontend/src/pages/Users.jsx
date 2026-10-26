import { useEffect, useState } from 'react';
import api from '../services/api';
import { Alert, EmptyRow, Field, PageHeader, StatusBadge } from '../components/ui';

const emptyForm = { name: '', email: '', password: '', role: 'employee', phone: '' };

const Users = () => {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [notice, setNotice] = useState(null);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      setNotice({ type: 'error', text: error.response?.data?.message || 'Failed to load users' });
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleChange = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const createUser = async (event) => {
    event.preventDefault();
    setNotice(null);
    try {
      await api.post('/users', form);
      setNotice({ type: 'success', text: 'User created successfully.' });
      setForm(emptyForm);
      fetchUsers();
    } catch (error) {
      setNotice({ type: 'error', text: error.response?.data?.message || 'Failed to create user' });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description="Add employees and security staff to your organization." />

      {notice && <Alert type={notice.type}>{notice.text}</Alert>}

      <form onSubmit={createUser} className="card">
        <div className="card-header">
          <h2 className="card-title">Create user</h2>
        </div>
        <div className="card-body grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field id="name" label="Name">
            <input id="name" name="name" className="input" value={form.name} onChange={handleChange} required />
          </Field>
          <Field id="email" label="Email">
            <input id="email" name="email" type="email" className="input" value={form.email} onChange={handleChange} required />
          </Field>
          <Field id="password" label="Password">
            <input id="password" name="password" type="password" className="input" value={form.password} onChange={handleChange} autoComplete="new-password" required />
          </Field>
          <Field id="phone" label="Phone">
            <input id="phone" name="phone" type="tel" className="input" value={form.phone} onChange={handleChange} />
          </Field>
          <Field id="role" label="Role">
            <select id="role" name="role" className="input" value={form.role} onChange={handleChange}>
              <option value="admin">Admin</option>
              <option value="security">Security</option>
              <option value="employee">Employee</option>
            </select>
          </Field>
          <div className="flex items-end">
            <button type="submit" className="btn btn-primary w-full">Create user</button>
          </div>
        </div>
      </form>

      <div className="card overflow-hidden">
        <div className="card-header">
          <h2 className="card-title">All users</h2>
          <span className="text-sm text-slate-500">{users.length} total</span>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Phone</th></tr></thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td className="font-medium text-ink">{user.name}</td>
                  <td>{user.email}</td>
                  <td><StatusBadge status={user.role} /></td>
                  <td>{user.phone || '—'}</td>
                </tr>
              ))}
              {users.length === 0 && <EmptyRow colSpan={4}>No users yet.</EmptyRow>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Users;
