import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Everything runs client-side; no image optimization domains or rewrites needed.
}

export default nextConfig