import Link from 'next/link'

export default function Footer() {
  return (
    <footer style={{
      background: '#0F2035',
      borderTop: '1px solid #1E293B',
      padding: '32px 24px',
    }}>
      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 24, height: 24, background: '#1E3A5F', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#F1F5F9', fontWeight: 700, fontSize: 13 }}>Z</span>
          </div>
          <span style={{ color: '#F1F5F9', fontWeight: 600, fontSize: 15 }}>ZoneWise.AI</span>
        </div>
        <div style={{ display: 'flex', gap: 32, fontSize: 13, color: '#64748B' }}>
          <Link href="/docs" style={{ color: '#64748B', textDecoration: 'none' }}>API Docs</Link>
          <Link href="/help" style={{ color: '#64748B', textDecoration: 'none' }}>Help</Link>
          <Link href="/terms" style={{ color: '#64748B', textDecoration: 'none' }}>Terms</Link>
          <Link href="/privacy" style={{ color: '#64748B', textDecoration: 'none' }}>Privacy</Link>
          <Link href="/disclaimer" style={{ color: '#64748B', textDecoration: 'none' }}>Disclaimer</Link>
        </div>
        <p style={{ color: '#475569', fontSize: 12, margin: 0, textAlign: 'center' }}>
          Live in Florida. Expanding nationwide.
        </p>
        <p style={{ color: '#475569', fontSize: 12, margin: 0 }}>
          © 2026 ZoneWise.AI. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
