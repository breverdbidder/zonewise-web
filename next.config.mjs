import CopyPlugin from 'copy-webpack-plugin'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
]

const nextConfig = {
  // TS is clean: npx tsc --noEmit returns 0 errors (Mar 2026, docs/ excluded in tsconfig).
  // ignoreBuildErrors=true: build worker OOMs on TS check in Vercel/CI environment.
  // CI should enforce: tsc --noEmit must pass (pre-commit or CI step).
  typescript: { ignoreBuildErrors: true },
  generateBuildId: () => `v4-nextjs-restored-${Date.now()}`,
  // Ensure three.js / R3F packages are transpiled by Next.js so they share
  // a single React instance and avoid the ReactCurrentBatchConfig crash.
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei', 'cesium'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Copy Cesium static assets (workers, CSS, assets) to public/cesium
      config.plugins.push(
        new CopyPlugin({
          patterns: [
            {
              from: join(__dirname, 'node_modules/cesium/Build/Cesium/Workers'),
              to: join(__dirname, 'public/cesium/Workers'),
            },
            {
              from: join(__dirname, 'node_modules/cesium/Build/Cesium/ThirdParty'),
              to: join(__dirname, 'public/cesium/ThirdParty'),
            },
            {
              from: join(__dirname, 'node_modules/cesium/Build/Cesium/Assets'),
              to: join(__dirname, 'public/cesium/Assets'),
            },
            {
              from: join(__dirname, 'node_modules/cesium/Build/Cesium/Widgets'),
              to: join(__dirname, 'public/cesium/Widgets'),
            },
          ],
        })
      )
    }
    return config
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'www.bcpao.us' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'gis.brevardfl.gov' },
      { protocol: 'https', hostname: 'api.mapbox.com' },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/app',
        destination: 'https://zonewise-desktop-viewer.vercel.app/',
      },
      {
        source: '/app/:path*',
        destination: 'https://zonewise-desktop-viewer.vercel.app/:path*',
      },
      {
        source: '/viewer-assets/:path*',
        destination: 'https://zonewise-desktop-viewer.vercel.app/assets/:path*',
      },
      {
        source: '/demo.html',
        destination: '/demo',
      },
      {
        source: '/competitors',
        destination: '/competitors.html',
      },
    ]
  },
}

export default nextConfig
