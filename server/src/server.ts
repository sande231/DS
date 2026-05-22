import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import ocrRouter from './routes/ocr';
import emailRouter from './routes/email';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Increase JSON payload limit for base64 image uploads (~10MB image -> ~13MB base64)
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      anthropicKey: !!process.env.ANTHROPIC_API_KEY,
      smtp: !!process.env.RESEND_API_KEY,
    },
  });
});

// Routes
app.use('/api/ocr', ocrRouter);
app.use('/api/email', emailRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found.',
  });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Server] Unhandled error:', err.message);
  res.status(500).json({
    success: false,
    error: 'An unexpected server error occurred.',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

app.listen(PORT, () => {
  console.log(`[Server] Sales Capture backend running on port ${PORT}`);
  console.log(`[Server] Health check: http://localhost:${PORT}/health`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('[Server] WARNING: ANTHROPIC_API_KEY is not set. OCR will fail.');
  }
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[Server] WARNING: SMTP configuration is incomplete. Email sending will fail.');
  }
});

export default app;
