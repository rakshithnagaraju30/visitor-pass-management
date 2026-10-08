import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  let user = {};

  try {
    user = JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    localStorage.removeItem('user');
  }

  const logout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <header className="navbar">
      <h3>Visitor Pass Management</h3>
      <div className="navbar-user">
        <span>{user.name || 'User'}</span>
        <span className="role">{user.role || ''}</span>
        <button type="button" onClick={logout}>Logout</button>
      </div>
    </header>
  );
};

export default Navbar;