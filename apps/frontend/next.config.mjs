/** @type {import('next').NextConfig} */
const nextConfig = {
  // ============================================================
  // Compiler / output tweaks
  // ============================================================
  // Strip console.* from production bundles (keeps console.error
  // for runtime errors so Sentry/Vercel can pick them up).
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? { exclude: ['error', 'warn'] }
        : false,
  },

  // Reduce hydration cost — the indirection layer for
  // styled-components / emotion isn't used here.
  reactStrictMode: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,

  // ============================================================
  // Backend rewrite (Vercel two-project deploy)
  // ============================================================
  async rewrites() {
    const backend = process.env.BACKEND_URL
    if (!backend) return []
    return [
      {
        source: '/api/:path*',
        destination: `${backend}/api/:path*`,
      },
    ]
  },

  // ============================================================
  // Headers — security baseline + static-asset cache
  // ============================================================
  //
  // Security headers go on every route. They follow OWASP's
  // 2024 baseline:
  //   - HSTS forces HTTPS for 2 years incl. subdomains
  //   - X-Frame-Options blocks clickjacking via iframes
  //   - Referrer-Policy: strict-origin-when-cross-origin lets
  //     same-origin requests carry the full URL (useful for
  //     analytics) but strips the path on cross-origin
  //   - Permissions-Policy disables sensors we don't use,
  //     so a future XSS can't promote itself to camera/mic
  //   - Content-Security-Policy is permissive enough for
  //     Next.js + Stripe + i18n + Unsplash + Supabase storage
  //     while still blocking unexpected origins. Inline scripts
  //     and styles need 'unsafe-inline' because Next.js relies
  //     on them; tightening further would require nonces and
  //     a much more invasive refactor.
  //
  // CSP TODO: switch to nonce-based once we move off
  // 'unsafe-inline' (planned post-launch).
  async headers() {
    const securityHeaders = [
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      {
        key: 'Permissions-Policy',
        value:
          'camera=(), microphone=(), geolocation=(), payment=(self), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
      },
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://*.vercel.app",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com data:",
          "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://*.stripe.com",
          "connect-src 'self' https://*.supabase.co https://api.stripe.com https://*.vercel.app",
          "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com",
          "frame-ancestors 'none'",
          "base-uri 'self'",
          "form-action 'self' https://checkout.stripe.com",
          'upgrade-insecure-requests',
        ].join('; '),
      },
    ]

    return [
      // Default: every route gets the security baseline
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      // Static asset cache (24h)
      {
        source: '/(icon-.*\\.png|apple-touch-icon\\.png|og-image\\.png|logo\\.png)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, must-revalidate',
          },
        ],
      },
      // PWA / SEO files (1h)
      {
        source: '/(robots\\.txt|sitemap\\.xml|manifest\\.webmanifest)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate',
          },
        ],
      },
    ]
  },

  // ============================================================
  // Image optimization
  // ============================================================
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    // Modern formats: AVIF first (smaller), then WebP fallback.
    // Browsers that support neither get the original.
    formats: ['image/avif', 'image/webp'],
    // Tighter device size set — drops the unused 256/384/640 entries
    // and adds 1080/1280 which match common phone screens.
    deviceSizes: [640, 750, 828, 1080, 1200, 1280, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Keep optimized images in the CDN edge cache for a day.
    minimumCacheTTL: 86400,
  },
}

export default nextConfig
