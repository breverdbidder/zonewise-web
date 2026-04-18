// app/parcel/[id]/not-found.tsx
// SUMMIT 77c39794 — custom 404 for parcel card routes (EG14 point 7)

export default function ParcelNotFound() {
  return (
    <main style={{
      background: '#020617', color: '#F1F5F9', minHeight: '100vh',
      fontFamily: 'Inter, system-ui, sans-serif',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ maxWidth: 520, padding: '48px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#F59E0B', marginBottom: 16 }}>
          404 · Card not found
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 700, margin: '0 0 12px', color: '#F8FAFC', letterSpacing: '-0.02em' }}>
          This parcel card doesn&rsquo;t exist
        </h1>
        <p style={{ fontSize: 16, lineHeight: 1.55, color: '#94A3B8', margin: '0 0 28px' }}>
          The link may have expired, been removed by its owner, or never existed. Start a new analysis from scratch — first 2 queries are free.
        </p>
        <a href="https://chat.zonewise.ai"
           style={{
             display: 'inline-block', background: '#F59E0B', color: '#020617',
             fontWeight: 700, fontSize: 15, padding: '12px 28px', borderRadius: 8,
             textDecoration: 'none', letterSpacing: '0.02em',
           }}>
          Ask about any FL parcel →
        </a>
      </div>
    </main>
  );
}
