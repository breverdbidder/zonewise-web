import { NextRequest, NextResponse } from 'next/server'
import { circuitBreaker } from '@/lib/llm-resilience'
import { SECURITY_HEADERS } from '@/lib/validation'

const ADMIN_KEY = process.env.ADMIN_API_KEY

export async function GET(req: NextRequest) {
  const key = req.headers.get('x-admin-key')

  if (!ADMIN_KEY || key !== ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: SECURITY_HEADERS })
  }

  const status = circuitBreaker.getStatus()
  const now = Date.now()

  const providers = Object.entries(status).map(([provider, s]) => ({
    provider,
    isOpen: s.isOpen,
    failures: s.failures,
    cooldownUntil: s.cooldownUntil > 0 ? new Date(s.cooldownUntil).toISOString() : null,
    cooldownRemainingMs: s.cooldownUntil > now ? s.cooldownUntil - now : 0,
    lastError: s.lastError || null,
  }))

  return NextResponse.json(
    { providers, timestamp: new Date(now).toISOString() },
    { headers: SECURITY_HEADERS },
  )
}
