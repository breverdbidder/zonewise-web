'use client'
import Link from 'next/link'

export default function Navbar() {
  return (
    <nav style={{
      background: '#0F172A',
      borderBottom: '1px solid #1E293B',
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
            background: '#1E3A5F',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}>
            <span style={{ color: '#F1F5F9', fontWeight: 700, fontSize: 16 }}>Z</span>
            <div style={{
              position: 'absolute', top: -2, right: -2,
              width: 8, height: 8,
              background: '#F59E0B',
              borderRadius: '50%',
            }} />
          </div>
          <span style={{ color: '#F1F5F9', fontWeight: 700, fontSize: 18 }}>ZoneWise.AI</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link href="/#how" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: 14 }}>How It Works</Link>
          <Link href="/kpis" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: 14 }}>298 KPIs</Link>
          <Link href="/demo" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: 14 }}>Live Demo</Link>
          <Link href="/#pricing" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: 14 }}>Pricing</Link>
          <Link href="/sign-in" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: 14 }}>Sign In</Link>
          <Link href="/#beta-signup" style={{
            background: '#F59E0B',
            color: '#020617',
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
