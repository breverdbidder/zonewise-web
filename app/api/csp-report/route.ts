import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  // Never echo body back — security best practice
  try {
    const body = await request.json()

    // Only log if Supabase service role is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (supabaseUrl && serviceKey) {
      const supabase = createClient(supabaseUrl, serviceKey)

      const report = body['csp-report'] || body
      const userAgent = request.headers.get('user-agent') || ''
      const forwarded = request.headers.get('x-forwarded-for')
      const ip = forwarded?.split(',')[0].trim() || 'unknown'
      // Hash IP for privacy — no raw IPs stored
      const encoder = new TextEncoder()
      const data = encoder.encode(ip + ':csp-salt-272')
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const ipHash = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
        .slice(0, 16)

      await supabase.from('zw_sec_events').insert({
        event_type: 'csp-violation',
        severity: 'low',
        source: 'browser',
        payload: {
          blocked_uri: report['blocked-uri'] || report.blockedURL,
          document_uri: report['document-uri'] || report.documentURL,
          violated_directive: report['violated-directive'] || report.effectiveDirective,
          original_policy: report['original-policy'],
        },
        user_agent: userAgent.slice(0, 256),
        ip_hash: ipHash,
      })
    }
  } catch {
    // Silently ignore parse errors — never leak info
  }

  return new NextResponse(null, { status: 204 })
}
