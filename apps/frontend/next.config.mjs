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
  // Static asset cache headers — long, immutable for /_next/static
  // (already default), and a sensible 24h for /icons + manifest
  // so PWA reinstalls don't refetch them every load.
  // ============================================================
  async headers() {
    return [
      {
        source: '/(icon-.*\\.png|apple-touch-icon\\.png|og-image\\.png|logo\\.png)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, must-revalidate',
          },
        ],
      },
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
