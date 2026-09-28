/** An error that maps directly to an HTTP response. */
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Wraps an async route handler so rejected promises reach the error middleware. */
const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

/** Sends the standard success envelope: `{ success, message?, data? }`. */
function sendSuccess(res, { status = 200, message, data } = {}) {
  const body = { success: true };
  if (message) body.message = message;
  if (data !== undefined) body.data = data;
  return res.status(status).json(body);
}

module.exports = { HttpError, asyncHandler, sendSuccess };
