'use strict';

/**
 * Central Express error handler.
 * Must be registered as the LAST middleware in server.js.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err.stack);

  // Handle known operational errors with a specific status
  const status = err.status || 500;

  res.status(status).json({
    error: 'Internal server error',
    message: err.message,
  });
}

module.exports = errorHandler;
