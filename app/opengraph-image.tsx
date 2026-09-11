import { ImageResponse } from 'next/og'

// Cloudflare exit (#20026): same reasoning as app/api/csp-report/route.ts --
// OpenNext cannot bundle a separate edge-runtime function alongside the main
// Worker function. next/og's ImageResponse only needs Web APIs, so dropping
// this is a no-op behavior-wise.
export const alt = 'ZoneWise.AI — AI Zoning Intelligence for Florida Real Estate'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #1E3A5F 0%, #152B47 100%)',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
        }}
      >
        {/* Grid pattern overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.05,
            backgroundImage:
              'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Join Beta badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(244, 123, 32, 0.15)',
            border: '1px solid rgba(244, 123, 32, 0.4)',
            borderRadius: '999px',
            padding: '8px 20px',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#F47B20',
            }}
          />
          <span style={{ color: '#F47B20', fontSize: '18px', fontWeight: 600 }}>
            Join the Beta
          </span>
        </div>

        {/* Logo + name */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              background: '#F47B20',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ color: '#fff', fontSize: '32px', fontWeight: 800 }}>Z</span>
          </div>
          <span style={{ color: '#fff', fontSize: '48px', fontWeight: 800 }}>
            ZoneWise.AI
          </span>
        </div>

        {/* Tagline */}
        <p
          style={{
            color: '#94A3B8',
            fontSize: '28px',
            textAlign: 'center',
            maxWidth: '800px',
            lineHeight: 1.4,
            margin: 0,
          }}
        >
          Every zoning rule, every parcel, every county in Florida.
        </p>

        {/* Stats row */}
        <div
          style={{
            display: 'flex',
            gap: '48px',
            marginTop: '48px',
          }}
        >
          {[
            { value: '67', label: 'Counties' },
            { value: '369', label: 'Jurisdictions' },
            { value: '5,950', label: 'Districts' },
            { value: '10.5M', label: 'Parcels' },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <span
                style={{ color: '#F47B20', fontSize: '36px', fontWeight: 700 }}
              >
                {stat.value}
              </span>
              <span style={{ color: '#64748B', fontSize: '16px' }}>
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
