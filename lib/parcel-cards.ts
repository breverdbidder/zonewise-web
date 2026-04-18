// lib/parcel-cards.ts
// SUMMIT 77c39794 Phase 1b — server-side helper for creating parcel cards
// Called by /api/parcel-cards/create, by Dify on Hetzner, or directly from
// existing chat routes. Wraps the `create_parcel_card` RPC with typed inputs
// and a single share URL emitter.

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL) throw new Error('NEXT_PUBLIC_SUPABASE_URL missing')
if (!SUPABASE_SERVICE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY missing')

export type ParcelCardApp = 'zonewise' | 'biddeed'

export type ParcelCardCitation = {
  source: string
  section?: string
  url?: string
}

export type ParcelCardAnswer = {
  summary: string
  confidence?: 'VERIFIED' | 'UNTESTED' | 'INFERRED'
  [key: string]: unknown
}

export type CreateParcelCardInput = {
  parcelId: number           // zw_parcels.id (bigint)
  userId: string | null      // auth.users.id uuid, null for anonymous
  app: ParcelCardApp
  question: string
  answer: ParcelCardAnswer
  citations?: ParcelCardCitation[]
}

export type CreateParcelCardResult = {
  cardId: string
  shareUrl: string
}

/**
 * Create a parcel card via the `create_parcel_card` Postgres RPC.
 * Uses the service-role key (server-only; never import this file from client code).
 * Returns the card UUID and the public share URL for the appropriate app domain.
 */
export async function createParcelCard(
  input: CreateParcelCardInput,
): Promise<CreateParcelCardResult> {
  if (!['zonewise', 'biddeed'].includes(input.app)) {
    throw new Error(`invalid app: ${input.app}`)
  }
  if (!input.question || input.question.length < 3) {
    throw new Error('question too short')
  }
  if (!input.answer?.summary) {
    throw new Error('answer.summary required')
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  })

  const { data, error } = await sb.rpc('create_parcel_card', {
    p_parcel_id: input.parcelId,
    p_user_id: input.userId,
    p_app: input.app,
    p_question: input.question.slice(0, 1000),
    p_answer: input.answer,
    p_citations: input.citations ?? [],
  })

  if (error) throw new Error(`create_parcel_card rpc: ${error.message}`)
  if (!data || typeof data !== 'string') {
    throw new Error('create_parcel_card returned no card id')
  }

  const cardId = data
  const host = input.app === 'zonewise' ? 'zonewise.ai' : 'biddeed.ai'
  const pathPart = input.app === 'zonewise' ? 'parcel' : 'property'
  const shareUrl = `https://${host}/${pathPart}/${cardId}`

  return { cardId, shareUrl }
}
