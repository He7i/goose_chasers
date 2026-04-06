import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Container, Box } from '@mui/material';
import axios from 'axios';
import PlayerDashboard from './pages/PlayerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import LoginPage from './pages/LoginPage';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [teamId, setTeamId] = useState(localStorage.getItem('teamId'));
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdmin') === 'true');

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, [token]);

  const handleLogin = (loginToken, id, admin = false) => {
    setToken(loginToken);
    setTeamId(id);
    setIsAdmin(admin);
    localStorage.setItem('token', loginToken);
    localStorage.setItem('teamId', id);
    localStorage.setItem('isAdmin', admin);
    axios.defaults.headers.common['Authorization'] = `Bearer ${loginToken}`;
  };

  const handleLogout = () => {
    setToken(null);
    setTeamId(null);
    setIsAdmin(false);
    localStorage.removeItem('token');
    localStorage.removeItem('teamId');
    localStorage.removeItem('isAdmin');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route
          path="/dashboard"
          element={token && !isAdmin ? <PlayerDashboard onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/admin"
          element={token && isAdmin ? <AdminDashboard onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route path="/" element={<Navigate to={token ? (isAdmin ? '/admin' : '/dashboard') : '/login'} />} />
      </Routes>
    </Box>
  );
}

export default App;
