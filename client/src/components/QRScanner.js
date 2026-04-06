import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Typography, Alert } from '@mui/material';
import { Html5QrcodeScanner } from 'html5-qrcode';

function QRScanner({ onScan, disabled }) {
  const scannerRef = useRef(null);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (!scanning && scannerRef.current) {
      const scanner = new Html5QrcodeScanner('qr-scanner', {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      });

      scanner.render(
        (decodedText) => {
          onScan(decodedText);
          setError('');
        },
        (error) => {
          console.log('QR scan error:', error);
        }
      );

      setScanning(true);

      return () => {
        scanner.clear().catch((err) => console.log('Scanner cleanup error:', err));
      };
    }
  }, [onScan, scanning]);

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box id="qr-scanner" sx={{ width: '100%', borderRadius: '8px', overflow: 'hidden' }} />
      <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block' }}>
        Point your camera at a QR code to scan
      </Typography>
    </Box>
  );
}

export default QRScanner;
