const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

// Get all QR codes (admin)
router.get('/all', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [qrcodes] = await connection.query(
      'SELECT qr_id, code, location FROM qr_codes ORDER BY qr_id DESC'
    );
    connection.release();

    res.json({ qrcodes });
  } catch (error) {
    console.error('Get QR codes error:', error);
    res.status(500).json({ error: 'Failed to get QR codes' });
  }
});

// Get QR code image
router.get('/image/:qrId', async (req, res) => {
  try {
    const { qrId } = req.params;
    const connection = await pool.getConnection();

    const [qrcodes] = await connection.query(
      'SELECT qr_code_data FROM qr_codes WHERE qr_id = ?',
      [qrId]
    );
    connection.release();

    if (qrcodes.length === 0 || !qrcodes[0].qr_code_data) {
      return res.status(404).json({ error: 'QR code image not found' });
    }

    res.setHeader('Content-Type', 'image/png');
    res.send(qrcodes[0].qr_code_data);
  } catch (error) {
    console.error('Get QR image error:', error);
    res.status(500).json({ error: 'Failed to get QR image' });
  }
});

module.exports = router;
