import { useState } from 'react';
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

import VisitorRegister from './pages/VisitorRegister';
import VisitorLogin from './pages/VisitorLogin';
import VisitorDashboard from './pages/VisitorDashboard';
import VisitorAppointment from './pages/VisitorAppointment';
import VisitorVerifyOtp from './pages/VisitorVerifyOtp';


// ===============================
// MAIN APPLICATION LAYOUT
// ===============================

const Layout = ({ children }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="lg:pl-64">
        <Navbar onMenu={() => setMenuOpen(true)} />

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
};


// ===============================
// PROTECTED PAGE WRAPPER
// ===============================

const ProtectedPage = ({ children, roles }) => (
  <ProtectedRoute roles={roles}>
    <Layout>
      {children}
    </Layout>
  </ProtectedRoute>
);


// ===============================
// APPLICATION ROUTES
// ===============================

const App = () => (
  <BrowserRouter>
    <Routes>

      {/* =================================
          PUBLIC ROUTES
          ================================= */}

      {/* Main landing page */}
      <Route
        path="/"
        element={<Home />}
      />

      {/* Login for all users */}
      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/visitor/login"
        element={<VisitorLogin />}
      />

      {/* Organization/Admin registration */}
      <Route
        path="/register"
        element={<RegisterOrganization />}
      />

      {/* Visitor registration */}
      <Route
        path="/visitor/register"
        element={<VisitorRegister />}
      />

      {/* Visitor email verification (OTP) */}
      <Route
        path="/visitor/verify-otp"
        element={<VisitorVerifyOtp />}
      />


      {/* =================================
          ADMIN / EMPLOYEE / SECURITY ROUTES
          ================================= */}

      {/* Common dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedPage roles={['admin', 'employee', 'security']}>
            <Dashboard />
          </ProtectedPage>
        }
      />

      {/* Admin only - manage employees/security */}
      <Route
        path="/users"
        element={
          <ProtectedPage roles={['admin']}>
            <Users />
          </ProtectedPage>
        }
      />

      {/* Visitors */}
      <Route
        path="/visitors"
        element={
          <ProtectedPage roles={['admin', 'employee', 'security']}>
            <Visitors />
          </ProtectedPage>
        }
      />

      {/* Appointments */}
      <Route
        path="/appointments"
        element={
          <ProtectedPage roles={['admin', 'employee', 'security']}>
            <Appointments />
          </ProtectedPage>
        }
      />

      {/* Visitor passes */}
      <Route
        path="/passes"
        element={
          <ProtectedPage roles={['admin', 'employee', 'security']}>
            <Passes />
          </ProtectedPage>
        }
      />

      {/* Check-in / Check-out logs
          Only Admin and Security */}
      <Route
        path="/check-logs"
        element={
          <ProtectedPage roles={['admin', 'security']}>
            <CheckLogs />
          </ProtectedPage>
        }
      />

      {/* User profile */}
      <Route
        path="/profile"
        element={
          <ProtectedPage roles={['admin', 'employee', 'security']}>
            <Profile />
          </ProtectedPage>
        }
      />


      {/* =================================
          VISITOR ROUTES
          ================================= */}

      {/* Visitor dashboard */}
      <Route
        path="/visitor/dashboard"
        element={
          <ProtectedRoute roles={['visitor']}>
            <VisitorDashboard />
          </ProtectedRoute>
        }
      />

      {/* Visitor appointments */}
      <Route
        path="/visitor/appointments"
        element={
          <ProtectedRoute roles={['visitor']}>
            <VisitorAppointment />
          </ProtectedRoute>
        }
      />


      {/* =================================
          FALLBACK ROUTE
          ================================= */}

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />

    </Routes>
  </BrowserRouter>
);


export default App;