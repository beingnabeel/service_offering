const jwt = require('jsonwebtoken');
const { promisify } = require('util');

/**
 * Authentication middleware to protect routes
 * Verifies JWT token and attaches user data to request
 */

exports.authenticate = async (req, res, next) => {
  // 1) Get token from header
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'You are not logged in. Please log in to get access.',
    });
  }

  try {
    // 2) Verify token
    // Use JWT_ACCESS_SECRET (same as user-management service) with fallback
    const jwtSecret = process.env.JWT_ACCESS_SECRET || 'your_access_secret_key';
    const decoded = await promisify(jwt.verify)(token, jwtSecret);

    // 3) Check if token is expired
    const currentTime = Date.now() / 1000;
    if (decoded.exp < currentTime) {
      return res.status(401).json({
        success: false,
        message: 'Your token has expired. Please login again.',
      });
    }

    // 4) Attach user data to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    // Grant access to protected route
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token. Please login again.',
    });
  }
};

/**
 * Authorization middleware to restrict access based on user role
 * @param  {...String} roles - Allowed roles for the route
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // Check if user role is in the allowed roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action',
      });
    }
    next();
  };
};
