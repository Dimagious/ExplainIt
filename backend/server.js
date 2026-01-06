/**
 * ExplainIt! Backend Server
 * US-013: Express Server Setup (EPIC-003)
 * TASK-054: Create server.js entry point
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const explainRoutes = require('./routes/explain');
const mockRoutes = require('./routes/mock');
const errorHandler = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimit');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// TASK-054: Security middleware
app.use(helmet());

// TASK-055: CORS configuration (allow Chrome extensions)
app.use(cors({
  origin: [
    /^chrome-extension:\/\//,
    /^moz-extension:\/\//,
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));

// TASK-056: Health check endpoint (skip rate limiting)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    uptime: process.uptime()
  });
});

// TASK-092: Apply rate limiting to API routes only
app.use('/api', rateLimiter);

// US-014: API routes
app.use('/api/v1', explainRoutes);

// Mock routes for testing without OpenAI quota
app.use('/api/v1', mockRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    code: 'NOT_FOUND',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// TASK-086: Error handling middleware (must be last)
app.use(errorHandler);

// TASK-057: Graceful shutdown
const server = app.listen(PORT, () => {
  console.log(`🚀 ExplainIt! Backend running on port ${PORT}`);
  console.log(`📝 Environment: ${NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 API endpoint: http://localhost:${PORT}/api/v1/explain`);
  console.log(`🧪 Mock endpoint: http://localhost:${PORT}/api/v1/mock-explain`);
  
  // Validate OpenAI API key is present
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  WARNING: OPENAI_API_KEY not set in environment!');
  } else {
    console.log('✅ OpenAI API key loaded');
  }
});

// Graceful shutdown handler
process.on('SIGTERM', () => {
  console.log('📛 SIGTERM received, closing server gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
  
  // Force close after 5 seconds
  setTimeout(() => {
    console.error('⚠️  Forced shutdown after timeout');
    process.exit(1);
  }, 5000);
});

module.exports = app;

