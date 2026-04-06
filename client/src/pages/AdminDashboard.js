import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
  AppBar,
  Toolbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function AdminDashboard({ onLogout }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [hints, setHints] = useState([]);
  const [qrcodes, setQrcodes] = useState([]);
  const [teams, setTeams] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [hintsRes, qrRes, teamsRes] = await Promise.all([
        axios.get('/api/admin/hints'),
        axios.get('/api/qrcodes/all'),
        axios.get('/api/admin/teams'),
      ]);
      setHints(hintsRes.data.hints || []);
      setQrcodes(qrRes.data.qrcodes || []);
      setTeams(teamsRes.data.teams || []);
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('teamId');
    localStorage.removeItem('isAdmin');
    onLogout();
    navigate('/login');
  };

  const handleAddHint = async () => {
    const formDataObj = new FormData();
    formDataObj.append('qrId', formData.qrId);
    formDataObj.append('solutionQrId', formData.solutionQrId);
    if (formData.hintImage) formDataObj.append('hintImage', formData.hintImage);
    if (formData.eggImage) formDataObj.append('eggImage', formData.eggImage);

    try {
      await axios.post('/api/admin/hints/add', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setOpenDialog(false);
      setFormData({});
      fetchData();
    } catch (error) {
      console.error('Add hint error:', error);
    }
  };

  const handleDeleteHint = async (hintId) => {
    if (window.confirm('Delete this hint?')) {
      try {
        await axios.delete(`/api/admin/hints/${hintId}`);
        fetchData();
      } catch (error) {
        console.error('Delete hint error:', error);
      }
    }
  };

  const handleAddQR = async () => {
    const formDataObj = new FormData();
    formDataObj.append('code', formData.qrCode);
    formDataObj.append('location', formData.location || '');
    if (formData.qrImage) formDataObj.append('qrImage', formData.qrImage);

    try {
      await axios.post('/api/admin/qrcodes/add', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setOpenDialog(false);
      setFormData({});
      fetchData();
    } catch (error) {
      console.error('Add QR error:', error);
    }
  };

  const handleDeleteQR = async (qrId) => {
    if (window.confirm('Delete this QR code?')) {
      try {
        await axios.delete(`/api/admin/qrcodes/${qrId}`);
        fetchData();
      } catch (error) {
        console.error('Delete QR error:', error);
      }
    }
  };

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            🔧 Admin Dashboard
          </Typography>
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper>
          <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)}>
            <Tab label="🔍 Hints" />
            <Tab label="📱 QR Codes" />
            <Tab label="👥 Teams" />
            <Tab label="⚙️ Settings" />
          </Tabs>

          {/* Hints Tab */}
          <TabPanel value={tab} index={0}>
            <Button
              variant="contained"
              color="primary"
              sx={{ mb: 2 }}
              onClick={() => {
                setDialogType('hint');
                setFormData({});
                setOpenDialog(true);
              }}
            >
              + Add Hint
            </Button>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell>Hint ID</TableCell>
                    <TableCell>QR ID</TableCell>
                    <TableCell>Solution QR</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {hints.map((hint) => (
                    <TableRow key={hint.hint_id}>
                      <TableCell>{hint.hint_id}</TableCell>
                      <TableCell>{hint.qr_id}</TableCell>
                      <TableCell>{hint.solution_qr_id}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteHint(hint.hint_id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* QR Codes Tab */}
          <TabPanel value={tab} index={1}>
            <Button
              variant="contained"
              color="primary"
              sx={{ mb: 2 }}
              onClick={() => {
                setDialogType('qr');
                setFormData({});
                setOpenDialog(true);
              }}
            >
              + Add QR Code
            </Button>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell>QR ID</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {qrcodes.map((qr) => (
                    <TableRow key={qr.qr_id}>
                      <TableCell>{qr.qr_id}</TableCell>
                      <TableCell>{qr.code}</TableCell>
                      <TableCell>{qr.location || '-'}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteQR(qr.qr_id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* Teams Tab */}
          <TabPanel value={tab} index={2}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell>Team ID</TableCell>
                    <TableCell>Team Name</TableCell>
                    <TableCell align="right">Found Count</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {teams.map((team) => (
                    <TableRow key={team.team_id}>
                      <TableCell>{team.team_id}</TableCell>
                      <TableCell>{team.team_name}</TableCell>
                      <TableCell align="right">{team.found_count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* Settings Tab */}
          <TabPanel value={tab} index={3}>
            <Typography variant="body1">Settings coming soon...</Typography>
          </TabPanel>
        </Paper>
      </Container>

      {/* Add Hint Dialog */}
      <Dialog open={openDialog && dialogType === 'hint'} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Hint</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="QR ID"
            type="number"
            value={formData.qrId || ''}
            onChange={(e) => setFormData({ ...formData, qrId: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Solution QR ID"
            type="number"
            value={formData.solutionQrId || ''}
            onChange={(e) => setFormData({ ...formData, solutionQrId: e.target.value })}
            margin="normal"
          />
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2">Hint Image</Typography>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFormData({ ...formData, hintImage: e.target.files[0] })}
              style={{ marginTop: '8px' }}
            />
          </Box>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2">Egg Image</Typography>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFormData({ ...formData, eggImage: e.target.files[0] })}
              style={{ marginTop: '8px' }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleAddHint} variant="contained" color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add QR Dialog */}
      <Dialog open={openDialog && dialogType === 'qr'} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New QR Code</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="QR Code"
            value={formData.qrCode || ''}
            onChange={(e) => setFormData({ ...formData, qrCode: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Location (optional)"
            value={formData.location || ''}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            margin="normal"
          />
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2">QR Code Image</Typography>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFormData({ ...formData, qrImage: e.target.files[0] })}
              style={{ marginTop: '8px' }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleAddQR} variant="contained" color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AdminDashboard;
