const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

// Get team info
router.get('/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    const connection = await pool.getConnection();

    const [teams] = await connection.query(
      'SELECT team_id, team_name, current_hint_id FROM easter_teams WHERE team_id = ?',
      [teamId]
    );
    connection.release();

    if (teams.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

    res.json({ team: teams[0] });
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ error: 'Failed to get team' });
  }
});

// Get team found hints
router.get('/:teamId/found', async (req, res) => {
  try {
    const { teamId } = req.params;
    const connection = await pool.getConnection();

    const [found] = await connection.query(
      `SELECT f.hint_id, h.qr_id 
       FROM found f 
       JOIN hints h ON f.hint_id = h.hint_id 
       WHERE f.team_id = ? 
       ORDER BY f.found_at DESC`,
      [teamId]
    );
    connection.release();

    res.json({ foundHints: found, foundCount: found.length });
  } catch (error) {
    console.error('Get found hints error:', error);
    res.status(500).json({ error: 'Failed to get found hints' });
  }
});

// Get leaderboard
router.get('/leaderboard/all', async (req, res) => {
  try {
    const connection = await pool.getConnection();

    const [leaderboard] = await connection.query(
      `SELECT t.team_id, t.team_name, COUNT(f.hint_id) as found_count 
       FROM easter_teams t 
       LEFT JOIN found f ON t.team_id = f.team_id 
       GROUP BY t.team_id, t.team_name 
       ORDER BY found_count DESC, t.created_at ASC`
    );
    connection.release();

    res.json({ leaderboard });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

module.exports = router;
