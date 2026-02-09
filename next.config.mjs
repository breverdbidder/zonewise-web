/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'www.bcpao.us' },
      { protocol: 'https', hostname: '*.supabase.co' }
    ]
  },
  async rewrites() {
    return [
      // Proxy /app to Craft Agents viewer (upstream-synced from lukilabs/craft-agents-oss)
      // This keeps zonewise.ai connected to upstream 24/7 with zero maintenance
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
