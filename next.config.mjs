/** @type {import('next').NextConfig} */
const nextConfig = {
  // TS is clean: npx tsc --noEmit returns 0 errors (Mar 2026, docs/ excluded in tsconfig).
  // ignoreBuildErrors=true: build worker OOMs on TS check in Vercel/CI environment.
  // CI should enforce: tsc --noEmit must pass (pre-commit or CI step).
  typescript: { ignoreBuildErrors: true },
  generateBuildId: () => `v4-nextjs-restored-${Date.now()}`,
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
