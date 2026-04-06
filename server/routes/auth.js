const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const jwt = require('jsonwebtoken');

// Login team
router.post('/login', async (req, res) => {
  try {
    const { teamName } = req.body;

    if (!teamName || teamName.trim().length === 0) {
      return res.status(400).json({ error: 'Team name required' });
    }

    const connection = await pool.getConnection();
    const [teams] = await connection.query(
      'SELECT team_id, team_name, current_hint_id FROM easter_teams WHERE team_name = ?',
      [teamName.trim()]
    );
    connection.release();

    if (teams.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const team = teams[0];
    const token = jwt.sign(
      { teamId: team.team_id, teamName: team.team_name },
      process.env.JWT_SECRET || 'dev_secret',
      { expiresIn: '12h' }
    );

    res.json({
      success: true,
      token,
      teamId: team.team_id,
      teamName: team.team_name,
      currentHintId: team.current_hint_id
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Create team
router.post('/register', async (req, res) => {
  try {
    const { teamName } = req.body;

    if (!teamName || teamName.trim().length === 0) {
      return res.status(400).json({ error: 'Team name required' });
    }

    const connection = await pool.getConnection();
    const [result] = await connection.query(
      'INSERT INTO easter_teams (team_name) VALUES (?)',
      [teamName.trim()]
    );
    connection.release();

    const token = jwt.sign(
      { teamId: result.insertId, teamName: teamName.trim() },
      process.env.JWT_SECRET || 'dev_secret',
      { expiresIn: '12h' }
    );

    res.status(201).json({
      success: true,
      token,
      teamId: result.insertId,
      teamName: teamName.trim()
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Team name already exists' });
    }
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Verify token
router.get('/verify', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    res.json({ valid: true, teamId: decoded.teamId, teamName: decoded.teamName });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
