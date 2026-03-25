'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import * as THREE from 'three'
import { createClient } from '@/lib/supabase/client'
import { computeEnvelope } from '@/lib/development-analysis/hbu-engine'

// ─── Zone typology classifier ─────────────────────────────────────────────────
type ZoneTypology = 'SF' | 'GARDEN_MF' | 'MID_RISE' | 'HIGH_RISE'

function classifyTypology(zoneCode: string): ZoneTypology {
  const z = (zoneCode || '').toUpperCase()
  if (z.startsWith('R-1') || z.startsWith('R-2') || z === 'SF' || z.startsWith('RS') || z.startsWith('RE')) return 'SF'
  if (z.startsWith('R-3') || z.startsWith('R-4') || z.startsWith('RM') || z.startsWith('MFR') || z.startsWith('RA')) return 'GARDEN_MF'
  if (z.startsWith('R-5') || z.startsWith('RM-24') || z.startsWith('RU') || z.startsWith('R-6') || z.startsWith('R-10')) return 'MID_RISE'
  if (z.startsWith('C') || z.startsWith('B') || z.startsWith('CBD') || z.startsWith('MU') || z.startsWith('IU')) return 'HIGH_RISE'
  return 'GARDEN_MF'
}

// ─── Constants ────────────────────────────────────────────────────────────────
const LAT_FT = 364173  // 1° latitude in feet
const LNG_FT = 320106  // 1° longitude in feet at 28.5°N (cos(28.5°) * LAT_FT)

// ─── Types ────────────────────────────────────────────────────────────────────
interface ParcelResult {
  parcel_id: string
  address: string
  acres: number | null
  geometry: unknown
  use_code: string | null
  use_description: string | null
}

interface ZoningData {
  zone_code: string
  jurisdiction: string | null
  district_id: string
  district_name: string
  standards: Record<string, unknown>
  uses: { use_description: string; use_type: string }[]
}

// ─── Geometry Helpers ─────────────────────────────────────────────────────────
function parseGeometry(geometry: unknown): [number, number][] | null {
  if (!geometry) return null
  try {
    let geo = typeof geometry === 'string' ? JSON.parse(geometry) : geometry
    const g = geo as { type: string; coordinates: unknown }
    if (g.type === 'Polygon' && Array.isArray(g.coordinates) && Array.isArray(g.coordinates[0])) {
      return (g.coordinates[0] as [number, number][])
    }
    if (g.type === 'MultiPolygon' && Array.isArray(g.coordinates) && Array.isArray((g.coordinates as unknown[][][])[0])) {
      return ((g.coordinates as unknown[][][])[0][0] as [number, number][])
    }
  } catch {}
  return null
}

function toLocalFeet(coords: [number, number][]): {
  pts: [number, number][]
  w: number
  d: number
} {
  const lngs = coords.map(c => c[0])
  const lats = coords.map(c => c[1])
  const clng = (Math.min(...lngs) + Math.max(...lngs)) / 2
  const clat = (Math.min(...lats) + Math.max(...lats)) / 2
  const pts = coords.map(([lng, lat]): [number, number] => [
    (lng - clng) * LNG_FT,
    (lat - clat) * LAT_FT,
  ])
  const xs = pts.map(p => p[0])
  const ys = pts.map(p => p[1])
  const w = Math.max(...xs) - Math.min(...xs)
  const d = Math.max(...ys) - Math.min(...ys)
  return { pts, w, d }
}

// ─── Use-type classifier ──────────────────────────────────────────────────────
type UseType = 'sfr' | 'mf' | 'commercial'

function classifyUse(useCode: string | null, useDesc: string | null, zoneCode: string): UseType {
  const code = (useCode || '').toUpperCase()
  const desc = (useDesc || '').toLowerCase()
  const zone = (zoneCode || '').toUpperCase()
  if (desc.includes('single') || code === '01' || code === '0100') return 'sfr'
  if (desc.includes('multi') || desc.includes('apartment') || desc.includes('condo')) return 'mf'
  if (zone.startsWith('RM') || zone.startsWith('R-3') || zone.startsWith('R-4') || zone.startsWith('R-6') || zone.startsWith('R-10')) return 'mf'
  if (zone.startsWith('BU') || zone.startsWith('IU') || zone.startsWith('B') || zone.startsWith('C')) return 'commercial'
  if (zone.startsWith('R')) return 'sfr'
  return 'sfr'
}

// ─── Derived metrics ──────────────────────────────────────────────────────────
function deriveMetrics(parcel: ParcelResult, zoning: ZoningData) {
  const s = zoning.standards
  const acreage = parcel.acres ?? 0.25
  const lotArea = acreage * 43560

  const front = (s.front_setback_ft as number) ?? (s.front_setback as number) ?? 25
  const side = (s.side_setback_ft as number) ?? (s.side_setback as number) ?? 7.5
  const rear = (s.rear_setback_ft as number) ?? (s.rear_setback as number) ?? 20
  const maxH = (s.max_height_ft as number) ?? 35
  const maxCov = (s.max_lot_coverage_pct as number) ?? (s.max_coverage_pct as number) ?? 40
  const far = (s.floor_area_ratio as number) ?? 0.5
  const stories = (s.max_stories as number) ?? Math.floor(maxH / 11) ?? 2
  const parkingPerUnit = (s.parking_per_unit as number) ?? 2
  const parkingPer1k = (s.parking_per_1000sf as number) ?? 4

  // Assume slightly rectangular lot (1.2:1 ratio)
  const lotW = Math.sqrt(lotArea * 1.2)
  const lotD = lotArea / lotW
  const env = computeEnvelope(lotW, lotD, front, side, rear, maxH, maxCov, far)

  const covPct = lotArea > 0 ? ((env.effFP / lotArea) * 100).toFixed(1) : '0'
  const farActual = lotArea > 0 ? (env.actualGFA / lotArea).toFixed(2) : '0'

  const useType = classifyUse(parcel.use_code, parcel.use_description, zoning.zone_code)

  let units = 0
  let density = 0
  if (useType === 'sfr') {
    units = 1
    density = 1 / acreage
  } else if (useType === 'mf') {
    units = Math.max(1, Math.floor((env.actualGFA * 0.85) / 850))
    density = units / acreage
  }

  const requiredSpaces = useType === 'commercial'
    ? Math.ceil(env.actualGFA / 1000 * parkingPer1k)
    : units * parkingPerUnit
  const spaceArea = requiredSpaces * 330 // 330 sf per space incl. drive aisle

  return {
    lotArea, front, side, rear, maxH, maxCov, far, stories,
    parkingPerUnit, parkingPer1k, lotW, lotD, env,
    covPct, farActual, useType, units, density,
    requiredSpaces, spaceArea, acreage,
  }
}

// ─── Unit Mix ─────────────────────────────────────────────────────────────────
function buildUnitMix(totalUnits: number) {
  const rows = [
    { type: 'Studio', pct: 0.15, sf: 500 },
    { type: '1 BR',   pct: 0.35, sf: 750 },
    { type: '2 BR',   pct: 0.35, sf: 1050 },
    { type: '3 BR',   pct: 0.15, sf: 1350 },
  ]
  const mix = rows.map(r => ({ ...r, count: Math.round(totalUnits * r.pct) }))
  const allocated = mix.reduce((s, r) => s + r.count, 0)
  mix[mix.length - 1].count += totalUnits - allocated
  return mix
}

