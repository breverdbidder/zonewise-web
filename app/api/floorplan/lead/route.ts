import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { setLeadGateCookie } from '@/lib/gate/server'

function getSupabase() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key) throw new Error('No Supabase key available')
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key)
}

export async function POST(request: NextRequest) {
  try {
    const { email, source } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
    }

    const trimmed = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
    }

    const { error } = await getSupabase()
      .from('floorplan_voice_leads')
      .insert({ email: trimmed, source: typeof source === 'string' ? source : 'voice_gate' })

    if (error) {
      if (error.code === '23505') {
        // Already captured this email previously — still gate this session.
        const res = NextResponse.json({ message: 'Welcome back!' })
        setLeadGateCookie(res)
        return res
      }
      return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
    }

    const res = NextResponse.json({ message: 'Thanks! Starting your session.' })
    setLeadGateCookie(res)
    return res
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }
}
