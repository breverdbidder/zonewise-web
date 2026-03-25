'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import * as THREE from 'three'
import { createClient } from '@/lib/supabase/client'
import { computeEnvelope } from '@/lib/development-analysis/hbu-engine'

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

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MassingEngine() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ParcelResult[]>([])
  const [selected, setSelected] = useState<ParcelResult | null>(null)
  const [zoning, setZoning] = useState<ZoningData | null>(null)
  const [searching, setSearching] = useState(false)
  const [loadingZoning, setLoadingZoning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
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
      if (e2 || !zd) throw new Error(`Zoning district not found: ${za.zone_code}`)

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

      setZoning({
        zone_code: za.zone_code,
        jurisdiction: za.jurisdiction ?? null,
        district_id: zd.id,
        district_name: zd.name,
        standards: (zs ?? {}) as Record<string, unknown>,
        uses: pu ?? [],
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load zoning data')
    } finally {
      setLoadingZoning(false)
    }
  }, [])

  // ── Three.js renderer ───────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !selected || !zoning) return

    const m = deriveMetrics(selected, zoning)
    const { lotW, lotD, front, side, rear, maxH, env } = m

    const W = 560, H = 420
    canvas.width = W
    canvas.height = H

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#020617')
    scene.fog = new THREE.FogExp2('#020617', 0.003)

    const camera = new THREE.PerspectiveCamera(50, W / H, 1, 2000)
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.4))
    const sun = new THREE.DirectionalLight(0xffffff, 0.8)
    sun.position.set(50, 80, 60)
    sun.castShadow = true
    scene.add(sun)
    const fill = new THREE.DirectionalLight(0x4488ff, 0.3)
    fill.position.set(-40, 30, -50)
    scene.add(fill)

    // ── Lot geometry ──
    const geoCoords = selected.geometry ? parseGeometry(selected.geometry) : null
    let lotShape: THREE.Shape | null = null
    let drawnW = lotW, drawnD = lotD

    if (geoCoords && geoCoords.length >= 3) {
      try {
        const local = toLocalFeet(geoCoords)
        if (local.w > 0 && local.d > 0) {
          drawnW = local.w
          drawnD = local.d
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

    // Lot ground
    if (lotShape) {
      const shapeGeo = new THREE.ShapeGeometry(lotShape)
      const ground = new THREE.Mesh(shapeGeo, new THREE.MeshStandardMaterial({ color: 0x1a1a2e, transparent: true, opacity: 0.7 }))
      ground.rotation.x = -Math.PI / 2
      ground.receiveShadow = true
      scene.add(ground)
      // Lot outline (orange)
      const pts3d = lotShape.getPoints(64).map(p => new THREE.Vector3(p.x, 0.1, -p.y))
      pts3d.push(pts3d[0].clone())
      scene.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts3d),
        new THREE.LineBasicMaterial({ color: 0xF59E0B })
      ))
    } else {
      const lotGeo = new THREE.PlaneGeometry(lotW, lotD)
      const ground = new THREE.Mesh(lotGeo, new THREE.MeshStandardMaterial({ color: 0x1a1a2e, transparent: true, opacity: 0.7 }))
      ground.rotation.x = -Math.PI / 2
      ground.receiveShadow = true
      scene.add(ground)
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(lotGeo), new THREE.LineBasicMaterial({ color: 0xF59E0B }))
      edges.rotation.x = -Math.PI / 2
      scene.add(edges)
    }

    // Setback line (green)
    const sbW = Math.max(0, lotW - side * 2)
    const sbD = Math.max(0, lotD - front - rear)
    const sbOffZ = (front - rear) / 2
    if (sbW > 0 && sbD > 0) {
      const sbLine = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.PlaneGeometry(sbW, sbD)),
        new THREE.LineBasicMaterial({ color: 0x22c55e })
      )
      sbLine.rotation.x = -Math.PI / 2
      sbLine.position.set(0, 0.2, sbOffZ)
      scene.add(sbLine)
    }

    // Building mass (blue translucent)
    if (env.effFP > 0 && env.floors > 0) {
      const bH = Math.min(maxH, env.floors * 11)
      const bGeo = new THREE.BoxGeometry(env.bw, bH, env.bd)
      const building = new THREE.Mesh(bGeo, new THREE.MeshPhysicalMaterial({
        color: 0x1E3A5F, transparent: true, opacity: 0.45,
        roughness: 0.2, metalness: 0.1, side: THREE.DoubleSide,
      }))
      building.position.set(0, bH / 2, sbOffZ)
      building.castShadow = true
      scene.add(building)
      // Building edge lines
      const edgeLines = new THREE.LineSegments(
        new THREE.EdgesGeometry(bGeo),
        new THREE.LineBasicMaterial({ color: 0x93c5fd })
      )
      edgeLines.position.set(0, bH / 2, sbOffZ)
      scene.add(edgeLines)
      // Floor plates
      for (let i = 1; i < env.floors; i++) {
        const fp = new THREE.Mesh(
          new THREE.PlaneGeometry(env.bw - 0.5, env.bd - 0.5),
          new THREE.MeshBasicMaterial({ color: 0x64748b, transparent: true, opacity: 0.2, side: THREE.DoubleSide })
        )
        fp.rotation.x = -Math.PI / 2
        fp.position.set(0, i * 11, sbOffZ)
        scene.add(fp)
      }
    }

    // Max height plane (red dashed)
    const hW = lotW * 1.2
    const hD = lotD * 1.2
    scene.add(Object.assign(
      new THREE.Mesh(
        new THREE.PlaneGeometry(hW, hD),
        new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.07, side: THREE.DoubleSide })
      ),
      { rotation: { x: -Math.PI / 2 }, position: new THREE.Vector3(0, maxH, 0) }
    ))
    const maxHLine = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(hW, hD)),
      new THREE.LineBasicMaterial({ color: 0xef4444 })
    )
    maxHLine.rotation.x = -Math.PI / 2
    maxHLine.position.y = maxH
    scene.add(maxHLine)

    // Grid
    const gridSize = Math.max(lotW, lotD) * 3
    scene.add(new THREE.GridHelper(gridSize, 20, 0x1e293b, 0x1e293b).translateY(-0.1))

    // Camera orbit
    rotRef.current.radius = Math.max(lotW, lotD) * 1.8

    function updateCamera() {
      const r = rotRef.current
      camera.position.set(
        r.radius * Math.sin(r.phi) * Math.cos(r.theta),
        r.radius * Math.cos(r.phi),
        r.radius * Math.sin(r.phi) * Math.sin(r.theta)
      )
      camera.lookAt(0, maxH * 0.35, 0)
    }
    updateCamera()

    function animate() {
      frameRef.current = requestAnimationFrame(animate)
      idleRef.current++
      if (idleRef.current > 180) { rotRef.current.theta += 0.003; updateCamera() }
      renderer.render(scene, camera)
    }
    animate()

    // Drag controls
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
      rotRef.current.radius = Math.max(30, Math.min(800, rotRef.current.radius + e.deltaY * 0.5))
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
    }
  }, [selected, zoning])

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
                  <span className="text-xs text-slate-500">Drag to rotate · Scroll to zoom</span>
                </div>
                <canvas
                  ref={canvasRef}
                  style={{ width: '100%', height: 420, display: 'block', cursor: 'grab' }}
                />
                {/* Legend */}
                <div className="px-4 py-2.5 border-t border-slate-800 flex items-center gap-4 flex-wrap">
                  {[
                    { color: '#F59E0B', label: 'Lot boundary'  },
                    { color: '#22c55e', label: 'Setback line'  },
                    { color: '#93c5fd', label: 'Building mass' },
                    { color: '#ef4444', label: 'Max height'    },
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
