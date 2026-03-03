'use client'

import { useState, ChangeEvent, FormEvent, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlError = searchParams.get('error')
  const supabase = createClient()

  function handleEmailChange(e: ChangeEvent<HTMLInputElement>) { setEmail(e.target.value) }
  function handlePasswordChange(e: ChangeEvent<HTMLInputElement>) { setPassword(e.target.value) }

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
    if (loginError) { setError(loginError.message); setLoading(false) }
    else { router.push('/dashboard') }
  }

  const inputStyle = {
    width: '100%', padding: '12px 16px', border: '1px solid #d1d5db',
    borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box' as const,
    color: '#000000', backgroundColor: '#ffffff', WebkitTextFillColor: '#000000', opacity: 1
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <div style={{ width: '40px', height: '40px', backgroundColor: '#1E3A5F', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontWeight: 'bold', fontSize: '20px' }}>Z</span>
            </div>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>ZoneWise.AI</span>
          </Link>
        </div>
        <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', textAlign: 'center', marginBottom: '24px', color: '#1e293b' }}>Welcome back</h1>
          {urlError && (
            <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '12px', borderRadius: '8px', fontSize: '14px', marginBottom: '16px' }}>{urlError}</div>
          )}
          {error && (
            <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '12px', borderRadius: '8px', fontSize: '14px', marginBottom: '16px' }}>{error}</div>
          )}
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="login-email" style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px', color: '#1e293b' }}>Email</label>
              <input id="login-email" type="email" value={email} onChange={handleEmailChange} style={inputStyle} placeholder="you@example.com" autoComplete="email" required />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label htmlFor="login-password" style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>Password</label>
                <Link href="/forgot-password" style={{ fontSize: '13px', color: '#1E3A5F', textDecoration: 'none' }}>Forgot password?</Link>
              </div>
              <input id="login-password" type="password" value={password} onChange={handlePasswordChange} style={inputStyle} placeholder="Your password" autoComplete="current-password" required />
            </div>
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', backgroundColor: '#1E3A5F', color: 'white', fontWeight: '500', borderRadius: '8px', border: 'none', fontSize: '16px', cursor: 'pointer', opacity: loading ? 0.5 : 1 }}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          <p style={{ textAlign: 'center', fontSize: '14px', color: '#64748b', marginTop: '24px' }}>
            Don&apos;t have an account?{' '}
            <Link href="/signup" style={{ color: '#1E3A5F', textDecoration: 'none', fontWeight: '500' }}>Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
