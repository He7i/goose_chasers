const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

// Get current hint for team
router.get('/current/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    const connection = await pool.getConnection();

    const [hints] = await connection.query(
      `SELECT h.hint_id, h.qr_id, h.solution_qr_id 
       FROM hints h 
       JOIN easter_teams t ON t.current_hint_id = h.hint_id 
       WHERE t.team_id = ?`,
      [teamId]
    );
    connection.release();

    if (hints.length === 0) {
      return res.json({ hint: null });
    }

    res.json({ hint: hints[0] });
  } catch (error) {
    console.error('Get current hint error:', error);
    res.status(500).json({ error: 'Failed to get current hint' });
  }
});

// Get hint image
router.get('/image/:hintId', async (req, res) => {
  try {
    const { hintId } = req.params;
    const connection = await pool.getConnection();

    const [hints] = await connection.query(
      'SELECT hint_image FROM hints WHERE hint_id = ?',
      [hintId]
    );
    connection.release();

    if (hints.length === 0 || !hints[0].hint_image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    res.setHeader('Content-Type', 'image/png');
    res.send(hints[0].hint_image);
  } catch (error) {
    console.error('Get hint image error:', error);
    res.status(500).json({ error: 'Failed to get image' });
  }
});

// Get egg image
router.get('/egg/:hintId', async (req, res) => {
  try {
    const { hintId } = req.params;
    const connection = await pool.getConnection();

    const [hints] = await connection.query(
      'SELECT egg_image FROM hints WHERE hint_id = ?',
      [hintId]
    );
    connection.release();

    if (hints.length === 0 || !hints[0].egg_image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    res.setHeader('Content-Type', 'image/png');
    res.send(hints[0].egg_image);
  } catch (error) {
    console.error('Get egg image error:', error);
    res.status(500).json({ error: 'Failed to get image' });
  }
});

module.exports = router;
