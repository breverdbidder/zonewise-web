import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { phone, consent, disclosureVersion } = body || {}
  if (typeof phone !== 'string' || !phone.trim()) {
    return NextResponse.json({ error: 'Phone number required' }, { status: 400 })
  }
  if (typeof consent !== 'boolean') {
    return NextResponse.json({ error: 'Consent field required' }, { status: 400 })
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'

  const supabase = createServiceClient()

  // 1. Update the feature-preference toggle. This table already exists and
  //    this write is safe regardless of whether the audit table below has
  //    been provisioned yet.
  const { error: prefError } = await supabase
    .from('user_preferences')
    .upsert(
      {
        user_id: userId,
        phone_number: phone.trim(),
        sms_enabled: consent,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

  if (prefError) {
    console.error('sms consent: user_preferences upsert failed', prefError)
    return NextResponse.json({ error: 'Could not save preference' }, { status: 500 })
  }

  // 2. Write the audit-trail record proving what was consented to and when.
  //    This table (sms_consent_events) is a pending migration awaiting
  //    approval per the schema-change protocol -- wrapped so this route
  //    works today and starts logging automatically the moment the
  //    migration lands, with no redeploy needed.
  const { error: auditError } = await supabase.from('sms_consent_events').insert({
    user_id: userId,
    phone_number: phone.trim(),
    consented: consent,
    disclosure_version: disclosureVersion || 'unknown',
    ip_address: ip,
    source: 'onboarding_sms_consent',
    created_at: new Date().toISOString(),
  })

  if (auditError) {
    console.error(
      'sms consent: audit log insert failed (sms_consent_events likely not yet migrated)',
      auditError
    )
  }

  return NextResponse.json({ ok: true })
}
