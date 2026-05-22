const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

// Get team info
router.get('/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    const result = await pool.query(
      'SELECT team_id, team_name, game_id FROM teams WHERE team_id = $1',
      [teamId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

    res.json({ team: result.rows[0] });
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ error: 'Failed to get team' });
  }
});

// Get team found hints
router.get('/:teamId/found', async (req, res) => {
  try {
    const { teamId } = req.params;
    const result = await pool.query(
      `SELECT f.hint_id
       FROM found_hints f 
       JOIN hints h ON f.hint_id = h.id 
       WHERE f.team_id = $1 
       ORDER BY f.found_at DESC`,
      [teamId]
    );

    res.json({ foundHints: result.rows, foundCount: result.rows.length });
  } catch (error) {
    console.error('Get found hints error:', error);
    res.status(500).json({ error: 'Failed to get found hints' });
  }
});

// Get leaderboard
router.get('/leaderboard/all', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.team_id, t.team_name, COUNT(f.hint_id) as found_count 
       FROM teams t 
       LEFT JOIN found_hints f ON t.team_id = f.team_id 
       GROUP BY t.team_id, t.team_name 
       ORDER BY found_count DESC`
    );

    res.json({ leaderboard: result.rows });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

module.exports = router;
