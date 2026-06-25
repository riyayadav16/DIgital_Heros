require('dotenv').config();

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.warn('[Startup] WARNING: JWT_SECRET is missing or too short (min 32 chars). Authentication endpoints will fail until this is configured.');
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const app = express();

const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.FRONTEND_URL].filter(Boolean)
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'];

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      scriptSrc: ["'self'"],
      connectSrc: [
  "'self'",
  "http://localhost:5000",
  "https://d-igital-heros-git-main-riya18.vercel.app",
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [])
],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({ origin: allowedOrigins, credentials: true }));

const uploadDir = process.env.UPLOAD_DIR || 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use((req, res, next) => {
  console.log(`[Express] ${req.method} ${req.originalUrl}`);
  next();
});
app.use('/uploads', express.static(path.join(__dirname, '..', uploadDir)));

const routeFiles = [
  { path: '/api/auth', limiter: authLimiter, file: './routes/auth.routes', name: 'Auth' },
  { path: '/api/scores', limiter: apiLimiter, file: './routes/score.routes', name: 'Scores' },
  { path: '/api/subscriptions', limiter: apiLimiter, file: './routes/subscription.routes', name: 'Subscriptions' },
  { path: '/api/draws', limiter: apiLimiter, file: './routes/draw.routes', name: 'Draws' },
  { path: '/api/admin', limiter: apiLimiter, file: './routes/admin.routes', name: 'Admin' },
  { path: '/api/charities', limiter: apiLimiter, file: './routes/charity.routes', name: 'Charities' },
];

console.log('[Startup] Registering routes...');
for (const r of routeFiles) {
  try {
    const router = require(r.file);
    app.use(r.path, r.limiter, router);
    console.log(`[Routes] Mounted ${r.name} at ${r.path}`);
  } catch (err) {
    console.error(`[Routes] FAILED to mount ${r.name} at ${r.path}: ${err.message}`);
  }
}
console.log('[Startup] Route registration complete');

// Health check
app.get('/api/health', (req, res) => res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } }));

// 404 handler
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('[Express Error]', err.stack);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  res.status(statusCode).json({ success: false, message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Digital Heroes API running on http://localhost:${PORT}`);
});

module.exports = app;
