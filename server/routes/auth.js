const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const jwt = require('jsonwebtoken');

// Login with existing team (select from dropdown)
router.post('/login', async (req, res) => {
  try {
    const { teamId } = req.body;

    if (!teamId) {
      return res.status(400).json({ error: 'Team ID required' });
    }

    const result = await pool.query(
      'SELECT team_id, team_name, game_id FROM teams WHERE team_id = $1',
      [teamId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const team = result.rows[0];
    const token = jwt.sign(
      { teamId: team.team_id, teamName: team.team_name, gameId: team.game_id },
      process.env.JWT_SECRET || 'dev_secret',
      { expiresIn: '12h' }
    );

    res.json({
      success: true,
      token,
      teamId: team.team_id,
      teamName: team.team_name,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Create new team for a game
router.post('/register', async (req, res) => {
  try {
    const { teamName, gameId } = req.body;

    if (!teamName || teamName.trim().length === 0) {
      return res.status(400).json({ error: 'Team name required' });
    }
    if (!gameId) {
      return res.status(400).json({ error: 'Game ID required' });
    }

    const result = await pool.query(
      'INSERT INTO teams (team_id, game_id, team_name) VALUES (gen_random_uuid(), $1, $2) RETURNING team_id, team_name',
      [gameId, teamName.trim()]
    );

    const team = result.rows[0];
    const token = jwt.sign(
      { teamId: team.team_id, teamName: team.team_name, gameId },
      process.env.JWT_SECRET || 'dev_secret',
      { expiresIn: '12h' }
    );

    res.status(201).json({
      success: true,
      token,
      teamId: team.team_id,
      teamName: team.team_name,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Join as single player (creates a solo team)
router.post('/solo', async (req, res) => {
  try {
    const { playerName, gameId } = req.body;

    if (!playerName || playerName.trim().length === 0) {
      return res.status(400).json({ error: 'Player name required' });
    }
    if (!gameId) {
      return res.status(400).json({ error: 'Game ID required' });
    }

    const result = await pool.query(
      'INSERT INTO teams (team_id, game_id, team_name) VALUES (gen_random_uuid(), $1, $2) RETURNING team_id, team_name',
      [gameId, playerName.trim()]
    );

    const team = result.rows[0];
    const token = jwt.sign(
      { teamId: team.team_id, teamName: team.team_name, gameId },
      process.env.JWT_SECRET || 'dev_secret',
      { expiresIn: '12h' }
    );

    res.status(201).json({
      success: true,
      token,
      teamId: team.team_id,
      teamName: team.team_name,
    });
  } catch (error) {
    console.error('Solo join error:', error);
    res.status(500).json({ error: 'Failed to join as single player' });
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
