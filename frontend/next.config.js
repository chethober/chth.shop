/** Where the Express API runs, as seen from the Next.js server. */
const BACKEND_URL = (process.env.BACKEND_URL || 'http://localhost:5000').replace(/\/+$/, '')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
  images: {
    // Product images can come from the API or any HTTPS host.
    unoptimized: true,
  },
  // The browser only ever talks to this origin; Next forwards API calls to the backend.
  // This keeps OAuth redirects, cookies and CORS working from any device or domain.
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${BACKEND_URL}/api/:path*` },
      { source: '/uploads/:path*', destination: `${BACKEND_URL}/uploads/:path*` },
    ]
  },
}

module.exports = nextConfig
