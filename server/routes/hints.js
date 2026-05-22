const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

// Get next hint for a game
// If ordered = true → return first by order_index
// If ordered = false/null → return a random hint
router.get('/next/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;

    // Check if this game's hints are ordered
    const checkResult = await pool.query(
      'SELECT ordered FROM hints WHERE game_id = $1 LIMIT 1',
      [gameId]
    );

    if (checkResult.rows.length === 0) {
      return res.json({ hint: null, message: 'No hints for this game' });
    }

    const isOrdered = checkResult.rows[0].ordered === true;
    let hintResult;

    if (isOrdered) {
      hintResult = await pool.query(
        `SELECT id, text_hint, order_index, ordered,
                image_hint IS NOT NULL AS has_image
         FROM hints
         WHERE game_id = $1
         ORDER BY order_index ASC
         LIMIT 1`,
        [gameId]
      );
    } else {
      hintResult = await pool.query(
        `SELECT id, text_hint, order_index, ordered,
                image_hint IS NOT NULL AS has_image
         FROM hints
         WHERE game_id = $1
         ORDER BY random()
         LIMIT 1`,
        [gameId]
      );
    }

    if (hintResult.rows.length === 0) {
      return res.json({ hint: null, message: 'No hints available' });
    }

    res.json({ hint: hintResult.rows[0] });
  } catch (error) {
    console.error('Get next hint error:', error);
    res.status(500).json({ error: 'Failed to get next hint' });
  }
});

// Get hint image
router.get('/image/:hintId', async (req, res) => {
  try {
    const { hintId } = req.params;
    const result = await pool.query(
      'SELECT image_hint FROM hints WHERE id = $1',
      [hintId]
    );

    if (result.rows.length === 0 || !result.rows[0].image_hint) {
      return res.status(404).json({ error: 'Image not found' });
    }

    res.setHeader('Content-Type', 'image/png');
    res.send(result.rows[0].image_hint);
  } catch (error) {
    console.error('Get hint image error:', error);
    res.status(500).json({ error: 'Failed to get image' });
  }
});

module.exports = router;
