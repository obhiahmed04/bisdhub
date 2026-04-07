import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import LoginPage from './pages/LoginPage';
import RegistrationPage from './pages/RegistrationPage';
import PendingRegistrationPage from './pages/PendingRegistrationPage';
import MainApp from './pages/MainApp';
import AdminDashboard from './pages/AdminDashboard';
import ModerationPanel from './pages/ModerationPanel';
import ManagementPanel from './pages/ManagementPanel';
import UserProfile from './pages/UserProfile';
import { Toaster } from './components/ui/sonner';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={token ? <Navigate to="/" /> : <LoginPage onLogin={login} />} />
          <Route path="/register" element={<RegistrationPage />} />
          <Route path="/pending-registration" element={<PendingRegistrationWrapper />} />
          <Route path="/" element={token ? <MainApp user={user} onLogout={logout} /> : <Navigate to="/login" />} />
          <Route path="/admin" element={token && user?.is_admin ? <AdminDashboard user={user} onLogout={logout} /> : <Navigate to="/" />} />
          <Route path="/moderation" element={token && user?.is_moderator ? <ModerationPanel user={user} onLogout={logout} /> : <Navigate to="/" />} />
          <Route path="/management" element={token && (user?.role === 'Project Owner' || user?.role === 'Management') ? <ManagementPanel user={user} onLogout={logout} /> : <Navigate to="/" />} />
          <Route path="/profile/:idNumber" element={token ? <UserProfile user={user} onLogout={logout} /> : <Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

// Wrapper to access useLocation
function PendingRegistrationWrapper() {
  const location = useLocation();
  const serialNumber = location.state?.serialNumber;
  return <PendingRegistrationPage serialNumber={serialNumber} />;
}

export default App;
