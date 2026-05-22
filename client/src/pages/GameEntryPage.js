import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Divider,
} from '@mui/material';
import axios from 'axios';

function GameEntryPage({ onLogin }) {
  // Step 1: game code entry
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 2: team selection / creation
  const [game, setGame] = useState(null);
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [newName, setNewName] = useState('');
  const [mode, setMode] = useState(null); // null | 'select' | 'create' | 'solo'

  const handleLookupGame = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.get(`/api/games/join/${joinCode.trim()}`);
      setGame(res.data.game);
      setTeams(res.data.teams || []);
      setMode(res.data.teams?.length > 0 ? 'select' : null);
    } catch (err) {
      setError(err.response?.data?.error || 'Game not found');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTeam = async () => {
    if (!selectedTeamId) return;
    setError('');
    setLoading(true);

    try {
      const res = await axios.post('/api/auth/login', { teamId: selectedTeamId });
      const hintRes = await axios.get(`/api/hints/next/${game.id}`);
      onLogin(res.data.token, res.data.teamId, game.id, hintRes.data.hint, game.title);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to join team');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setError('');
    setLoading(true);

    try {
      const res = await axios.post('/api/auth/register', {
        teamName: newName.trim(),
        gameId: game.id,
      });
      const hintRes = await axios.get(`/api/hints/next/${game.id}`);
      onLogin(res.data.token, res.data.teamId, game.id, hintRes.data.hint, game.title);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create team');
    } finally {
      setLoading(false);
    }
  };

  const handleSoloJoin = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setError('');
    setLoading(true);

    try {
      const res = await axios.post('/api/auth/solo', {
        playerName: newName.trim(),
        gameId: game.id,
      });
      const hintRes = await axios.get(`/api/hints/next/${game.id}`);
      onLogin(res.data.token, res.data.teamId, game.id, hintRes.data.hint, game.title);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to join as solo player');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setGame(null);
    setTeams([]);
    setMode(null);
    setSelectedTeamId('');
    setNewName('');
    setError('');
  };

  // ── Step 1: Enter game code ──
  if (!game) {
    return (
      <Container maxWidth="sm" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%', textAlign: 'center' }}>
          <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold' }}>
            🥚 Easter Hunt
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
            Enter your Game ID to get started
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleLookupGame}>
            <TextField
              fullWidth
              label="Game ID"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              margin="normal"
              required
              autoFocus
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
              {loading ? 'Looking up...' : 'Join Game'}
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  // ── Step 2: Team selection / creation ──
  return (
    <Container maxWidth="sm" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
        <Typography variant="h4" align="center" sx={{ mb: 1, fontWeight: 'bold' }}>
          🥚 {game.title}
        </Typography>
        <Typography variant="body2" align="center" color="textSecondary" sx={{ mb: 3 }}>
          Choose how you'd like to play
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Existing teams dropdown */}
        {teams.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
              Join an existing team
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Select Team</InputLabel>
              <Select
                value={selectedTeamId}
                label="Select Team"
                onChange={(e) => setSelectedTeamId(e.target.value)}
                disabled={loading}
              >
                {teams.map((team) => (
                  <MenuItem key={team.team_id} value={team.team_id}>
                    {team.team_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
              onClick={handleSelectTeam}
              disabled={!selectedTeamId || loading}
            >
              {loading && mode === 'select' ? 'Joining...' : 'Join Team'}
            </Button>

            <Divider sx={{ my: 3 }}>OR</Divider>
          </Box>
        )}

        {/* Create / Solo buttons when no mode chosen yet */}
        {mode !== 'create' && mode !== 'solo' && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              color="primary"
              onClick={() => setMode('create')}
            >
              Create New Team
            </Button>
            <Button
              fullWidth
              variant="outlined"
              color="secondary"
              onClick={() => setMode('solo')}
            >
              Play Solo
            </Button>
          </Box>
        )}

        {/* Create team form */}
        {mode === 'create' && (
          <Box component="form" onSubmit={handleCreateTeam} sx={{ mt: 1 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
              Create a new team
            </Typography>
            <TextField
              fullWidth
              label="Team Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              margin="normal"
              required
              autoFocus
              disabled={loading}
            />
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button variant="text" onClick={() => setMode(null)} disabled={loading}>
                Back
              </Button>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create & Join'}
              </Button>
            </Box>
          </Box>
        )}

        {/* Solo join form */}
        {mode === 'solo' && (
          <Box component="form" onSubmit={handleSoloJoin} sx={{ mt: 1 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
              Play as a single player
            </Typography>
            <TextField
              fullWidth
              label="Your Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              margin="normal"
              required
              autoFocus
              disabled={loading}
            />
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button variant="text" onClick={() => setMode(null)} disabled={loading}>
                Back
              </Button>
              <Button
                fullWidth
                variant="contained"
                color="secondary"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Joining...' : 'Join Solo'}
              </Button>
            </Box>
          </Box>
        )}

        <Button
          fullWidth
          variant="text"
          sx={{ mt: 3 }}
          onClick={handleBack}
          disabled={loading}
        >
          ← Different Game
        </Button>
      </Paper>
    </Container>
  );
}

export default GameEntryPage;