// ─── Fallback zoning controls ─────────────────────────────────────────────────
const FALLBACK_CONTROLS: Record<string, {
  zone_name: string, max_height_ft: number, max_stories: number,
  front_setback_ft: number, side_setback_ft: number, rear_setback_ft: number,
  max_lot_coverage_pct: number, max_far: number, parking_per_unit: number,
  parking_per_1000sf: number, max_density_du_acre: number
}> = {
  // Single Family Residential
  SFR:          { zone_name: 'Single Family Residential', max_height_ft: 35, max_stories: 2, front_setback_ft: 25, side_setback_ft: 7.5, rear_setback_ft: 20, max_lot_coverage_pct: 40, max_far: 0.5, parking_per_unit: 2, parking_per_1000sf: 0, max_density_du_acre: 8 },
  'VAC-RES':    { zone_name: 'Vacant Residential', max_height_ft: 35, max_stories: 2, front_setback_ft: 25, side_setback_ft: 7.5, rear_setback_ft: 20, max_lot_coverage_pct: 40, max_far: 0.5, parking_per_unit: 2, parking_per_1000sf: 0, max_density_du_acre: 8 },
  'R-1A':       { zone_name: 'Single Family Residential A', max_height_ft: 35, max_stories: 2, front_setback_ft: 25, side_setback_ft: 7.5, rear_setback_ft: 20, max_lot_coverage_pct: 40, max_far: 0.5, parking_per_unit: 2, parking_per_1000sf: 0, max_density_du_acre: 6 },
  'R-1AA':      { zone_name: 'Single Family Residential AA', max_height_ft: 35, max_stories: 2, front_setback_ft: 30, side_setback_ft: 10, rear_setback_ft: 25, max_lot_coverage_pct: 35, max_far: 0.4, parking_per_unit: 2, parking_per_1000sf: 0, max_density_du_acre: 4 },
  'R1AA':       { zone_name: 'Single Family Residential AA', max_height_ft: 35, max_stories: 2, front_setback_ft: 30, side_setback_ft: 10, rear_setback_ft: 25, max_lot_coverage_pct: 35, max_far: 0.4, parking_per_unit: 2, parking_per_1000sf: 0, max_density_du_acre: 4 },
  'R-1B':       { zone_name: 'Single Family Residential B', max_height_ft: 35, max_stories: 2, front_setback_ft: 25, side_setback_ft: 7.5, rear_setback_ft: 20, max_lot_coverage_pct: 45, max_far: 0.5, parking_per_unit: 2, parking_per_1000sf: 0, max_density_du_acre: 8 },
  'R1B':        { zone_name: 'Single Family Residential B', max_height_ft: 35, max_stories: 2, front_setback_ft: 25, side_setback_ft: 7.5, rear_setback_ft: 20, max_lot_coverage_pct: 45, max_far: 0.5, parking_per_unit: 2, parking_per_1000sf: 0, max_density_du_acre: 8 },
  SRE:          { zone_name: 'Suburban Residential Estate', max_height_ft: 35, max_stories: 2, front_setback_ft: 30, side_setback_ft: 10, rear_setback_ft: 25, max_lot_coverage_pct: 35, max_far: 0.35, parking_per_unit: 2, parking_per_1000sf: 0, max_density_du_acre: 4 },
  RE:           { zone_name: 'Residential Estate', max_height_ft: 35, max_stories: 2, front_setback_ft: 35, side_setback_ft: 15, rear_setback_ft: 30, max_lot_coverage_pct: 30, max_far: 0.3, parking_per_unit: 2, parking_per_1000sf: 0, max_density_du_acre: 2 },
  REU:          { zone_name: 'Residential Estate Urban', max_height_ft: 35, max_stories: 2, front_setback_ft: 25, side_setback_ft: 7.5, rear_setback_ft: 20, max_lot_coverage_pct: 40, max_far: 0.5, parking_per_unit: 2, parking_per_1000sf: 0, max_density_du_acre: 6 },
  // Multifamily
  'MFR-CONDO':  { zone_name: 'Multi-Family Residential Condo', max_height_ft: 45, max_stories: 4, front_setback_ft: 20, side_setback_ft: 10, rear_setback_ft: 15, max_lot_coverage_pct: 60, max_far: 1.5, parking_per_unit: 1.5, parking_per_1000sf: 0, max_density_du_acre: 24 },
  TOWNHOUSE:    { zone_name: 'Townhouse Residential', max_height_ft: 40, max_stories: 3, front_setback_ft: 20, side_setback_ft: 0, rear_setback_ft: 15, max_lot_coverage_pct: 55, max_far: 1.2, parking_per_unit: 2, parking_per_1000sf: 0, max_density_du_acre: 16 },
  'RES-COMMON': { zone_name: 'Residential Common Area', max_height_ft: 35, max_stories: 2, front_setback_ft: 25, side_setback_ft: 10, rear_setback_ft: 20, max_lot_coverage_pct: 20, max_far: 0.2, parking_per_unit: 0, parking_per_1000sf: 0, max_density_du_acre: 0 },
  // PUD / Mixed
  PUD:          { zone_name: 'Planned Unit Development', max_height_ft: 60, max_stories: 5, front_setback_ft: 15, side_setback_ft: 10, rear_setback_ft: 15, max_lot_coverage_pct: 65, max_far: 2.0, parking_per_unit: 1.5, parking_per_1000sf: 3.5, max_density_du_acre: 30 },
  // Transitional / Special
  'TR-3':       { zone_name: 'Transitional Residential 3', max_height_ft: 45, max_stories: 3, front_setback_ft: 20, side_setback_ft: 10, rear_setback_ft: 15, max_lot_coverage_pct: 50, max_far: 1.0, parking_per_unit: 1.5, parking_per_1000sf: 0, max_density_du_acre: 15 },
  // Commercial
  OFFICE:       { zone_name: 'Office', max_height_ft: 60, max_stories: 5, front_setback_ft: 15, side_setback_ft: 10, rear_setback_ft: 15, max_lot_coverage_pct: 70, max_far: 2.5, parking_per_unit: 0, parking_per_1000sf: 3.33, max_density_du_acre: 0 },
  CP:           { zone_name: 'Commercial Professional', max_height_ft: 45, max_stories: 3, front_setback_ft: 15, side_setback_ft: 10, rear_setback_ft: 15, max_lot_coverage_pct: 65, max_far: 2.0, parking_per_unit: 0, parking_per_1000sf: 4, max_density_du_acre: 0 },
  'C-CP':       { zone_name: 'Commercial Professional', max_height_ft: 45, max_stories: 3, front_setback_ft: 15, side_setback_ft: 10, rear_setback_ft: 15, max_lot_coverage_pct: 65, max_far: 2.0, parking_per_unit: 0, parking_per_1000sf: 4, max_density_du_acre: 0 },
  // Institutional / Government
  'GOV-MUNI':   { zone_name: 'Government Municipal', max_height_ft: 60, max_stories: 4, front_setback_ft: 20, side_setback_ft: 15, rear_setback_ft: 20, max_lot_coverage_pct: 60, max_far: 1.5, parking_per_unit: 0, parking_per_1000sf: 3, max_density_du_acre: 0 },
  'SCHOOL-PUB': { zone_name: 'Public School', max_height_ft: 45, max_stories: 3, front_setback_ft: 30, side_setback_ft: 20, rear_setback_ft: 25, max_lot_coverage_pct: 50, max_far: 1.0, parking_per_unit: 0, parking_per_1000sf: 3, max_density_du_acre: 0 },
  // Agricultural
  ACREAGE:      { zone_name: 'Agricultural Acreage', max_height_ft: 35, max_stories: 2, front_setback_ft: 40, side_setback_ft: 15, rear_setback_ft: 30, max_lot_coverage_pct: 25, max_far: 0.2, parking_per_unit: 2, parking_per_1000sf: 0, max_density_du_acre: 1 },
  GML:          { zone_name: 'General Mixed Land', max_height_ft: 45, max_stories: 3, front_setback_ft: 20, side_setback_ft: 10, rear_setback_ft: 15, max_lot_coverage_pct: 60, max_far: 1.5, parking_per_unit: 1.5, parking_per_1000sf: 3.5, max_density_du_acre: 20 },
}

function getFallbackControls(zoneCode: string) {
  const c = (zoneCode || '').toUpperCase().trim()
  if (FALLBACK_CONTROLS[c]) return FALLBACK_CONTROLS[c]
  if (c.startsWith('R-1') || c.startsWith('R1') || c.startsWith('RS')) return FALLBACK_CONTROLS['SFR']
  if (c.startsWith('R-2') || c.startsWith('R2')) return { ...FALLBACK_CONTROLS['SFR'], zone_name: 'Residential ' + c, max_density_du_acre: 10 }
  if (c.startsWith('R-3') || c.startsWith('R3') || c.startsWith('RM') || c.startsWith('MFR') || c.startsWith('RU-2')) return FALLBACK_CONTROLS['MFR-CONDO']
  if (c.startsWith('RU-1') || c.startsWith('RU-')) return { ...FALLBACK_CONTROLS['SFR'], zone_name: 'Rural Residential ' + c }
  if (c.startsWith('C-') || c.startsWith('BU') || c.startsWith('GU')) return FALLBACK_CONTROLS['OFFICE']
  if (c.startsWith('I-') || c.startsWith('M-')) return { ...FALLBACK_CONTROLS['OFFICE'], zone_name: 'Industrial ' + c, max_height_ft: 50, max_lot_coverage_pct: 70 }
  if (c.startsWith('PUD') || c.startsWith('MU') || c.startsWith('MXD')) return FALLBACK_CONTROLS['PUD']
  if (c.startsWith('AG') || c.startsWith('AU')) return FALLBACK_CONTROLS['ACREAGE']
  if (c.includes('MULTIPLE') || c.includes('MULTI')) return FALLBACK_CONTROLS['MFR-CONDO']
  return { ...FALLBACK_CONTROLS['SFR'], zone_name: 'Unknown Zone: ' + c }
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MassingEngine() {
  const searchParams = useSearchParams()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ParcelResult[]>([])
  const [selected, setSelected] = useState<ParcelResult | null>(null)
  const [zoning, setZoning] = useState<ZoningData | null>(null)
  const [searching, setSearching] = useState(false)
  const [loadingZoning, setLoadingZoning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFallback, setIsFallback] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const frameRef = useRef<number>(0)
  const mouseRef = useRef({ isDown: false, lastX: 0, lastY: 0 })
  const rotRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 4, radius: 200 })
  const idleRef = useRef(0)

  // ── Address search ──────────────────────────────────────────────────────────
  const handleSearch = useCallback(async (val: string) => {
    setQuery(val)
    if (val.length < 3) { setResults([]); setShowDropdown(false); return }
    setSearching(true)
    setError(null)
    const supabase = createClient()
    try {
      const { data, error: err } = await supabase
        .from('sample_properties')
        .select('parcel_id, address, acres, geometry, use_code, use_description')
        .ilike('address', `%${val}%`)
        .limit(10)
      if (err) throw err
      setResults(data ?? [])
      setShowDropdown(true)
    } catch (e) {
      setError('Search failed — check DB connection')
    } finally {
      setSearching(false)
    }
  }, [])

  // ── Parcel select → chain zoning queries ────────────────────────────────────
  const handleSelect = useCallback(async (parcel: ParcelResult) => {
    setSelected(parcel)
    setShowDropdown(false)
    setQuery(parcel.address)
    setZoning(null)
    setLoadingZoning(true)
    setError(null)
    setIsFallback(false)
    const supabase = createClient()
    try {
      const { data: za, error: e1 } = await supabase
        .from('zoning_assignments')
        .select('zone_code, jurisdiction')
        .eq('parcel_id', parcel.parcel_id)
        .limit(1)
        .single()
      if (e1 || !za) throw new Error('No zoning assignment found for this parcel')

      const { data: zd, error: e2 } = await supabase
        .from('zoning_districts')
        .select('id, code, name')
        .eq('code', za.zone_code)
        .limit(1)
        .single()

      let standards: Record<string, unknown>
      let districtName: string
      let uses: { use_description: string; use_type: string }[]
      let districtId: string

      if (e2 || !zd) {
        // Use fallback controls based on zone code pattern
        const fb = getFallbackControls(za.zone_code)
        standards = fb as unknown as Record<string, unknown>
        districtName = fb.zone_name
        uses = []
        districtId = ''
        setIsFallback(true)
      } else {
        const { data: zs } = await supabase
          .from('zone_standards')
          .select('*')
          .eq('zoning_district_id', zd.id)
          .limit(1)
          .single()

        const { data: pu } = await supabase
          .from('permitted_uses')
          .select('use_description, use_type')
          .eq('zoning_district_id', zd.id)
          .limit(20)

        standards = (zs ?? {}) as Record<string, unknown>
        districtName = zd.name
        uses = pu ?? []
        districtId = zd.id
      }

      setZoning({
        zone_code: za.zone_code,
        jurisdiction: za.jurisdiction ?? null,
        district_id: districtId,
        district_name: districtName,
        standards,
        uses,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load zoning data')
    } finally {
      setLoadingZoning(false)
    }
  }, [])

  // ── Deep link: ?parcel= ─────────────────────────────────────────────────────
  useEffect(() => {
    const parcelParam = searchParams.get('parcel')
    if (parcelParam) {
      const supabase = createClient()
      supabase
        .from('sample_properties')
        .select('parcel_id, address, acres, geometry, use_code, use_description')
        .eq('parcel_id', parcelParam)
        .limit(1)
        .single()
        .then(({ data }) => {
          if (data) handleSelect(data)
        })
    }
  }, []) // run once on mount

  // ── Three.js renderer ───────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !selected || !zoning) return

    const m = deriveMetrics(selected, zoning)
    const { lotW, lotD, front, side, rear, maxH, env, stories } = m
    const typology = classifyTypology(zoning.zone_code)

    const W = 560, H = 420
    canvas.width = W
    canvas.height = H

    // ── Scene ──
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#020617')
    scene.fog = new THREE.FogExp2('#020617', 0.0015)

    // ── Camera (fov 35, architectural) ──
    const camera = new THREE.PerspectiveCamera(35, W / H, 0.5, 3000)

    // ── Renderer with PBR settings ──
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    renderer.outputColorSpace = THREE.SRGBColorSpace
    rendererRef.current = renderer
    sceneRef.current = scene
    cameraRef.current = camera

    // ── 3-Point Architectural Lighting ──
    // Key light — warm sunlight
    const keyLight = new THREE.DirectionalLight(0xFFF5E6, 1.8)
    keyLight.position.set(5, 10, 5)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.width = 2048
    keyLight.shadow.mapSize.height = 2048
    keyLight.shadow.bias = -0.0001
    keyLight.shadow.camera.near = 0.5
    keyLight.shadow.camera.far = 2000
    keyLight.shadow.camera.left = -300
    keyLight.shadow.camera.right = 300
    keyLight.shadow.camera.top = 300
    keyLight.shadow.camera.bottom = -300
    scene.add(keyLight)

    // Fill light — cool sky bounce
    const fillLight = new THREE.DirectionalLight(0xE6F0FF, 0.4)
    fillLight.position.set(-3, 5, -3)
    scene.add(fillLight)

    // Rim light — back edge
    const rimLight = new THREE.DirectionalLight(0xCCE0FF, 0.6)
    rimLight.position.set(-2, 3, 8)
    scene.add(rimLight)

    // Hemisphere ambient
    scene.add(new THREE.HemisphereLight(0x87CEEB, 0x4A3728, 0.5))

    // ── PBR Materials ──
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x88BBDD, transmission: 0.6, roughness: 0.05,
      metalness: 0.1, thickness: 0.5, ior: 1.5,
      transparent: true, opacity: 0.7, side: THREE.DoubleSide,
    })

    const concreteMat = new THREE.MeshStandardMaterial({
      color: 0xD4D0C8, roughness: 0.85, metalness: 0.02,
    })

    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x4A5568, roughness: 0.3, metalness: 0.8,
    })

    const accentMat = new THREE.MeshStandardMaterial({
      color: 0xF59E0B, roughness: 0.4, emissive: new THREE.Color(0xF59E0B), emissiveIntensity: 0.1,
    })

    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x2D3748, roughness: 0.95, metalness: 0,
    })

    // ── Lot geometry from parcel ──
    const geoCoords = selected.geometry ? parseGeometry(selected.geometry) : null
    let lotShape: THREE.Shape | null = null

    if (geoCoords && geoCoords.length >= 3) {
      try {
        const local = toLocalFeet(geoCoords)
        if (local.w > 0 && local.d > 0) {
          const sx = lotW / local.w
          const sy = lotD / local.d
          const scaled = local.pts.map(([x, y]): [number, number] => [x * sx, y * sy])
          lotShape = new THREE.Shape()
          lotShape.moveTo(scaled[0][0], scaled[0][1])
          for (let i = 1; i < scaled.length; i++) lotShape.lineTo(scaled[i][0], scaled[i][1])
          lotShape.closePath()
        }
      } catch { /* fall through to rectangle */ }
    }

    // ── Extended ground plane (3x lot size) ──
    const groundW = lotW * 3.5
    const groundD = lotD * 3.5
    const extGround = new THREE.Mesh(new THREE.PlaneGeometry(groundW, groundD), groundMat)
    extGround.rotation.x = -Math.PI / 2
    extGround.position.y = -0.05
    extGround.receiveShadow = true
    scene.add(extGround)

    // Grid lines every 10ft
    const gridDivs = Math.floor(groundW / 10)
    const gridHelper = new THREE.GridHelper(groundW, gridDivs, 0x1e293b, 0x1e293b)
    gridHelper.position.y = 0.0
    scene.add(gridHelper)

    // ── Lot surface ──
    if (lotShape) {
      const shapeGeo = new THREE.ShapeGeometry(lotShape)
      const lotMesh = new THREE.Mesh(shapeGeo, new THREE.MeshStandardMaterial({
        color: 0x1E2A3A, roughness: 0.9, metalness: 0,
      }))
      lotMesh.rotation.x = -Math.PI / 2
      lotMesh.position.y = 0.01
      lotMesh.receiveShadow = true
      scene.add(lotMesh)
      // Lot boundary — orange
      const pts3d = lotShape.getPoints(64).map(p => new THREE.Vector3(p.x, 0.12, -p.y))
      pts3d.push(pts3d[0].clone())
      scene.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts3d),
        new THREE.LineBasicMaterial({ color: 0xF59E0B }),
      ))
    } else {
      const lotGeo = new THREE.PlaneGeometry(lotW, lotD)
      const lotMesh = new THREE.Mesh(lotGeo, new THREE.MeshStandardMaterial({
        color: 0x1E2A3A, roughness: 0.9, metalness: 0,
      }))
      lotMesh.rotation.x = -Math.PI / 2
      lotMesh.position.y = 0.01
      lotMesh.receiveShadow = true
      scene.add(lotMesh)
      // Lot boundary
      const lotEdges = new THREE.LineSegments(
        new THREE.EdgesGeometry(lotGeo),
        new THREE.LineBasicMaterial({ color: 0xF59E0B }),
      )
      lotEdges.rotation.x = -Math.PI / 2
      lotEdges.position.y = 0.12
      scene.add(lotEdges)
    }

    // ── Setback zone — green ──
    const sbW = Math.max(0, lotW - side * 2)
    const sbD = Math.max(0, lotD - front - rear)
    const sbOffZ = (front - rear) / 2
    if (sbW > 0 && sbD > 0) {
      const sbLine = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.PlaneGeometry(sbW, sbD)),
        new THREE.LineBasicMaterial({ color: 0x22C55E }),
      )
      sbLine.rotation.x = -Math.PI / 2
      sbLine.position.set(0, 0.2, sbOffZ)
      scene.add(sbLine)
    }

    // ── Street indication ──
    const streetMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(lotW * 2, 18),
      new THREE.MeshStandardMaterial({ color: 0x1A202C, roughness: 0.95, metalness: 0 }),
    )
    streetMesh.rotation.x = -Math.PI / 2
    streetMesh.position.set(0, -0.03, lotD / 2 + 10)
    scene.add(streetMesh)
    // Street center line
    const streetLinePts = [
      new THREE.Vector3(-lotW, -0.02, lotD / 2 + 10),
      new THREE.Vector3(lotW, -0.02, lotD / 2 + 10),
    ]
    scene.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(streetLinePts),
      new THREE.LineBasicMaterial({ color: 0xF59E0B }),
    ))

    // ── Adjacent lot outlines ──
    const adjMat = new THREE.LineBasicMaterial({ color: 0x475569 })
    const adjW = lotW * 0.9
    const adjD = lotD * 0.85
    ;[[-lotW - adjW / 2, 0], [lotW + adjW / 2, 0]].forEach(([ax, az]) => {
      const adjEdges = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.PlaneGeometry(adjW, adjD)),
        adjMat,
      )
      adjEdges.rotation.x = -Math.PI / 2
      adjEdges.position.set(ax, 0.08, az as number)
      scene.add(adjEdges)
    })

    // ── Tree billboards ──
    const treeMat = new THREE.MeshStandardMaterial({ color: 0x2D6A4F, roughness: 0.9 })
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6B4226, roughness: 0.95 })
    const treePositions = [
      [-lotW / 2 - 10, 0, -lotD / 4],
      [lotW / 2 + 10, 0, -lotD / 4],
      [-lotW / 2 - 10, 0, lotD / 4],
      [lotW / 2 + 10, 0, lotD / 4],
      [0, 0, -lotD / 2 - 12],
      [lotW / 3, 0, -lotD / 2 - 10],
    ]
    treePositions.forEach(([tx, , tz]) => {
      const trunkH = 6 + Math.random() * 4
      const trunkGeo = new THREE.CylinderGeometry(0.5, 0.7, trunkH, 6)
      const trunk = new THREE.Mesh(trunkGeo, trunkMat)
      trunk.position.set(tx, trunkH / 2, tz)
      trunk.castShadow = true
      scene.add(trunk)
      const canopyR = 4 + Math.random() * 2
      const canopy = new THREE.Mesh(new THREE.SphereGeometry(canopyR, 8, 6), treeMat)
      canopy.position.set(tx, trunkH + canopyR * 0.7, tz)
      canopy.castShadow = true
      scene.add(canopy)
    })

    // ── Building geometry (floor-by-floor) ──
    if (env.effFP > 0 && env.floors > 0) {
      const bH = Math.min(maxH, env.floors * 11)
      const bW = env.bw
      const bD = env.bd
      const scale = 1 // scene units = feet

      const building = new THREE.Group()
      building.position.set(0, 0, sbOffZ)

      // ── Per-floor builder ──
      function buildFloor(width: number, depth: number, floorIndex: number): THREE.Group {
        const group = new THREE.Group()
        const floorHeight = 11 * scale
        const slabHeight = 0.8 * scale

        // Step-back: reduce width/depth by 2% per floor above floor 3
        const stepback = floorIndex > 3 ? (floorIndex - 3) * 0.02 : 0
        const w = width * (1 - stepback)
        const d = depth * (1 - stepback)

        // Floor slab
        const slab = new THREE.Mesh(new THREE.BoxGeometry(w, slabHeight, d), concreteMat)
        slab.position.y = floorIndex * floorHeight + slabHeight / 2
        slab.castShadow = true
        slab.receiveShadow = true
        group.add(slab)

        const windowHeight = floorHeight - slabHeight
        const columnWidth = Math.max(1.5 * scale, w * 0.04)
        const windowWidth = Math.max(5 * scale, w * 0.12)
        const spacing = columnWidth + windowWidth

        // Facade helper
        function addFacade(facingZ: boolean, dir: number) {
          const faceW = facingZ ? w : d
          const facePos = facingZ ? dir * d / 2 : dir * w / 2
          for (let pos = -faceW / 2 + spacing / 2; pos < faceW / 2; pos += spacing) {
            // Glass panel
            const glass = new THREE.Mesh(
              new THREE.PlaneGeometry(windowWidth * 0.88, windowHeight * 0.82),
              glassMat,
            )
            const glassY = floorIndex * floorHeight + slabHeight + windowHeight / 2
            if (facingZ) {
              glass.position.set(pos, glassY, facePos + dir * 0.02)
              if (dir === 1) glass.rotation.y = Math.PI
            } else {
              glass.position.set(facePos + dir * 0.02, glassY, pos)
              glass.rotation.y = dir * Math.PI / 2
            }
            group.add(glass)

            // Mullion
            const mullion = new THREE.Mesh(
              new THREE.BoxGeometry(
                facingZ ? columnWidth * 0.3 : columnWidth * 0.6,
                windowHeight,
                facingZ ? columnWidth * 0.6 : columnWidth * 0.3,
              ),
              metalMat,
            )
            if (facingZ) {
              mullion.position.set(pos + windowWidth / 2, glassY, facePos)
            } else {
              mullion.position.set(facePos, glassY, pos + windowWidth / 2)
            }
            mullion.castShadow = true
            group.add(mullion)
          }
        }

        // Front / back (Z-facing)
        addFacade(true, -1)
        addFacade(true, 1)
        // Left / right (X-facing)
        addFacade(false, -1)
        addFacade(false, 1)

        // Balcony for MF above ground floor every 2 floors
        if (typology !== 'SF' && floorIndex > 0 && floorIndex % 2 === 0) {
          const balcW = Math.min(w * 0.3, 20)
          const balcony = new THREE.Mesh(
            new THREE.BoxGeometry(balcW, slabHeight * 0.5, 3 * scale),
            concreteMat,
          )
          balcony.position.set(0, floorIndex * floorHeight + slabHeight * 0.25, d / 2 + 1.5 * scale)
          balcony.castShadow = true
          group.add(balcony)

          // Glass railing
          const railing = new THREE.Mesh(
            new THREE.PlaneGeometry(balcW, 3.5 * scale),
            new THREE.MeshPhysicalMaterial({
              color: 0xAADDFF, transmission: 0.8, roughness: 0.05,
              transparent: true, opacity: 0.4, side: THREE.DoubleSide,
            }),
          )
          railing.position.set(0, floorIndex * floorHeight + slabHeight + 1.5 * scale, d / 2 + 2.8 * scale)
          group.add(railing)
        }

        // HIGH_RISE: taller ground-floor ceiling (retail)
        if (typology === 'HIGH_RISE' && floorIndex === 0) {
          // Storefront glass — ground floor taller treatment
          const storeMat = glassMat
          const storefront = new THREE.Mesh(
            new THREE.BoxGeometry(w - 2, floorHeight * 0.9, 0.3),
            storeMat,
          )
          storefront.position.set(0, floorHeight * 0.45, -d / 2)
          group.add(storefront)
        }

        // MID_RISE: podium base (floors 0-1) concrete cladding override
        if (typology === 'MID_RISE' && floorIndex <= 1) {
          const podium = new THREE.Mesh(
            new THREE.BoxGeometry(w + 2, slabHeight + 0.5, d + 2),
            new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.8, metalness: 0.05 }),
          )
          podium.position.y = floorIndex * floorHeight + slabHeight / 2
          podium.castShadow = true
          group.add(podium)
        }

        return group
      }

      // Build floors
      const numFloors = Math.max(1, env.floors)
      for (let i = 0; i < numFloors; i++) {
        building.add(buildFloor(bW, bD, i))
      }

      // ── Roof ──
      const topY = numFloors * 11
      const roofStepback = numFloors > 3 ? (numFloors - 3) * 0.02 : 0
      const roofW = bW * (1 - roofStepback)
      const roofD = bD * (1 - roofStepback)

      if (typology === 'SF') {
        // Pitched roof using BufferGeometry
        const rH = Math.min(roofW * 0.4, 15)
        const ridgeX = roofW / 2
        const verts = new Float32Array([
          -ridgeX, topY, -roofD / 2,
           ridgeX, topY, -roofD / 2,
           0,      topY + rH, -roofD / 2,
          -ridgeX, topY,  roofD / 2,
           ridgeX, topY,  roofD / 2,
           0,      topY + rH,  roofD / 2,
          -ridgeX, topY, -roofD / 2,
          -ridgeX, topY,  roofD / 2,
           0,      topY + rH, -roofD / 2,
           0,      topY + rH,  roofD / 2,
           ridgeX, topY, -roofD / 2,
           ridgeX, topY,  roofD / 2,
        ])
        const indices = new Uint16Array([
          0, 1, 2,  3, 5, 4,
          2, 1, 5,  2, 5, 4,  2, 4, 8,  4, 9, 8,
          0, 2, 6,  2, 9, 6,  6, 9, 7,  9, 4, 7,
          1, 10, 2, 10, 11, 2, 2, 11, 9, 11, 5, 9,
        ])
        const roofGeo = new THREE.BufferGeometry()
        roofGeo.setAttribute('position', new THREE.BufferAttribute(verts, 3))
        roofGeo.setIndex(new THREE.BufferAttribute(indices, 1))
        roofGeo.computeVertexNormals()
        const roofMesh = new THREE.Mesh(roofGeo, new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.85 }))
        roofMesh.castShadow = true
        building.add(roofMesh)
      } else {
        // Flat roof + parapet
        const roofSlab = new THREE.Mesh(
          new THREE.BoxGeometry(roofW, 0.8, roofD),
          concreteMat,
        )
        roofSlab.position.set(0, topY + 0.4, 0)
        roofSlab.castShadow = true
        building.add(roofSlab)

        // Parapet
        const parapetH = 1.5
        const parapetEdges = [
          { pos: [0, topY + parapetH / 2 + 0.8, roofD / 2], w: roofW, d: 0.4, label: 'front' },
          { pos: [0, topY + parapetH / 2 + 0.8, -roofD / 2], w: roofW, d: 0.4, label: 'back' },
          { pos: [roofW / 2, topY + parapetH / 2 + 0.8, 0], w: 0.4, d: roofD, label: 'right' },
          { pos: [-roofW / 2, topY + parapetH / 2 + 0.8, 0], w: 0.4, d: roofD, label: 'left' },
        ] as const
        parapetEdges.forEach(e => {
          const p = new THREE.Mesh(new THREE.BoxGeometry(e.w, parapetH, e.d), concreteMat)
          p.position.set(e.pos[0], e.pos[1], e.pos[2])
          building.add(p)
        })

        // Mechanical penthouse
        const pentW = roofW * 0.35
        const pentD = roofD * 0.3
        const pentH = 9
        const pent = new THREE.Mesh(new THREE.BoxGeometry(pentW, pentH, pentD), metalMat)
        pent.position.set(roofW * 0.15, topY + 0.8 + pentH / 2, 0)
        pent.castShadow = true
        building.add(pent)

        // Accent stripe on penthouse
        const stripe = new THREE.Mesh(
          new THREE.BoxGeometry(pentW + 0.2, 1.2, pentD + 0.2),
          accentMat,
        )
        stripe.position.set(roofW * 0.15, topY + 0.8 + pentH, 0)
        building.add(stripe)
      }

      // ── SF typology: garage + porch ──
      if (typology === 'SF') {
        // Garage side volume
        const garageW = Math.min(bW * 0.35, 20)
        const garageH = 11
        const garage = new THREE.Mesh(
          new THREE.BoxGeometry(garageW, garageH, bD * 0.5),
          new THREE.MeshStandardMaterial({ color: 0xC8C4BC, roughness: 0.85 }),
        )
        garage.position.set(bW / 2 + garageW / 2, garageH / 2, bD * 0.05)
        garage.castShadow = true
        building.add(garage)

        // Porch overhang at front
        const porchW = Math.min(bW * 0.5, 30)
        const porch = new THREE.Mesh(
          new THREE.BoxGeometry(porchW, 0.6, 6),
          concreteMat,
        )
        porch.position.set(0, 10, bD / 2 + 3)
        building.add(porch)

        // Porch columns
        ;[-porchW / 3, 0, porchW / 3].forEach(cx => {
          const col = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 10, 8), concreteMat)
          col.position.set(cx, 5, bD / 2 + 5.5)
          col.castShadow = true
          building.add(col)
        })
      }

      // ── GARDEN_MF: courtyard simulation ──
      if (typology === 'GARDEN_MF' && env.floors <= 3) {
        // Two wing volumes flanking main building
        const wingW = bW * 0.4
        const wingH = bH
        ;[-bW / 2 - wingW / 2 - 2, bW / 2 + wingW / 2 + 2].forEach(wx => {
          const wing = new THREE.Group()
          for (let fi = 0; fi < env.floors; fi++) {
            wing.add(buildFloor(wingW, bD * 0.7, fi))
          }
          wing.position.set(wx, 0, bD * 0.1)
          scene.add(wing)
          // Wing roof slab
          const wRoof = new THREE.Mesh(
            new THREE.BoxGeometry(wingW, 0.8, bD * 0.7),
            concreteMat,
          )
          wRoof.position.set(wx, wingH + 0.4, bD * 0.1 + sbOffZ)
          scene.add(wRoof)
        })
      }

      scene.add(building)

      // ── Setback labels HTML overlay ──
      const overlay = overlayRef.current
      if (overlay) {
        overlay.innerHTML = ''
        const labelStyle = 'position:absolute;background:#1E3A5F;color:white;font-size:11px;font-family:Inter,sans-serif;padding:3px 8px;border-radius:4px;pointer-events:none;white-space:nowrap;border:1px solid rgba(245,158,11,0.5)'

        // Building height label (top center)
        const htLabel = document.createElement('div')
        htLabel.style.cssText = labelStyle + ';top:16px;left:50%;transform:translateX(-50%)'
        htLabel.textContent = `${Math.round(bH)} ft  /  ${env.floors} ${env.floors === 1 ? 'story' : 'stories'}`
        overlay.appendChild(htLabel)

        // Units badge
        if (m.units > 1) {
          const unitLabel = document.createElement('div')
          unitLabel.style.cssText = labelStyle + ';top:44px;right:12px;background:#F59E0B;color:#020617;font-weight:700'
          unitLabel.textContent = `${m.units} units`
          overlay.appendChild(unitLabel)
        }

        // Setback labels
        const setbacks = [
          { text: `Front: ${front} ft`,  bottom: '16px', left: '50%', transform: 'translateX(-50%)' },
          { text: `Side: ${side} ft`,     top: '50%',   left: '12px', transform: 'translateY(-50%)' },
          { text: `Rear: ${rear} ft`,     top: '16px',  left: '50%',  transform: 'translateX(-50%)' },
        ]
        setbacks.forEach(s => {
          const el = document.createElement('div')
          const extra = Object.entries(s).filter(([k]) => !['text'].includes(k)).map(([k, v]) => `${k}:${v}`).join(';')
          el.style.cssText = labelStyle + ';' + extra
          el.textContent = s.text
          overlay.appendChild(el)
        })

        // North arrow label
        const northLabel = document.createElement('div')
        northLabel.style.cssText = 'position:absolute;bottom:36px;right:14px;color:#ef4444;font-size:13px;font-weight:700;font-family:Inter,sans-serif;pointer-events:none'
        northLabel.textContent = '↑ N'
        overlay.appendChild(northLabel)
      }
    }

    // ── North arrow (3D) ──
    const arrowMesh = new THREE.Mesh(
      new THREE.ConeGeometry(1.5, 5, 4),
      new THREE.MeshBasicMaterial({ color: 0xef4444 }),
    )
    arrowMesh.position.set(0, 1.5, -lotD / 2 - 10)
    scene.add(arrowMesh)

    // ── Camera orbit ──
    const buildH = env.effFP > 0 ? Math.min(maxH, env.floors * 11) : maxH
    const orbitRadius = Math.max(lotW, lotD, buildH) * 2.5
    rotRef.current.radius = orbitRadius

    function updateCamera() {
      const r = rotRef.current
      camera.position.set(
        r.radius * Math.sin(r.phi) * Math.cos(r.theta),
        r.radius * Math.cos(r.phi),
        r.radius * Math.sin(r.phi) * Math.sin(r.theta),
      )
      camera.lookAt(0, buildH * 0.4, sbOffZ)
    }
    updateCamera()

    function animate() {
      frameRef.current = requestAnimationFrame(animate)
      idleRef.current++
      if (idleRef.current > 180) { rotRef.current.theta += 0.002; updateCamera() }
      renderer.render(scene, camera)
    }
    animate()

    // ── Drag / touch controls ──
    const reset = () => { idleRef.current = 0 }
    const onDown = (e: MouseEvent) => { mouseRef.current = { isDown: true, lastX: e.clientX, lastY: e.clientY }; reset() }
    const onUp = () => { mouseRef.current.isDown = false }
    const onMove = (e: MouseEvent) => {
      if (!mouseRef.current.isDown) return; reset()
      rotRef.current.theta -= (e.clientX - mouseRef.current.lastX) * 0.01
      rotRef.current.phi = Math.max(0.1, Math.min(1.4, rotRef.current.phi + (e.clientY - mouseRef.current.lastY) * 0.01))
      mouseRef.current.lastX = e.clientX
      mouseRef.current.lastY = e.clientY
      updateCamera()
    }
    const onWheel = (e: WheelEvent) => {
      reset()
      rotRef.current.radius = Math.max(30, Math.min(1200, rotRef.current.radius + e.deltaY * 0.5))
      updateCamera()
    }
    const onTS = (e: TouchEvent) => {
      if (e.touches.length === 1) { mouseRef.current = { isDown: true, lastX: e.touches[0].clientX, lastY: e.touches[0].clientY }; reset() }
    }
    const onTE = () => { mouseRef.current.isDown = false }
    const onTM = (e: TouchEvent) => {
      if (!mouseRef.current.isDown || e.touches.length !== 1) return
      e.preventDefault(); reset()
      rotRef.current.theta -= (e.touches[0].clientX - mouseRef.current.lastX) * 0.01
      rotRef.current.phi = Math.max(0.1, Math.min(1.4, rotRef.current.phi + (e.touches[0].clientY - mouseRef.current.lastY) * 0.01))
      mouseRef.current.lastX = e.touches[0].clientX
      mouseRef.current.lastY = e.touches[0].clientY
      updateCamera()
    }

    canvas.addEventListener('mousedown', onDown)
    canvas.addEventListener('mouseup', onUp)
    canvas.addEventListener('mouseleave', onUp)
    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('wheel', onWheel)
    canvas.addEventListener('touchstart', onTS)
    canvas.addEventListener('touchend', onTE)
    canvas.addEventListener('touchmove', onTM, { passive: false })

    return () => {
      cancelAnimationFrame(frameRef.current)
      renderer.dispose()
      rendererRef.current = null
      sceneRef.current = null
      cameraRef.current = null
      glassMat.dispose()
      concreteMat.dispose()
      metalMat.dispose()
      accentMat.dispose()
      groundMat.dispose()
      scene.traverse(o => {
        const mesh = o as THREE.Mesh
        if (mesh.geometry) mesh.geometry.dispose()
        if (mesh.material) {
          if (Array.isArray(mesh.material)) mesh.material.forEach((mat: THREE.Material) => mat.dispose())
          else (mesh.material as THREE.Material).dispose()
        }
      })
      canvas.removeEventListener('mousedown', onDown)
      canvas.removeEventListener('mouseup', onUp)
      canvas.removeEventListener('mouseleave', onUp)
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('touchstart', onTS)
      canvas.removeEventListener('touchend', onTE)
      canvas.removeEventListener('touchmove', onTM)
      if (overlayRef.current) overlayRef.current.innerHTML = ''
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, zoning])

  // ── Snapshot export ──────────────────────────────────────────────────────────
  const handleSnapshot = useCallback(() => {
    const canvas = canvasRef.current
    const renderer = rendererRef.current
    const scene = sceneRef.current
    const camera = cameraRef.current
    if (!canvas || !renderer || !scene || !camera || !selected) return
    // Upscale to 2400×1600
    renderer.setSize(2400, 1600)
    renderer.render(scene, camera)
    const dataURL = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    const addrSlug = selected.address.replace(/[^a-z0-9]/gi, '_').substring(0, 40)
    link.download = `ZoneWise_Massing_${addrSlug}.png`
    link.href = dataURL
    link.click()
    // Restore normal size
    renderer.setSize(560, 420)
  }, [selected])

  // ── Derived state for JSX ───────────────────────────────────────────────────
  const metrics = selected && zoning ? deriveMetrics(selected, zoning) : null
  const unitMix = metrics?.useType === 'mf' && metrics.units > 0 ? buildUnitMix(metrics.units) : null

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#020617] text-white">
      {/* Page header */}
      <div className="border-b border-slate-800 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm">3D</div>
          <div>
            <h1 className="text-lg font-bold text-white">3D Massing Engine</h1>
            <p className="text-xs text-slate-400">Address → Zoning → Building Envelope → Capacity</p>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Address Search */}
        <div className="relative mb-6">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={e => handleSearch(e.target.value)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              placeholder="Type a Brevard County address (e.g. 123 Main St, Cocoa)..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 text-sm"
            />
            {searching && (
              <div className="absolute right-4 top-3.5 text-slate-400 text-xs">Searching...</div>
            )}
          </div>
          {showDropdown && results.length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
              {results.map(r => (
                <button
                  key={r.parcel_id}
                  onMouseDown={() => handleSelect(r)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-800 border-b border-slate-800 last:border-0 transition-colors"
                >
                  <div className="text-sm text-white">{r.address}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {r.use_description ?? 'Unknown use'} · {r.acres?.toFixed(2) ?? '?'} ac · ID: {r.parcel_id}
                  </div>
                </button>
              ))}
            </div>
          )}
          {showDropdown && results.length === 0 && !searching && query.length >= 3 && (
            <div className="absolute z-20 w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-400 text-sm shadow-xl">
              No properties found for "{query}"
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-950 border border-red-800 rounded-xl px-4 py-3 mb-4 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Fallback controls warning */}
        {isFallback && zoning && (
          <div className="bg-yellow-950 border border-yellow-700 rounded-xl px-4 py-3 mb-4 text-yellow-300 text-sm">
            Using estimated zoning controls for {zoning.zone_code}. Actual district standards may vary.
          </div>
        )}

        {/* Zoning loading */}
        {loadingZoning && (
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
            <div className="w-4 h-4 border-2 border-slate-600 border-t-orange-400 rounded-full animate-spin" />
            Loading zoning data...
          </div>
        )}

        {/* Main content — shown after zoning loads */}
        {metrics && zoning && selected && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* ── Left column ── */}
            <div className="space-y-4">

              {/* Zone header card */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="inline-block bg-orange-500/20 text-orange-400 text-xs font-bold px-2.5 py-1 rounded-lg mr-2">
                      {zoning.zone_code}
                    </span>
                    <span className="text-white font-semibold">{zoning.district_name}</span>
                  </div>
                  {zoning.jurisdiction && (
                    <span className="text-xs text-slate-500">{zoning.jurisdiction}</span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Max Height',    val: metrics.maxH   ? `${metrics.maxH} ft`  : '—' },
                    { label: 'Max Stories',   val: metrics.stories ? String(metrics.stories) : '—' },
                    { label: 'FAR',           val: metrics.far    ? String(metrics.far)    : '—' },
                    { label: 'Front Setback', val: `${metrics.front} ft`  },
                    { label: 'Side Setback',  val: `${metrics.side} ft`   },
                    { label: 'Rear Setback',  val: `${metrics.rear} ft`   },
                    { label: 'Lot Coverage',  val: `${metrics.maxCov}%`   },
                    { label: 'Parking/Unit',  val: String(metrics.parkingPerUnit) },
                    { label: 'Pkg/1000 sf',   val: String(metrics.parkingPer1k)  },
                  ].map(item => (
                    <div key={item.label} className="bg-slate-800 rounded-lg p-2.5">
                      <div className="text-slate-400 text-xs leading-tight">{item.label}</div>
                      <div className="text-white font-semibold text-sm mt-1">{item.val}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Capacity metrics */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-slate-200 mb-3">Capacity Metrics</h3>
                <div className="space-y-0">
                  {[
                    { label: 'Lot Area',               val: `${metrics.lotArea.toLocaleString()} sf  (${metrics.acreage.toFixed(2)} ac)` },
                    { label: 'Buildable Area',          val: `${Math.round(metrics.env.effFP).toLocaleString()} sf` },
                    { label: 'Gross Floor Area (GFA)',  val: `${Math.round(metrics.env.actualGFA).toLocaleString()} sf` },
                    { label: 'Floors',                 val: `${metrics.env.floors} floors` },
                    { label: 'FAR Actual',             val: metrics.farActual },
                    { label: 'Coverage Actual',        val: `${metrics.covPct}%` },
                    { label: 'Estimated Units',        val: metrics.useType === 'sfr' ? '1 unit' : metrics.units > 0 ? `${metrics.units} units` : 'N/A' },
                    { label: 'Density',                val: metrics.density > 0 ? `${metrics.density.toFixed(1)} units/ac` : 'N/A' },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between items-center py-2 border-b border-slate-800 last:border-0">
                      <span className="text-slate-400 text-sm">{item.label}</span>
                      <span className="text-white text-sm font-medium tabular-nums">{item.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Permitted uses */}
              {zoning.uses.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-slate-200 mb-3">Permitted Uses</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {zoning.uses.map((u, i) => (
                      <span
                        key={i}
                        className={`text-xs px-2 py-0.5 rounded-full border ${
                          u.use_type === 'permitted'   ? 'bg-green-900/30 text-green-400 border-green-800/60' :
                          u.use_type === 'conditional' ? 'bg-yellow-900/30 text-yellow-400 border-yellow-800/60' :
                          'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {u.use_description}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-3 mt-3">
                    {[{ color: 'bg-green-400', label: 'Permitted' }, { color: 'bg-yellow-400', label: 'Conditional' }].map(l => (
                      <div key={l.label} className="flex items-center gap-1.5 text-xs text-slate-500">
                        <div className={`w-2 h-2 rounded-full ${l.color}`} />
                        {l.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Right column ── */}
            <div className="space-y-4">

              {/* 3D canvas */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-200">3D Building Envelope</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">Drag to rotate · Scroll to zoom</span>
                    <button
                      onClick={handleSnapshot}
                      className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg border border-slate-700 transition-colors"
                    >
                      Download Render
                    </button>
                  </div>
                </div>
                <div style={{ position: 'relative', width: '100%', height: 420 }}>
                  <canvas
                    ref={canvasRef}
                    style={{ width: '100%', height: 420, display: 'block', cursor: 'grab' }}
                  />
                  <div
                    ref={overlayRef}
                    style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
                  />
                </div>
                {/* Legend */}
                <div className="px-4 py-2.5 border-t border-slate-800 flex items-center gap-4 flex-wrap">
                  {[
                    { color: '#F59E0B', label: 'Lot boundary'  },
                    { color: '#22C55E', label: 'Setback zone'  },
                    { color: '#88BBDD', label: 'Glass facade'  },
                    { color: '#D4D0C8', label: 'Concrete'      },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-slate-400">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Unit mix — MF */}
              {unitMix && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-slate-200 mb-3">
                    Unit Mix <span className="text-slate-500 font-normal">({metrics.units} total)</span>
                  </h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-slate-400 text-xs">
                        <th className="text-left pb-2 font-medium">Type</th>
                        <th className="text-right pb-2 font-medium">Count</th>
                        <th className="text-right pb-2 font-medium">Avg SF</th>
                        <th className="text-right pb-2 font-medium">Mix</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unitMix.map(u => (
                        <tr key={u.type} className="border-t border-slate-800">
                          <td className="py-2 text-white">{u.type}</td>
                          <td className="py-2 text-right text-white tabular-nums">{u.count}</td>
                          <td className="py-2 text-right text-slate-300 tabular-nums">{u.sf.toLocaleString()}</td>
                          <td className="py-2 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-14 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-orange-400"
                                  style={{ width: `${u.pct * 100}%` }}
                                />
                              </div>
                              <span className="text-slate-300 tabular-nums text-xs w-8 text-right">
                                {(u.pct * 100).toFixed(0)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Unit mix — SFR */}
              {metrics.useType === 'sfr' && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-slate-200 mb-3">Unit Mix</h3>
                  <div className="flex items-center gap-4">
                    <div className="text-4xl font-bold text-white">1</div>
                    <div>
                      <div className="text-white font-medium">Single Family Residence</div>
                      <div className="text-slate-400 text-sm">{Math.round(metrics.env.actualGFA).toLocaleString()} sf buildable GFA</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Parking summary */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-slate-200 mb-3">Parking Summary</h3>
                <div className="space-y-0">
                  {[
                    { label: 'Required Spaces',         val: String(metrics.requiredSpaces) },
                    { label: 'Surface Area Required',   val: `${metrics.spaceArea.toLocaleString()} sf` },
                    { label: 'Parking % of Lot',        val: `${metrics.lotArea > 0 ? ((metrics.spaceArea / metrics.lotArea) * 100).toFixed(1) : '0'}%` },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between items-center py-2 border-b border-slate-800 last:border-0">
                      <span className="text-slate-400 text-sm">{item.label}</span>
                      <span className="text-white text-sm font-medium tabular-nums">{item.val}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-400 text-sm">Recommendation</span>
                    <span className={`text-sm font-semibold ${metrics.requiredSpaces > 50 ? 'text-orange-400' : 'text-green-400'}`}>
                      {metrics.requiredSpaces > 50 ? 'Structured Parking' : 'Surface Lot'}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Empty state */}
        {!selected && !searching && (
          <div className="text-center py-24">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 mb-4">
              <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-white mb-1">Enter a Brevard County address</h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Search any property to generate a 3D building envelope with zoning controls, capacity analysis, unit mix, and parking requirements.
            </p>
            <div className="mt-6 flex items-center justify-center gap-6 text-xs text-slate-600">
              <span>Height data: 97%</span>
              <span>Setbacks: 95%</span>
              <span>Coverage: 100%</span>
              <span>Parking: 72%</span>
              <span>FAR: 53%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
