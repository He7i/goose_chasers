const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/png', 'image/jpeg', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Add hint
router.post('/hints/add', upload.fields([{ name: 'hintImage' }, { name: 'eggImage' }]), async (req, res) => {
  try {
    const { qrId, solutionQrId } = req.body;

    if (!qrId || !solutionQrId) {
      return res.status(400).json({ error: 'QR ID and Solution QR ID required' });
    }

    const hintImageBuffer = req.files?.hintImage?.[0]?.buffer;
    const eggImageBuffer = req.files?.eggImage?.[0]?.buffer;

    const connection = await pool.getConnection();
    const [result] = await connection.query(
      'INSERT INTO hints (qr_id, hint_image, egg_image, solution_qr_id) VALUES (?, ?, ?, ?)',
      [qrId, hintImageBuffer, eggImageBuffer, solutionQrId]
    );
    connection.release();

    res.status(201).json({ success: true, hintId: result.insertId });
  } catch (error) {
    console.error('Add hint error:', error);
    res.status(500).json({ error: 'Failed to add hint' });
  }
});

// Update hint image
router.post('/hints/:hintId/image', upload.single('hintImage'), async (req, res) => {
  try {
    const { hintId } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const connection = await pool.getConnection();
    await connection.query(
      'UPDATE hints SET hint_image = ? WHERE hint_id = ?',
      [req.file.buffer, hintId]
    );
    connection.release();

    res.json({ success: true });
  } catch (error) {
    console.error('Update hint image error:', error);
    res.status(500).json({ error: 'Failed to update image' });
  }
});

// Update egg image
router.post('/hints/:hintId/egg', upload.single('eggImage'), async (req, res) => {
  try {
    const { hintId } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const connection = await pool.getConnection();
    await connection.query(
      'UPDATE hints SET egg_image = ? WHERE hint_id = ?',
      [req.file.buffer, hintId]
    );
    connection.release();

    res.json({ success: true });
  } catch (error) {
    console.error('Update egg image error:', error);
    res.status(500).json({ error: 'Failed to update image' });
  }
});

// Delete hint
router.delete('/hints/:hintId', async (req, res) => {
  try {
    const { hintId } = req.params;
    const connection = await pool.getConnection();
    await connection.query('DELETE FROM hints WHERE hint_id = ?', [hintId]);
    connection.release();

    res.json({ success: true });
  } catch (error) {
    console.error('Delete hint error:', error);
    res.status(500).json({ error: 'Failed to delete hint' });
  }
});

// Get all hints
router.get('/hints', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [hints] = await connection.query(
      'SELECT h.hint_id, h.qr_id, h.solution_qr_id, q.code FROM hints h JOIN qr_codes q ON h.qr_id = q.qr_id ORDER BY h.hint_id DESC'
    );
    connection.release();

    res.json({ hints });
  } catch (error) {
    console.error('Get hints error:', error);
    res.status(500).json({ error: 'Failed to get hints' });
  }
});

// Add QR code
router.post('/qrcodes/add', upload.single('qrImage'), async (req, res) => {
  try {
    const { code, location } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'QR code required' });
    }

    const qrImageBuffer = req.file?.buffer;

    const connection = await pool.getConnection();
    const [result] = await connection.query(
      'INSERT INTO qr_codes (code, location, qr_code_data) VALUES (?, ?, ?)',
      [code, location || null, qrImageBuffer]
    );
    connection.release();

    res.status(201).json({ success: true, qrId: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'QR code already exists' });
    }
    console.error('Add QR code error:', error);
    res.status(500).json({ error: 'Failed to add QR code' });
  }
});

// Delete QR code
router.delete('/qrcodes/:qrId', async (req, res) => {
  try {
    const { qrId } = req.params;
    const connection = await pool.getConnection();
    await connection.query('DELETE FROM qr_codes WHERE qr_id = ?', [qrId]);
    connection.release();

    res.json({ success: true });
  } catch (error) {
    console.error('Delete QR code error:', error);
    res.status(500).json({ error: 'Failed to delete QR code' });
  }
});

// Get all teams
router.get('/teams', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [teams] = await connection.query(
      `SELECT t.team_id, t.team_name, COUNT(f.hint_id) as found_count 
       FROM easter_teams t 
       LEFT JOIN found f ON t.team_id = f.team_id 
       GROUP BY t.team_id, t.team_name 
       ORDER BY t.created_at DESC`
    );
    connection.release();

    res.json({ teams });
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ error: 'Failed to get teams' });
  }
});

module.exports = router;
