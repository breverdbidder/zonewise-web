import { NextResponse } from 'next/server'

export async function GET() {
  // Version marker — if you see this, the latest deploy is live
  const DIRECTIONAL_PREFIXES = new Set(['N','S','E','W','NE','NW','SE','SW'])
  const test = 'S ORLANDO'.split(' ')
  const stripped = DIRECTIONAL_PREFIXES.has(test[0]) ? test.slice(1).join(' ') : test.join(' ')
  
  return NextResponse.json({
    version: '2026-03-30T14:20Z',
    directional_test: { input: 'S ORLANDO', output: stripped },
    deployed: true
  })
}
