import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Alert } from '@mui/material';
import QrScanner from 'qr-scanner';

function QRScanner({ onScan, disabled }) {
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!videoRef.current) return;

    const scanner = new QrScanner(
      videoRef.current,
      (result) => {
        if (!disabled) {
          onScan(result.data);
        }
      },
      {
        preferredCamera: 'environment',
        highlightScanRegion: true,
        highlightCodeOutline: true,
      }
    );

    scannerRef.current = scanner;

    scanner.start().catch((err) => {
      console.error('QR Scanner start error:', err);
      setError('Could not access camera. Please allow camera permissions.');
    });

    return () => {
      scanner.stop();
      scanner.destroy();
    };
  }, []);

  useEffect(() => {
    if (scannerRef.current) {
      if (disabled) {
        scannerRef.current.pause();
      } else {
        scannerRef.current.start().catch(() => {});
      }
    }
  }, [disabled]);

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box sx={{ width: '100%', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
        <video
          ref={videoRef}
          style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '8px' }}
        />
      </Box>
      <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block' }}>
        Point your camera at a QR code to scan
      </Typography>
    </Box>
  );
}

export default QRScanner;
