/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.vercel.app' },
      { protocol: 'https', hostname: '**.vercel.com' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: '127.0.0.1' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [320, 480, 640, 768, 1024, 1280, 1440, 1536],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['lucide-react'],
  compress: true,
  // Increase body size limit to handle payment proof uploads
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 5,
  },
  // CORS headers for handling requests from different origins
  async headers() {
    const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || (process.env.NODE_ENV === 'production' ? '' : '*')
    if (process.env.NODE_ENV === 'production' && (!allowedOrigin || allowedOrigin === '*')) {
      throw new Error('[CORS] NEXT_PUBLIC_APP_URL or NEXTAUTH_URL must be set to a concrete origin in production (e.g., https://bizcore.test). Using wildcard or leaving blank is not allowed.')
    }
    const allowCredentials = !!allowedOrigin && allowedOrigin !== '*'
    const corsHeaders = [
      { key: 'Access-Control-Allow-Origin', value: allowedOrigin },
      { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
      { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' }
    ]
    if (allowCredentials) {
      corsHeaders.unshift({ key: 'Access-Control-Allow-Credentials', value: 'true' })
    }

    return [
      {
        source: '/api/:path*',
        headers: [
          ...corsHeaders,
        ],
      },
      // Next.js assets
      {
        source: '/_next/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: allowedOrigin },
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
        ],
      },
    ]
  },
}

module.exports = nextConfig