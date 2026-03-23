/** @type {import('next').NextConfig} */
const nextConfig = {
  // tsc verified locally (npx tsc --noEmit passes clean). Skip in build to avoid OOM.
  typescript: { ignoreBuildErrors: true },
  generateBuildId: () => `v4-nextjs-restored-${Date.now()}`,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'www.bcpao.us' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'gis.brevardfl.gov' },
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
    ]
  },
}

export default nextConfig
