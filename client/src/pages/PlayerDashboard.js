import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  AppBar,
  Toolbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import QRScanner from '../components/QRScanner';

function PlayerDashboard({ onLogout }) {
  const navigate = useNavigate();
  const teamId = localStorage.getItem('teamId');
  const [currentHint, setCurrentHint] = useState(null);
  const [foundHints, setFoundHints] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [showRaceModal, setShowRaceModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [hintRes, foundRes, leaderRes] = await Promise.all([
        axios.get(`/api/hints/current/${teamId}`),
        axios.get(`/api/teams/${teamId}/found`),
        axios.get('/api/teams/leaderboard/all'),
      ]);

      setCurrentHint(hintRes.data.hint);
      setFoundHints(foundRes.data.foundHints || []);
      setLeaderboard(leaderRes.data.leaderboard || []);

      if (foundRes.data.foundCount >= 10) {
        const shownKey = `raceShown:${teamId}`;
        if (!localStorage.getItem(shownKey)) {
          setShowRaceModal(true);
          localStorage.setItem(shownKey, '1');
        }
      }
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  const handleQRScanned = async (qrCode) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/found/record', { teamId, qrCode });
      if (response.data.success) {
        await fetchData();
      }
    } catch (error) {
      console.error('QR scan error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('teamId');
    onLogout();
    navigate('/login');
  };

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            🥚 Easter Hunt - Player Dashboard
          </Typography>
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {/* Current Hint */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                📍 Your Current Hint
              </Typography>
              {currentHint ? (
                <Box>
                  <img
                    src={`/api/hints/image/${currentHint.hint_id}`}
                    alt="Current hint"
                    style={{ width: '100%', height: 'auto', borderRadius: '8px', marginBottom: '16px' }}
                  />
                  <Typography variant="body2" color="textSecondary">
                    Hint ID: {currentHint.hint_id}
                  </Typography>
                </Box>
              ) : (
                <Typography color="textSecondary">No hint assigned yet</Typography>
              )}
            </Paper>
          </Grid>

          {/* QR Scanner */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                📱 QR Scanner
              </Typography>
              <QRScanner onScan={handleQRScanned} disabled={loading} />
            </Paper>
          </Grid>

          {/* Found Hints */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                ✅ Found Hints ({foundHints.length})
              </Typography>
              {foundHints.length > 0 ? (
                <Box sx={{ maxHeight: '300px', overflow: 'auto' }}>
                  {foundHints.map((hint, idx) => (
                    <Box key={idx} sx={{ p: 1, borderBottom: '1px solid #eee' }}>
                      <Typography variant="body2">Hint #{hint.hint_id}</Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography color="textSecondary">No hints found yet</Typography>
              )}
            </Paper>
          </Grid>

          {/* Leaderboard */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                🏆 Leaderboard
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      <TableCell>Rank</TableCell>
                      <TableCell>Team</TableCell>
                      <TableCell align="right">Found</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {leaderboard.map((team, idx) => (
                      <TableRow key={team.team_id} sx={{ bgcolor: team.team_id === parseInt(teamId) ? '#fff3e0' : 'white' }}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{team.team_name}</TableCell>
                        <TableCell align="right">{team.found_count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Race Modal */}
      <Dialog open={showRaceModal} onClose={() => setShowRaceModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', fontSize: '2rem' }}>🏁 Race Time!</DialogTitle>
        <DialogContent sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            You found 10 eggs!
          </Typography>
          <Typography variant="body1">
            Run back to the <strong>Game Master</strong> as fast as you can to win.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button variant="contained" color="primary" onClick={() => setShowRaceModal(false)}>
            Got it!
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default PlayerDashboard;
