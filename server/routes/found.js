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

    const connection = await pool.getConnection();

    // Find QR code
    const [qrcodes] = await connection.query(
      'SELECT qr_id FROM qr_codes WHERE code = ?',
      [qrCode]
    );

    if (qrcodes.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'QR code not found' });
    }

    const qrId = qrcodes[0].qr_id;

    // Find hint for this QR
    const [hints] = await connection.query(
      'SELECT hint_id, solution_qr_id FROM hints WHERE qr_id = ?',
      [qrId]
    );

    if (hints.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'No hint for this QR code' });
    }

    const hint = hints[0];

    // Check if this is the solution QR for the current hint
    const [currentHints] = await connection.query(
      'SELECT current_hint_id FROM easter_teams WHERE team_id = ?',
      [teamId]
    );

    if (currentHints.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Team not found' });
    }

    const currentHintId = currentHints[0].current_hint_id;

    // Verify this QR is the solution for current hint
    const [solutionCheck] = await connection.query(
      'SELECT solution_qr_id FROM hints WHERE hint_id = ?',
      [currentHintId]
    );

    if (solutionCheck.length === 0 || solutionCheck[0].solution_qr_id !== qrId) {
      connection.release();
      return res.status(400).json({ error: 'Incorrect QR code for current hint' });
    }

    // Record the found hint
    try {
      await connection.query(
        'INSERT INTO found (team_id, hint_id) VALUES (?, ?)',
        [teamId, currentHintId]
      );
    } catch (error) {
      if (error.code !== 'ER_DUP_ENTRY') {
        throw error;
      }
    }

    // Get found count
    const [foundCounts] = await connection.query(
      'SELECT COUNT(*) as cnt FROM found WHERE team_id = ?',
      [teamId]
    );

    const foundCount = foundCounts[0].cnt;

    // Check if reached goal
    if (foundCount >= GOAL_HINTS) {
      await connection.query(
        'UPDATE easter_teams SET current_hint_id = NULL WHERE team_id = ?',
        [teamId]
      );
      connection.release();
      return res.json({
        success: true,
        found: true,
        foundCount,
        message: 'goal_reached',
        nextHintId: null
      });
    }

    // Assign next hint (simplified - just get any unassigned hint)
    const [nextHints] = await connection.query(
      `SELECT hint_id FROM hints 
       WHERE hint_id NOT IN (SELECT hint_id FROM found WHERE team_id = ?)
       LIMIT 1`,
      [teamId]
    );

    let nextHintId = null;
    if (nextHints.length > 0) {
      nextHintId = nextHints[0].hint_id;
      await connection.query(
        'UPDATE easter_teams SET current_hint_id = ? WHERE team_id = ?',
        [nextHintId, teamId]
      );
    } else {
      await connection.query(
        'UPDATE easter_teams SET current_hint_id = NULL WHERE team_id = ?',
        [teamId]
      );
    }

    connection.release();

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
