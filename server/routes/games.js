const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

// Look up game by join_code and return associated teams
router.get('/join/:joinCode', async (req, res) => {
  try {
    const { joinCode } = req.params;

    // Find the game by join_code
    const gameResult = await pool.query(
      'SELECT id, title, game_type, is_active FROM games WHERE join_code = $1',
      [joinCode]
    );

    if (gameResult.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const game = gameResult.rows[0];

    if (!game.is_active) {
      return res.status(400).json({ error: 'This game is no longer active' });
    }

    // Find teams linked to this game
    const teamsResult = await pool.query(
      'SELECT team_id, team_name FROM teams WHERE game_id = $1 ORDER BY team_name ASC',
      [game.id]
    );

    res.json({
      game: {
        id: game.id,
        title: game.title,
        gameType: game.game_type,
      },
      teams: teamsResult.rows,
    });
  } catch (error) {
    console.error('Game lookup error:', error);
    res.status(500).json({ error: 'Failed to look up game' });
  }
});

module.exports = router;
