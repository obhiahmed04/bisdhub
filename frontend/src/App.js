import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import LoginPage from './pages/LoginPage';
import RegistrationPage from './pages/RegistrationPage';
import MainApp from './pages/MainApp';
import AdminDashboard from './pages/AdminDashboard';
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
          <Route path="/" element={token ? <MainApp user={user} onLogout={logout} /> : <Navigate to="/login" />} />
          <Route path="/admin" element={token && user?.is_admin ? <AdminDashboard user={user} onLogout={logout} /> : <Navigate to="/" />} />
          <Route path="/profile/:idNumber" element={token ? <UserProfile user={user} onLogout={logout} /> : <Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

export default App;
