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
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
  // EG14 P2 fix v6 (Apr 9 2026): tree-shake barrel imports from lucide-react,
  // radix-ui, recharts, date-fns. Targets the 89% unused JS in chunks/5205
  // (28.7KB wasted) and chunks/7079 (26.5KB wasted) flagged by Lighthouse v5.
  // Common 30-50% bundle reduction for these packages on Next.js 14+.
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-tabs',
      '@radix-ui/react-accordion',
      'date-fns',
      'recharts',
    ],
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
    ]
  },
}

export default nextConfig
