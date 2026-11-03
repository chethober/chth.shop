const prisma = require('../lib/prisma');
const { verifyToken } = require('../lib/tokens');
const { HttpError } = require('../lib/http');

function readBearerToken(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  return scheme === 'Bearer' && token ? token : null;
}

async function resolveUser(token) {
  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (error) {
    throw new HttpError(401, error.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token');
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
  if (!user) throw new HttpError(401, 'Invalid token - user not found');
  return user;
}

/** Rejects the request unless it carries a valid token for an existing user. */
async function requireAuth(req, res, next) {
  try {
    const token = readBearerToken(req);
    if (!token) throw new HttpError(401, 'Access token is required');

    const user = await resolveUser(token);
    req.user = user;
    req.userId = user.id;
    next();
  } catch (error) {
    next(error);
  }
}

/** Attaches the user when a valid token is present; never rejects. */
async function optionalAuth(req, res, next) {
  const token = readBearerToken(req);
  if (token) {
    try {
      const user = await resolveUser(token);
      req.user = user;
      req.userId = user.id;
    } catch {
      // Anonymous access is fine here.
    }
  }
  next();
}

/** Use after `requireAuth`: only platform admins may continue. */
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'ADMIN') return next(new HttpError(403, 'Admins only'));
  next();
}

module.exports = { requireAuth, optionalAuth, requireAdmin };
