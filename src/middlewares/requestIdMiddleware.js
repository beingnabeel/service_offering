const { v4: uuidv4 } = require('uuid');

/**
 * Middleware to generate and attach a unique request ID to each request
 * The ID is accessible via req.requestId and also set in global.requestId
 */
const requestIdMiddleware = (req, res, next) => {
  // Generate a unique ID for this request (using UUID v4)
  const requestId = uuidv4();

  // Attach it to the request object
  req.requestId = requestId;

  // Set it in global scope for this request lifecycle
  // This makes it accessible to the responseFormatter
  global.requestId = requestId;

  // Add it as a response header too for client-side tracking
  res.setHeader('X-Request-ID', requestId);

  // Log the request with its ID
  console.log(`[${requestId}] ${req.method} ${req.originalUrl}`);

  // Clean up global state after response is sent
  res.on('finish', () => {
    global.requestId = null;
  });

  next();
};

module.exports = requestIdMiddleware;
