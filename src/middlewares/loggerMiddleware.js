/**
 * Logger middleware for HTTP request/response logging
 */

const {
  logger,
  errorLogger,
  requestLogger,
  performanceLogger,
  generateRequestId
} = require('../utils/logger');

/**
 * Middleware to log all incoming requests
 */
const logRequest = (req, res, next) => {
  // Generate unique request ID and attach to request object
  const requestId = generateRequestId(req);
  req.requestId = requestId;
  
  // Log request details
  logger.info({
    message: 'Incoming request',
    metadata: {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      requestId,
      userAgent: req.get('user-agent')
    }
  });
  
  next();
};

/**
 * Middleware to log performance metrics
 */
const logPerformance = (req, res, next) => {
  const start = process.hrtime();
  
  // Once response finishes, log performance metrics
  res.on('finish', () => {
    const diff = process.hrtime(start);
    const duration = (diff[0] * 1e9 + diff[1]) / 1e6; // Convert to milliseconds
    
    logger.http({
      message: 'Request completed',
      metadata: {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration: `${duration.toFixed(2)}ms`,
        requestId: req.requestId
      }
    });
  });
  
  next();
};

/**
 * Middleware to log errors
 */
const logError = (err, req, res, next) => {
  // Use the error logger from logger utility
  errorLogger(err, req, res, next);
};

module.exports = {
  logRequest,
  logPerformance,
  logError
};
