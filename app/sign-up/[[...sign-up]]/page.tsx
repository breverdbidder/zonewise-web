import { SignUp } from '@clerk/nextjs'
import Link from 'next/link'

export default function SignUpCatchAllPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <div style={{ width: '40px', height: '40px', backgroundColor: '#1E3A5F', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontWeight: 'bold', fontSize: '20px' }}>Z</span>
            </div>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#f8fafc' }}>ZoneWise<span style={{ color: '#F59E0B' }}>.AI</span></span>
          </Link>
        </div>
        <SignUp fallbackRedirectUrl="/dashboard" signInUrl="/sign-in" />
      </div>
    </div>
  )
}
