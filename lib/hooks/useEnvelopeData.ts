'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { mapRow, calculateHBU, computeEnvelope } from '@/lib/development-analysis/hbu-engine'
import type { Parcel, HBUScenario, DataSource } from '@/lib/development-analysis/types'

interface UseEnvelopeDataReturn {
  parcels: Parcel[]
  loading: boolean
  error: string | null
  fetchParcels: (search?: string, limit?: number) => Promise<void>
  fetchParcelById: (parcelId: string) => Promise<Parcel | null>
  fetchHBU: (parcel: Parcel) => Promise<{ scenarios: HBUScenario[]; source: DataSource }>
}

export function useEnvelopeData(): UseEnvelopeDataReturn {
  const [parcels, setParcels] = useState<Parcel[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cache HBU results to avoid re-fetching
  const hbuCache = new Map<string, { scenarios: HBUScenario[]; source: DataSource }>()

  const fetchParcels = useCallback(async (search = '', limit = 20) => {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      let query = supabase
        .from('envelope_cache')
        .select('*')
        .order('hbu_score', { ascending: false })
        .limit(limit)

      if (search) {
        query = query.or(
          `address.ilike.%${search}%,zone_code.ilike.%${search}%,city.ilike.%${search}%`
        )
      }

      const { data, error: sbError } = await query
      if (sbError) throw sbError
      setParcels((data || []).map(mapRow))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load parcels')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchParcelById = useCallback(async (parcelId: string): Promise<Parcel | null> => {
    try {
      const supabase = createClient()
      const { data, error: sbError } = await supabase
        .from('envelope_cache')
        .select('*')
        .eq('parcel_id', parcelId)
        .single()
      if (sbError || !data) return null
      return mapRow(data)
    } catch {
      return null
    }
  }, [])

  const fetchHBU = useCallback(async (
    parcel: Parcel
  ): Promise<{ scenarios: HBUScenario[]; source: DataSource }> => {
    const cached = hbuCache.get(parcel.id)
    if (cached) return cached

    // Try server-computed CMA report first
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('cma_reports')
        .select('hbu_scenarios, best_use, best_score, max_bid_amount')
        .eq('parcel_id', parcel.id)
        .single()

      if (data?.hbu_scenarios) {
        const result = { scenarios: data.hbu_scenarios as HBUScenario[], source: 'server' as DataSource }
        hbuCache.set(parcel.id, result)
        return result
      }
    } catch {
      // Table may not exist yet — fall through to client-side
    }

    // Client-side fallback
    const env = computeEnvelope(
      parcel.lotWidth, parcel.lotDepth,
      parcel.setbacks.front, parcel.setbacks.side, parcel.setbacks.rear,
      parcel.maxHeight, parcel.maxCoverage, parcel.far
    )
    const scenarios = calculateHBU(parcel, env)
    const result = { scenarios, source: 'client' as DataSource }
    hbuCache.set(parcel.id, result)
    return result
  }, [])

  return { parcels, loading, error, fetchParcels, fetchParcelById, fetchHBU }
}
