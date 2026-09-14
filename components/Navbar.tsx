'use client'
import Link from 'next/link'

export default function Navbar() {
  return (
    <nav style={{
      background: 'rgb(var(--zw-page))',
      borderBottom: '1px solid rgb(var(--zw-card))',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: '0 24px',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 32, height: 32,
            background: 'rgb(var(--zw-elev))',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}>
            <span style={{ color: '#F1F5F9', fontWeight: 700, fontSize: 16 }}>Z</span>
            <div style={{
              position: 'absolute', top: -2, right: -2,
              width: 8, height: 8,
              background: 'rgb(var(--zw-brand))',
              borderRadius: '50%',
            }} />
          </div>
          <span style={{ color: '#F1F5F9', fontWeight: 700, fontSize: 18 }}>ZoneWise.AI</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link href="/#how" style={{ color: 'rgb(var(--zw-ink2)))', textDecoration: 'none', fontSize: 14 }}>How It Works</Link>
          <Link href="/kpis" style={{ color: 'rgb(var(--zw-ink2)))', textDecoration: 'none', fontSize: 14 }}>298 KPIs</Link>
          <Link href="/demo" style={{ color: 'rgb(var(--zw-ink2)))', textDecoration: 'none', fontSize: 14 }}>Live Demo</Link>
          <Link href="/#pricing" style={{ color: 'rgb(var(--zw-ink2)))', textDecoration: 'none', fontSize: 14 }}>Pricing</Link>
          <Link href="/sign-in" style={{ color: 'rgb(var(--zw-ink2)))', textDecoration: 'none', fontSize: 14 }}>Sign In</Link>
          <Link href="/#beta-signup" style={{
            background: 'rgb(var(--zw-brand))',
            color: 'rgb(var(--zw-brand-ink)))',
            padding: '8px 18px',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 14,
            textDecoration: 'none',
          }}>Get Started</Link>
        </div>
      </div>
    </nav>
  )
}
