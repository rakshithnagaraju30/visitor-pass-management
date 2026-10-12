import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Visitors from './pages/Visitors';
import Appointments from './pages/Appointments';
import Passes from './pages/Passes';
import CheckLogs from './pages/CheckLogs';
import Profile from './pages/Profile';
import Home from './pages/Home';
import RegisterOrganization from './pages/RegisterOrganization';

const Layout = ({ children }) => (
  <div className="app-layout">
    <Sidebar />
    <div className="main-section">
      <Navbar />
      <main className="page-content">{children}</main>
    </div>
  </div>
);

const ProtectedPage = ({ children, roles }) => (
  <ProtectedRoute roles={roles}><Layout>{children}</Layout></ProtectedRoute>
);

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<RegisterOrganization />} />
      <Route path="/" element={<Home />} />
      <Route path="/dashboard" element={<ProtectedPage><Dashboard /></ProtectedPage>} />
      <Route path="/users" element={<ProtectedPage roles={['admin']}><Users /></ProtectedPage>} />
      <Route path="/visitors" element={<ProtectedPage><Visitors /></ProtectedPage>} />
      <Route path="/appointments" element={<ProtectedPage><Appointments /></ProtectedPage>} />
      <Route path="/passes" element={<ProtectedPage><Passes /></ProtectedPage>} />
      <Route path="/check-logs" element={<ProtectedPage roles={['admin', 'security']}><CheckLogs /></ProtectedPage>} />
      <Route path="/profile" element={<ProtectedPage><Profile /></ProtectedPage>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);

export default App;