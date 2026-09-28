const env = require('../config/env');

function notFound(req, res) {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
}

// Prisma error codes that describe a client problem rather than a server fault.
const PRISMA_CLIENT_ERRORS = {
  P2003: [409, 'This item is part of existing orders and cannot be deleted'],
  P2025: [404, 'Record not found'],
};

// eslint-disable-next-line no-unused-vars
function errorHandler(error, req, res, next) {
  if (error.status && error.status < 500) {
    return res.status(error.status).json({ success: false, message: error.message });
  }

  const prismaError = PRISMA_CLIENT_ERRORS[error.code];
  if (prismaError) {
    const [status, message] = prismaError;
    return res.status(status).json({ success: false, message });
  }

  console.error(`${req.method} ${req.originalUrl} failed:`, error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(env.isDevelopment && { error: error.message }),
  });
}

module.exports = { notFound, errorHandler };
