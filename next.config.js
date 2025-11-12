/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  images: {
    domains: ['localhost'],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Enable compression for faster response times
  compress: true,
  // Configure turbopack (replaces experimental.turbo)
  turbopack: {
    resolveAlias: {
      '@': './app',
    },
  },
}

module.exports = nextConfig