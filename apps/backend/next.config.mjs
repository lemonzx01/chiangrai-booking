/** @type {import('next').NextConfig} */
const nextConfig = {
  // Backend is API-only
  // We keep app router with only src/app/api routes.
  
  // ปิด ESLint ตอน build เพราะ backend เป็น API only
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig

