// zonewise/hooks/useEnvelopeData.ts
// Supabase fetch hook for envelope_cache + cma_reports

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Parcel, HBUScenario, EnvelopeCacheRow } from '@/zonewise/lib/development-analysis/types'
import { calculateHBU, computeEnvelope } from '@/zonewise/lib/development-analysis/hbu-engine'

// Column mapping: envelope_cache row → Parcel
function mapRow(row: EnvelopeCacheRow): Parcel {
  const prefix = row.parcel_id?.substring(0, 4) || ''
  const account = row.parcel_id?.replace(/[-.]/g, '') || ''
  const photo = row.bcpao_photo_url || `https://www.bcpao.us/photos/${prefix}/${account}011.jpg`

  return {
    id: row.parcel_id,
    address: row.address,
    city: row.city,
    zip: row.zip,
    zone: row.zone_code,
    zoneDesc: row.zone_description,
    lotWidth: row.lot_width_ft,
    lotDepth: row.lot_depth_ft,
    landValue: row.land_value,
    improvValue: row.improvement_value,
    yearBuilt: row.year_built,
    photo,
    setbacks: {
      front: row.front_setback,
      side: row.side_setback,
      rear: row.rear_setback,
    },
    maxHeight: row.max_height_ft,
    maxCoverage: row.max_lot_coverage_pct,
    far: row.floor_area_ratio,
    currentUse: row.current_use,
    lat: row.latitude,
    lng: row.longitude,
    floodZone: row.flood_zone || 'X',
    hasUtilities: row.has_utilities ?? true,
    roadFrontage: row.road_frontage_ft || null,
    topography: row.topography || 'flat',
  }
}

interface UseEnvelopeDataReturn {
  parcels: Parcel[]
  loading: boolean
  error: string | null
  fetchParcels: (search?: string, limit?: number) => Promise<void>
  fetchParcelById: (parcelId: string) => Promise<Parcel | null>
  fetchHBU: (parcelId: string, parcel: Parcel) => Promise<{ scenarios: HBUScenario[]; source: 'server' | 'client' }>
  retry: () => void
}

export function useEnvelopeData(): UseEnvelopeDataReturn {
  const [parcels, setParcels] = useState<Parcel[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastQuery, setLastQuery] = useState<{ search: string; limit: number } | null>(null)

  const fetchParcels = useCallback(async (search = '', limit = 20) => {
    setLoading(true)
    setError(null)
    setLastQuery({ search, limit })

    try {
      const supabase = createClient()
      const query = supabase
        .from('envelope_cache')
        .select('*')
        .order('hbu_score', { ascending: false })
        .limit(limit)

      if (search) {
        query.or(
          `address.ilike.%${search}%,zone_code.ilike.%${search}%,city.ilike.%${search}%`
        )
      }

      const { data, error: sbError } = await query

      if (sbError) throw new Error(sbError.message)

      setParcels((data as EnvelopeCacheRow[]).map(mapRow))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch parcels')
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

      if (sbError) throw new Error(sbError.message)
      if (!data) return null

      return mapRow(data as EnvelopeCacheRow)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch parcel')
      return null
    }
  }, [])

  const fetchHBU = useCallback(
    async (
      parcelId: string,
      parcel: Parcel
    ): Promise<{ scenarios: HBUScenario[]; source: 'server' | 'client' }> => {
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from('cma_reports')
          .select('hbu_scenarios, best_use, best_score, max_bid_amount')
          .eq('parcel_id', parcelId)
          .single()

        if (data?.hbu_scenarios) {
          return { scenarios: data.hbu_scenarios as HBUScenario[], source: 'server' }
        }
      } catch {
        // No server data — fall through to client-side engine
      }

      // Client-side fallback
      const envelope = computeEnvelope(
        parcel.lotWidth,
        parcel.lotDepth,
        parcel.setbacks.front,
        parcel.setbacks.side,
        parcel.setbacks.rear,
        parcel.maxHeight,
        parcel.maxCoverage,
        parcel.far
      )
      const scenarios = calculateHBU(parcel, envelope)
      return { scenarios, source: 'client' }
    },
    []
  )

  const retry = useCallback(() => {
    if (lastQuery) {
      fetchParcels(lastQuery.search, lastQuery.limit)
    }
  }, [lastQuery, fetchParcels])

  return { parcels, loading, error, fetchParcels, fetchParcelById, fetchHBU, retry }
}
