const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

const GOAL_HINTS = 10;

// Record found QR code
router.post('/record', async (req, res) => {
  try {
    const { teamId, qrCode } = req.body;

    if (!teamId || !qrCode) {
      return res.status(400).json({ error: 'Team ID and QR code required' });
    }

    // Find QR code
    const qrResult = await pool.query(
      'SELECT qr_id FROM qr_codes WHERE code = $1',
      [qrCode]
    );

    if (qrResult.rows.length === 0) {
      return res.status(404).json({ error: 'QR code not found' });
    }

    const qrId = qrResult.rows[0].qr_id;

    // Find hint for this QR
    const hintResult = await pool.query(
      'SELECT hint_id, solution_qr_id FROM hints WHERE qr_id = $1',
      [qrId]
    );

    if (hintResult.rows.length === 0) {
      return res.status(404).json({ error: 'No hint for this QR code' });
    }

    // Check if this is the solution QR for the current hint
    const teamResult = await pool.query(
      'SELECT current_hint_id FROM teams WHERE team_id = $1',
      [teamId]
    );

    if (teamResult.rows.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const currentHintId = teamResult.rows[0].current_hint_id;

    // Verify this QR is the solution for current hint
    const solutionResult = await pool.query(
      'SELECT solution_qr_id FROM hints WHERE hint_id = $1',
      [currentHintId]
    );

    if (solutionResult.rows.length === 0 || solutionResult.rows[0].solution_qr_id !== qrId) {
      return res.status(400).json({ error: 'Incorrect QR code for current hint' });
    }

    // Record the found hint
    await pool.query(
      'INSERT INTO found_hints (team_id, hint_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [teamId, currentHintId]
    );

    // Get found count
    const countResult = await pool.query(
      'SELECT COUNT(*) as cnt FROM found_hints WHERE team_id = $1',
      [teamId]
    );

    const foundCount = parseInt(countResult.rows[0].cnt);

    // Check if reached goal
    if (foundCount >= GOAL_HINTS) {
      await pool.query(
        'UPDATE teams SET current_hint_id = NULL WHERE team_id = $1',
        [teamId]
      );
      return res.json({
        success: true,
        found: true,
        foundCount,
        message: 'goal_reached',
        nextHintId: null
      });
    }

    // Assign next hint (simplified - just get any unassigned hint)
    const nextResult = await pool.query(
      `SELECT hint_id FROM hints 
       WHERE hint_id NOT IN (SELECT hint_id FROM found_hints WHERE team_id = $1)
       LIMIT 1`,
      [teamId]
    );

    let nextHintId = null;
    if (nextResult.rows.length > 0) {
      nextHintId = nextResult.rows[0].hint_id;
      await pool.query(
        'UPDATE teams SET current_hint_id = $1 WHERE team_id = $2',
        [nextHintId, teamId]
      );
    } else {
      await pool.query(
        'UPDATE teams SET current_hint_id = NULL WHERE team_id = $1',
        [teamId]
      );
    }

    res.json({
      success: true,
      found: true,
      foundCount,
      nextHintId,
      message: nextHintId ? 'hint_assigned' : 'all_hints_done'
    });
  } catch (error) {
    console.error('Record found error:', error);
    res.status(500).json({ error: 'Failed to record found hint' });
  }
});

module.exports = router;
