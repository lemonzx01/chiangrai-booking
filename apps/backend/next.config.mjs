/** @type {import('next').NextConfig} */
const nextConfig = {
  // Backend is API-only — only src/app/api routes ship.

  // ปิด ESLint ตอน build เพราะ backend เป็น API only
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Strip console.log/info from production bundles. Keeps
  // console.error/warn so server errors still reach Vercel
  // logs / future Sentry transport.
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? { exclude: ['error', 'warn'] }
        : false,
  },

  poweredByHeader: false,
  productionBrowserSourceMaps: false,

  // Default headers for every API response —
  //   - Vary: Cookie  → caches that key on auth status do the right thing
  //   - X-Content-Type-Options: nosniff → blocks MIME-confusion attacks
  // Per-route cache headers are set inside individual route.ts files
  // since most endpoints are user-specific and shouldn't cache.
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Vary', value: 'Cookie, Accept-Encoding' },
        ],
      },
    ]
  },
}

export default nextConfig
