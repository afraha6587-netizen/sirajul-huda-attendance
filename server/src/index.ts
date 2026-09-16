import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes/api';
import { ensureAdminSeeded } from './seed';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root Welcome Route (Fixes 'Cannot GET /' in browser)
app.get('/', (_req, res) => {
  res.json({
    institution: 'Sirajul Huda College of Science and Integrated Studies, Nadapuram',
    system: 'College Attendance Management System API',
    status: 'ONLINE & HEALTHY',
    timestamp: new Date().toISOString(),
    endpoints: {
      portal: '/api/public/student-attendance',
      academicMonths: '/api/public/academic-months',
      login: '/api/auth/login',
    },
  });
});

// API Routes
app.use('/api', apiRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, async () => {
  console.log(`🚀 College Attendance Server running on port ${PORT}`);
  try {
    await ensureAdminSeeded();
  } catch (err) {
    console.error('Failed to auto-seed admin on startup:', err);
  }
});
