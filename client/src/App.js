import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import axios from 'axios';
import PlayerDashboard from './pages/PlayerDashboard';
import GameEntryPage from './pages/GameEntryPage';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [teamId, setTeamId] = useState(localStorage.getItem('teamId'));
  const [gameId, setGameId] = useState(localStorage.getItem('gameId'));
  const [currentHint, setCurrentHint] = useState(null);
  const [gameName, setGameName] = useState(localStorage.getItem('gameName') || '');

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, [token]);

  const handleLogin = (loginToken, id, gId, hint, title) => {
    setToken(loginToken);
    setTeamId(id);
    setGameId(gId);
    setCurrentHint(hint || null);
    setGameName(title || '');
    localStorage.setItem('token', loginToken);
    localStorage.setItem('teamId', id);
    localStorage.setItem('gameId', gId);
    localStorage.setItem('gameName', title || '');
    axios.defaults.headers.common['Authorization'] = `Bearer ${loginToken}`;
  };

  const handleLogout = () => {
    setToken(null);
    setTeamId(null);
    setGameId(null);
    setCurrentHint(null);
    setGameName('');
    localStorage.removeItem('token');
    localStorage.removeItem('teamId');
    localStorage.removeItem('gameId');
    localStorage.removeItem('gameName');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Routes>
        <Route path="/" element={token ? <Navigate to="/dashboard" /> : <GameEntryPage onLogin={handleLogin} />} />
        <Route
          path="/dashboard"
          element={token ? <PlayerDashboard onLogout={handleLogout} gameId={gameId} initialHint={currentHint} gameName={gameName} /> : <Navigate to="/" />}
        />
      </Routes>
    </Box>
  );
}

export default App;
