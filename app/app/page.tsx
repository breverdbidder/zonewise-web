export default function AppPage() {
  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      background: '#020617',
      overflow: 'hidden',
    }}>
      {/* Left Panel — Chat */}
      <div style={{
        width: 380,
        flexShrink: 0,
        background: '#0F172A',
        borderRight: '1px solid #1E293B',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #1E293B',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <div style={{ width: 28, height: 28, background: '#1E3A5F', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#F1F5F9', fontWeight: 700, fontSize: 14 }}>Z</span>
          </div>
          <span style={{ color: '#F1F5F9', fontWeight: 600, fontSize: 15 }}>ZoneWise.AI</span>
        </div>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 12,
          padding: 24,
        }}>
          <div style={{ color: '#F59E0B', fontSize: 32 }}>◎</div>
          <p style={{ color: '#94A3B8', fontSize: 14, textAlign: 'center', lineHeight: 1.6, margin: 0 }}>
            AI Property Intelligence<br/>
            <span style={{ color: '#64748B', fontSize: 12 }}>Chat panel coming soon</span>
          </p>
        </div>
      </div>

      {/* Right Panel — Map/Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        background: '#020617',
      }}>
        <div style={{ color: '#1E293B', fontSize: 48 }}>◈</div>
        <p style={{ color: '#64748B', fontSize: 15, margin: 0 }}>Map & property data panel</p>
        <p style={{ color: '#475569', fontSize: 13, margin: 0 }}>Coming in Sprint 2</p>
      </div>
    </div>
  )
}
