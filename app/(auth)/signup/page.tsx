'use client'

import { useState, ChangeEvent, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [acceptTerms, setAcceptTerms] = useState<boolean>(false)
  const router = useRouter()
  const supabase = createClient()

  function handleEmailChange(e: ChangeEvent<HTMLInputElement>) {
    setEmail(e.target.value)
  }

  function handlePasswordChange(e: ChangeEvent<HTMLInputElement>) {
    setPassword(e.target.value)
  }

  async function handleSignup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!acceptTerms) {
      setError('Please accept the terms')
      return
    }
    setLoading(true)
    setError('')

    const { error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
    })
    
    if (signupError) {
      setError(signupError.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '16px',
    boxSizing: 'border-box' as const,
    color: '#000000',
    backgroundColor: '#ffffff',
    WebkitTextFillColor: '#000000',
    opacity: 1
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <div style={{ width: '40px', height: '40px', backgroundColor: '#0d9488', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontWeight: 'bold', fontSize: '20px' }}>Z</span>
            </div>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>ZoneWise.AI</span>
          </Link>
        </div>

        <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', textAlign: 'center', marginBottom: '8px', color: '#1e293b' }}>Create your account</h1>
          <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '24px' }}>Start with 25 free queries</p>

          {error && (
            <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '12px', borderRadius: '8px', fontSize: '14px', marginBottom: '16px' }}>{error}</div>
          )}

          <form onSubmit={handleSignup}>
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="signup-email" style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px', color: '#1e293b' }}>Email</label>
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                style={inputStyle}
                placeholder="you@example.com"
                autoComplete="off"
                required
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="signup-password" style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px', color: '#1e293b' }}>Password</label>
              <input
                id="signup-password"
                type="password"
                value={password}
                onChange={handlePasswordChange}
                style={inputStyle}
                placeholder="Min 8 characters"
                autoComplete="off"
                minLength={8}
                required
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  style={{ marginTop: '4px', width: '16px', height: '16px' }}
                />
                <span style={{ color: '#64748b' }}>
                  I understand ZoneWise.AI provides information for <strong>general guidance only</strong> and is not legal advice.
                </span>
              </label>
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '12px', backgroundColor: '#0d9488', color: 'white', fontWeight: '500', borderRadius: '8px', border: 'none', fontSize: '16px', cursor: 'pointer', opacity: loading ? 0.5 : 1 }}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '14px', color: '#64748b', marginTop: '24px' }}>
            Already have an account? <Link href="/login" style={{ color: '#0d9488', textDecoration: 'none', fontWeight: '500' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
