import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Box,
  Typography,
  Button,
  AppBar,
  Toolbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Drawer,
  IconButton,
  Badge,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  TextField,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import QRScanner from '../components/QRScanner';

function PlayerDashboard({ onLogout, gameId, initialHint, gameName }) {
  const navigate = useNavigate();
  const teamId = localStorage.getItem('teamId');
  const [currentHint, setCurrentHint] = useState(initialHint || null);
  const [foundHints, setFoundHints] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [showRaceModal, setShowRaceModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState(0);
  const [answerTab, setAnswerTab] = useState(0);
  const [textAnswer, setTextAnswer] = useState('');

  useEffect(() => {
    if (!currentHint && gameId) {
      axios.get(`/api/hints/next/${gameId}`)
        .then(res => setCurrentHint(res.data.hint))
        .catch(err => console.error('Fetch hint error:', err));
    }
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [foundRes, leaderRes] = await Promise.all([
        axios.get(`/api/teams/${teamId}/found`),
        axios.get('/api/teams/leaderboard/all'),
      ]);

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
    navigate('/');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* App Bar */}
      <AppBar position="sticky">
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => setDrawerOpen(true)} sx={{ mr: 1 }}>
            <Badge badgeContent={foundHints.length} color="secondary">
              <MenuIcon />
            </Badge>
          </IconButton>
          <Typography variant="h6" align="center" sx={{ flexGrow: 1 }}>
            {gameName || 'Easter Hunt'}
          </Typography>
          <Button color="inherit" onClick={handleLogout} size="small">
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {/* Main Content — stacked vertically */}
      <Container maxWidth="sm" sx={{ py: 3 }}>
        {/* Current Hint */}
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            📍 Current Hint
          </Typography>
          {currentHint ? (
            <Box>
              <Typography variant="body1" sx={{ mb: 2, fontSize: '1.1rem' }}>
                {currentHint.text_hint}
              </Typography>
              {currentHint.has_image && (
                <img
                  src={`/api/hints/image/${currentHint.id}`}
                  alt="Hint"
                  style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
                />
              )}
            </Box>
          ) : (
            <Typography color="textSecondary">No hints available</Typography>
          )}
        </Paper>

        {/* Solution Input */}
        <Paper elevation={3} sx={{ overflow: 'hidden' }}>
          <Tabs
            value={answerTab}
            onChange={(_, v) => setAnswerTab(v)}
            variant="fullWidth"
          >
            <Tab label="📱 Scan QR" />
            <Tab label="✏️ Text Answer" />
          </Tabs>
          <Box sx={{ p: 3 }}>
            {answerTab === 0 && (
              <QRScanner onScan={handleQRScanned} disabled={loading} />
            )}
            {answerTab === 1 && (
              <Box component="form" onSubmit={(e) => { e.preventDefault(); if (textAnswer.trim()) handleQRScanned(textAnswer.trim()); setTextAnswer(''); }}>
                <TextField
                  fullWidth
                  label="Enter your answer"
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  disabled={loading}
                  autoComplete="off"
                />
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  type="submit"
                  disabled={!textAnswer.trim() || loading}
                  sx={{ mt: 2 }}
                >
                  {loading ? 'Checking...' : 'Submit Answer'}
                </Button>
              </Box>
            )}
          </Box>
        </Paper>
      </Container>

      {/* Drawer for Found Hints & Leaderboard */}
      <Drawer
        anchor="bottom"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { maxHeight: '70vh', borderTopLeftRadius: 16, borderTopRightRadius: 16 } }}
      >
        <Box sx={{ px: 2, pt: 1 }}>
          {/* Drag handle */}
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
            <Box sx={{ width: 40, height: 4, bgcolor: '#ccc', borderRadius: 2 }} />
          </Box>

          <Tabs
            value={drawerTab}
            onChange={(_, v) => setDrawerTab(v)}
            variant="fullWidth"
            sx={{ mb: 2 }}
          >
            <Tab icon={<CheckCircleIcon />} label={`Found (${foundHints.length})`} />
            <Tab icon={<EmojiEventsIcon />} label="Leaderboard" />
          </Tabs>

          {/* Found Hints Tab */}
          {drawerTab === 0 && (
            <Box sx={{ pb: 3 }}>
              {foundHints.length > 0 ? (
                foundHints.map((hint, idx) => (
                  <Box key={idx} sx={{ py: 1.5, borderBottom: '1px solid #eee' }}>
                    <Typography variant="body2">Hint #{hint.hint_id}</Typography>
                  </Box>
                ))
              ) : (
                <Typography color="textSecondary" align="center" sx={{ py: 4 }}>
                  No hints found yet — start scanning!
                </Typography>
              )}
            </Box>
          )}

          {/* Leaderboard Tab */}
          {drawerTab === 1 && (
            <TableContainer sx={{ pb: 3 }}>
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
                    <TableRow key={team.team_id} sx={{ bgcolor: team.team_id === teamId ? '#fff3e0' : 'white' }}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{team.team_name}</TableCell>
                      <TableCell align="right">{team.found_count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Drawer>

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
