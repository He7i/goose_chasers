import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import axios from 'axios';
import PlayerDashboard from './pages/PlayerDashboard';
import LoginPage from './pages/LoginPage';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [teamId, setTeamId] = useState(localStorage.getItem('teamId'));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, [token]);

  const handleLogin = (loginToken, id) => {
    setToken(loginToken);
    setTeamId(id);
    localStorage.setItem('token', loginToken);
    localStorage.setItem('teamId', id);
    axios.defaults.headers.common['Authorization'] = `Bearer ${loginToken}`;
  };

  const handleLogout = () => {
    setToken(null);
    setTeamId(null);
    localStorage.removeItem('token');
    localStorage.removeItem('teamId');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route
          path="/dashboard"
          element={token ? <PlayerDashboard onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route path="/" element={<Navigate to={token ? '/dashboard' : '/login'} />} />
      </Routes>
    </Box>
  );
}

export default App;
