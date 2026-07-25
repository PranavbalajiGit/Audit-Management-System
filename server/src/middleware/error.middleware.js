const { errorResponse } = require('../shared/response/responseFormatter');

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log error (in production this could go to a logging service)
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[Error Handler] ${err.stack}`);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate value for field '${field}'. Please use another value.`;
    return res.status(409).json(errorResponse(message, [{ field, code: 'DUPLICATE_KEY' }]));
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(el => ({
      field: el.path,
      message: el.message,
      code: 'VALIDATION_ERROR'
    }));
    return res.status(422).json(errorResponse('Validation failed', errors));
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    const message = `Invalid value for path '${err.path}': ${err.value}`;
    return res.status(400).json(errorResponse(message, [{ field: err.path, code: 'INVALID_ID' }]));
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(errorResponse('Invalid token. Please log in again.', [{ code: 'TOKEN_INVALID' }]));
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(errorResponse('Token expired. Please log in again.', [{ code: 'TOKEN_EXPIRED' }]));
  }

  // Custom AppError or other operational errors
  if (err.isOperational) {
    return res.status(err.statusCode).json(errorResponse(err.message, err.errors));
  }

  // Fallback for non-operational/unknown errors
  const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
  return res.status(500).json(errorResponse(message));
};

module.exports = errorHandler;
