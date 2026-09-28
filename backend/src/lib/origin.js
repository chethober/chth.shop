const env = require('../config/env');

// Private-network hosts, so phones and other devices on the LAN work in development.
const LOCAL_HOST_PATTERN =
  /^(localhost|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|[\w-]+\.local)$/;

/**
 * Whether we may send users (and their login tokens) back to `origin`.
 * Production: only origins listed in FRONTEND_URL. Development: also any private-network host.
 */
function isAllowedOrigin(origin) {
  if (!origin) return false;
  if (env.frontendUrls.includes(origin)) return true;
  if (env.isProduction) return false;
  try {
    return LOCAL_HOST_PATTERN.test(new URL(origin).hostname);
  } catch {
    return false;
  }
}

/**
 * The frontend origin this request came through. The frontend proxies `/api` to this server,
 * so the browser-facing host arrives in X-Forwarded-Host. Falls back to the first FRONTEND_URL.
 */
function frontendOrigin(req) {
  const host = req.get('x-forwarded-host') || req.get('host');
  const proto = (req.get('x-forwarded-proto') || req.protocol).split(',')[0].trim();
  const origin = `${proto}://${host}`;
  return isAllowedOrigin(origin) ? origin : env.frontendUrls[0];
}

module.exports = { isAllowedOrigin, frontendOrigin };
