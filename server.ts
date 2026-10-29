import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { handleSendOtp, handleVerifyOtp, getSessionUser } from './src/server/apiHandler.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    appName: 'Blouse Gallery & Ladies Fashion',
    authProvider: 'Phone OTP Authentication',
    timestamp: new Date().toISOString(),
  });
});

// Send OTP
app.post('/api/auth/send-otp', (req, res) => {
  try {
    const { phone } = req.body;
    const result = handleSendOtp(phone);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to send OTP' });
  }
});

// Verify OTP
app.post('/api/auth/verify-otp', (req, res) => {
  try {
    const { phone, otp, userProfile } = req.body;
    const result = handleVerifyOtp(phone, otp, userProfile);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Invalid OTP' });
  }
});

// Session Check
app.get('/api/auth/session', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No session token provided' });
  }
  const token = authHeader.split(' ')[1];
  const user = getSessionUser(token);
  if (!user) {
    return res.status(401).json({ error: 'Session expired or invalid' });
  }
  res.json({ user });
});

// In production, serve dist folder
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[Blouse Gallery Server] Running on http://localhost:${PORT}`);
});
