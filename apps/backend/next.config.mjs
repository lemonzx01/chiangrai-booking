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

  // Default headers for every API response.
  // Even though this is API-only, defense-in-depth headers
  // matter — a misconfigured frontend embedding an iframe of
  // /api still shouldn't expose the response, and cookies
  // should never leak via Referer.
  //
  //   - HSTS: force HTTPS, includeSubDomains
  //   - Vary: Cookie + Accept-Encoding so caches segment
  //     by auth + encoding
  //   - X-Content-Type-Options: nosniff (MIME confusion)
  //   - X-Frame-Options: DENY (no iframe embedding)
  //   - Referrer-Policy: no-referrer (API responses shouldn't
  //     leak any URL info via Referer headers)
  //   - Permissions-Policy: empty (API has no sensors)
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), usb=()',
          },
          { key: 'Vary', value: 'Cookie, Accept-Encoding' },
        ],
      },
    ]
  },
}

export default nextConfig
