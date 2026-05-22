import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import axios from 'axios';

function LoginPage({ onLogin, gameId }) {
  const [tab, setTab] = useState(0);
  const [teamName, setTeamName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/login', { teamName, gameId });
      onLogin(response.data.token, response.data.teamId, false);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/register', { teamName, gameId });
      onLogin(response.data.token, response.data.teamId, false);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
        <Typography variant="h4" align="center" sx={{ mb: 3, fontWeight: 'bold' }}>
          🥚 Easter Hunt
        </Typography>

        <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)} centered sx={{ mb: 3 }}>
          <Tab label="Login" />
          <Tab label="Register" />
        </Tabs>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={tab === 0 ? handleLogin : handleRegister}>
          <TextField
            fullWidth
            label="Team Name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            margin="normal"
            required
            disabled={loading}
          />

          <Button
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 3 }}
            type="submit"
            disabled={loading}
          >
            {loading ? 'Loading...' : tab === 0 ? 'Login' : 'Register'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default LoginPage;
