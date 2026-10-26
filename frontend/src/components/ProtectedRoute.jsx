import { Navigate } from 'react-router-dom';

const  ProtectedRoute = ({ children, roles }) => {
  const token = localStorage.getItem('token');
  let user = null;
  try { user = JSON.parse(localStorage.getItem('user') || 'null'); } catch { user = null; }
  if (!token || !user) return <Navigate to="/" replace />;
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={user.role === 'visitor' ? '/visitor/dashboard' : '/dashboard'} replace />;
  }
  return children;
};
export default ProtectedRoute;
