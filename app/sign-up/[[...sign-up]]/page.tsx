import { SignUp } from '@clerk/nextjs'
import Link from 'next/link'

export default function SignUpCatchAllPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'rgb(var(--zw-page))', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <div style={{ width: '40px', height: '40px', backgroundColor: 'rgb(var(--zw-elev))', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontWeight: 'bold', fontSize: '20px' }}>Z</span>
            </div>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#f8fafc' }}>ZoneWise<span style={{ color: 'rgb(var(--zw-brand))' }}>.AI</span></span>
          </Link>
        </div>
        <SignUp fallbackRedirectUrl="/onboarding/sms-consent" signInUrl="/sign-in" />
      </div>
    </div>
  )
}
