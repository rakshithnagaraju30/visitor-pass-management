import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', role: 'admin' });

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleLogin = (event) => {
    event.preventDefault();
    if (!form.email || !form.password) {
      window.alert('Please enter email and password');
      return;
    }

    localStorage.setItem('user', JSON.stringify({
      name: 'Admin User',
      email: form.email,
      role: form.role,
    }));
    navigate('/dashboard');
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>VisitorPass</h1>
        <p>Visitor Pass Management System</p>
        <form onSubmit={handleLogin}>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" placeholder="Enter email" value={form.email} onChange={handleChange} required />
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" placeholder="Enter password" value={form.password} onChange={handleChange} required />
          <label htmlFor="role">Role</label>
          <select id="role" name="role" value={form.role} onChange={handleChange}>
            <option value="admin">Admin</option>
            <option value="security">Security</option>
            <option value="employee">Employee</option>
          </select>
          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
};

export default Login;