/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  images: {
    domains: ['bizcore.test', 'localhost', '127.0.0.1'],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['lucide-react'],
  // Enable compression for faster response times
  compress: true,
  // Configure turbopack (replaces experimental.turbo)
  turbopack: {
    resolveAlias: {
      '@': './app',
    },
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