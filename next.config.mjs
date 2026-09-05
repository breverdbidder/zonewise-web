/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
  // microphone=(self): required for the ElevenLabs Voice Draftsman widget on
  // /floorplan (see middleware.ts for the matching CSP fix). This is the
  // static next.config fallback; middleware.ts sets the enforced value.
  { key: 'Permissions-Policy', value: 'geolocation=(self), payment=(self \"https://js.stripe.com\"), camera=(), microphone=(self), interest-cohort=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
]

const nextConfig = {
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
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
      {
        // Ported from vercel.json (Vercel -> Cloudflare exit, issue #20026).
        // vercel.json applied this + a duplicate set of security headers to
        // ALL routes; the security headers are already covered by
        // securityHeaders above, so only the version marker is added here to
        // avoid emitting duplicate header lines.
        source: '/(.*)',
        headers: [
          { key: 'X-ZoneWise-Version', value: 'v4-nextjs-restored' },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
    ]
  },
  images: {
    // Cloudflare Workers (workerd) cannot run Vercel's Node/sharp-based image
    // optimizer -- this is a platform constraint, not a preference, and
    // applies regardless of remotePatterns being configured. next/image
    // still works, it just serves the original asset unoptimized.
    unoptimized: true,
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
      // Ported from vercel.json (Vercel -> Cloudflare exit, issue #20026):
      // preserve /competitors 1:1 so behavior doesn't change post-cutover.
      {
        source: '/competitors',
        destination: '/competitors.html',
      },
      {
        source: '/competitors/propzone.html',
        destination: '/competitors/propzone',
      },
      {
        source: '/competitors/algoma.html',
        destination: '/competitors/algoma',
      },
    ]
  },
}

export default nextConfig
