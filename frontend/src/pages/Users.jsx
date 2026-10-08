import { useEffect, useState } from 'react';
import api from '../services/api';

const emptyForm = { name: '', email: '', password: '', role: 'employee', phone: '' };

const Users = () => {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      window.alert(error.response?.data?.message || 'Failed to load users');
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleChange = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const createUser = async (event) => {
    event.preventDefault();
    try {
      await api.post('/users', form);
      window.alert('User created successfully');
      setForm(emptyForm);
      fetchUsers();
    } catch (error) {
      window.alert(error.response?.data?.message || 'Failed to create user');
    }
  };

  return (
    <div>
      <h1>Users</h1>
      <div className="form-card">
        <h2>Create User</h2>
        <form onSubmit={createUser}>
          <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
          <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
          <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
          <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} />
          <select name="role" value={form.role} onChange={handleChange}>
            <option value="admin">Admin</option>
            <option value="security">Security</option>
            <option value="employee">Employee</option>
          </select>
          <button type="submit">Create User</button>
        </form>
      </div>
      <div className="table-card">
        <h2>All Users</h2>
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Phone</th></tr></thead>
          <tbody>{users.map((user) => (
            <tr key={user._id}><td>{user.name}</td><td>{user.email}</td><td>{user.role}</td><td>{user.phone}</td></tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;