/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // Proxy all /api/* calls to the backend deployment
    // Set BACKEND_URL in Vercel env (e.g. https://your-backend.vercel.app)
    const backend = process.env.BACKEND_URL
    if (!backend) return []

    return [
      {
        source: '/api/:path*',
        destination: `${backend}/api/:path*`,
      },
    ]
  },
}

export default nextConfig

