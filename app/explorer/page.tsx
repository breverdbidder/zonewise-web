import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'

export default function ExplorerPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#020617', color: '#F1F5F9', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px' }}>
        <div style={{ maxWidth: 560, textAlign: 'center' }}>

          {/* Icon */}
          <div style={{ width: 72, height: 72, background: '#1E293B', border: '1px solid #1E3A5F', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 32, color: '#1E3A5F' }}>
            ◈
          </div>

          {/* Label */}
          <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#F59E0B', letterSpacing: '.18em', textTransform: 'uppercase', marginBottom: 16 }}>
            COMING SOON
          </p>

          {/* Heading */}
          <h1 style={{ fontSize: 'clamp(28px,5vw,44px)', fontWeight: 800, color: '#F1F5F9', lineHeight: 1.1, marginBottom: 20, letterSpacing: '-.02em' }}>
            ZoneWise Explorer
          </h1>

          {/* Message */}
          <p style={{ fontSize: 17, color: '#94A3B8', lineHeight: 1.7, marginBottom: 36 }}>
            The Property Explorer is launching soon. Browse all 67 Florida counties, filter auction properties by BidWise score, and explore the map in real time.
          </p>

          <p style={{ fontSize: 14, color: '#64748B', marginBottom: 32 }}>
            Sign up to get early access.
          </p>

          {/* CTA */}
          <Link href="/#beta-signup" style={{
            display: 'inline-block',
            background: '#F59E0B',
            color: '#020617',
            padding: '14px 36px',
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 16,
            textDecoration: 'none',
          }}>
            Get Early Access →
          </Link>

          {/* Secondary link */}
          <div style={{ marginTop: 24 }}>
            <Link href="/demo" style={{ color: '#94A3B8', fontSize: 14, textDecoration: 'underline', textDecorationColor: '#334155' }}>
              Watch the Live Demo instead
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
