const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/error.middleware');
const { successResponse } = require('./shared/response/responseFormatter');
const AppError = require('./shared/errors/appError');
const apiRouter = require('./routes');

const app = express();

// Set security HTTP headers.
// crossOriginResourcePolicy must be 'cross-origin' so the client dev origin
// (http://localhost:5173) can actually render uploaded images served from the
// API origin (http://localhost:5001/uploads/...).
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Enable CORS
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Development logging
if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve local uploaded files static directory
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/v1/auth/login', authLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json(successResponse('Server is healthy', {
    uptime: process.uptime(),
    timestamp: new Date(),
    env: process.env.NODE_ENV
  }));
});

// Main API v1 routing
app.use('/api/v1', apiRouter);

// Handle undefined routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
