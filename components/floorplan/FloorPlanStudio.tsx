'use client'

import { useState, useCallback } from 'react'
import { Save, History, AlertTriangle, CheckCircle2, XCircle, MinusCircle, Loader2, FileDown, FolderOpen } from 'lucide-react'

/**
 * ZoneWise Floor Plan Studio
 * ---------------------------------------------------------------------------
 * Frontend for the /api/floorplan/* route (proxied server-side to the
 * zonewise-floorplan Worker — see app/api/floorplan/[...path]/route.ts).
 *
 * PDF export is client-side (jsPDF + svg2pdf.js converting the already-
 * rendered SVG) — the Worker itself cannot generate PDFs (pdfkit does not
 * run in the Cloudflare Workers runtime; confirmed via live test, see
 * worker.js handleCompilePdf for the full writeup). This is the correct,
 * durable path, not a workaround.
 */

const API_BASE = '/api/floorplan'

const DEFAULT_SOURCE = `plan "New Plan" {
  units mm
  grid 50
  paper A1 landscape
  scale 1:100
  north up

  wall exterior thickness 200 { (0,0) (8000,0) (8000,6000) (0,6000) close }
  room at (0,0) size 8000x6000 label "Room 1"
}`

interface ParcelForm {
  lot_width_ft: string
  lot_depth_ft: string
  setbacks_front_ft: string
  setbacks_rear_ft: string
  setbacks_side_ft: string
  max_lot_coverage_pct: string
  septic_bedroom_cap: string
  utility_tier: string
}

const EMPTY_PARCEL: ParcelForm = {
  lot_width_ft: '',
  lot_depth_ft: '',
  setbacks_front_ft: '',
  setbacks_rear_ft: '',
  setbacks_side_ft: '',
  max_lot_coverage_pct: '',
  septic_bedroom_cap: '',
  utility_tier: '',
}

function toParcelPayload(p: ParcelForm) {
  const num = (v: string) => (v === '' || v === null || v === undefined ? undefined : Number(v))
  const hasAnySetback = p.setbacks_front_ft || p.setbacks_rear_ft || p.setbacks_side_ft
  return {
    lot_width_ft: num(p.lot_width_ft),
    lot_depth_ft: num(p.lot_depth_ft),
    max_lot_coverage_pct: num(p.max_lot_coverage_pct),
    septic_bedroom_cap: num(p.septic_bedroom_cap),
    utility_tier: p.utility_tier || undefined,
    setbacks_ft: hasAnySetback
      ? {
          front: num(p.setbacks_front_ft) ?? 0,
          rear: num(p.setbacks_rear_ft) ?? 0,
          side: num(p.setbacks_side_ft) ?? 0,
        }
      : undefined,
  }
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'pass') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950 px-2.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-800">
        <CheckCircle2 className="h-3.5 w-3.5" /> PASS
      </span>
    )
  }
  if (status === 'fail') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-950 px-2.5 py-1 text-xs font-semibold text-red-400 border border-red-800">
        <XCircle className="h-3.5 w-3.5" /> FAIL
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-400 border border-slate-700">
      <MinusCircle className="h-3.5 w-3.5" /> SKIPPED
    </span>
  )
}

function RuleLabel({ rule }: { rule: string }) {
  const labels: Record<string, string> = {
    dimensional_fit: 'Dimensional fit (buildable envelope)',
    lot_coverage: 'Lot coverage',
    septic_bedroom_cap: 'Septic bedroom cap',
  }
  return <>{labels[rule] || rule}</>
}

/**
 * Parse an SVG string's width/height (from explicit attributes or a
 * fallback viewBox), so the PDF page can be sized to match the drawing
 * instead of guessing.
 */
function getSvgDimensions(svgEl: SVGSVGElement): { width: number; height: number } {
  const widthAttr = svgEl.getAttribute('width')
  const heightAttr = svgEl.getAttribute('height')
  const parsedWidth = widthAttr ? parseFloat(widthAttr) : NaN
  const parsedHeight = heightAttr ? parseFloat(heightAttr) : NaN
  if (!isNaN(parsedWidth) && !isNaN(parsedHeight) && parsedWidth > 0 && parsedHeight > 0) {
    return { width: parsedWidth, height: parsedHeight }
  }
  const viewBox = svgEl.getAttribute('viewBox')
  if (viewBox) {
    const parts = viewBox.trim().split(/\s+/).map(Number)
    if (parts.length === 4 && !isNaN(parts[2]) && !isNaN(parts[3]) && parts[2] > 0 && parts[3] > 0) {
      return { width: parts[2], height: parts[3] }
    }
  }
  return { width: 800, height: 600 }
}

export default function FloorPlanStudio() {
  const [parcelId, setParcelId] = useState('')
  const [planName, setPlanName] = useState('default')
  const [source, setSource] = useState(DEFAULT_SOURCE)
  const [parcel, setParcel] = useState<ParcelForm>(EMPTY_PARCEL)
  const [useZoning, setUseZoning] = useState(false)

  const [svg, setSvg] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<any[]>([])
  const [errors, setErrors] = useState<any[]>([])
  const [zoning, setZoning] = useState<any | null>(null)
  const [summary, setSummary] = useState<any | null>(null)

  const [compiling, setCompiling] = useState(false)
  const [saving, setSaving] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [loadingPlan, setLoadingPlan] = useState(false)
  const [netError, setNetError] = useState<string | null>(null)

  const handleCompile = useCallback(async () => {
    setCompiling(true)
    setNetError(null)
    setErrors([])
    try {
      const body: Record<string, unknown> = { source }
      if (useZoning) body.parcel = toParcelPayload(parcel)

      const res = await fetch(`${API_BASE}/compile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (!res.ok || !data.ok) {
        setSvg(null)
        setErrors(data.errors || [{ message: data.error || 'Compile failed.' }])
        setWarnings(data.warnings || [])
        setZoning(data.zoning || null)
        return
      }

      setSvg(data.svg)
      setWarnings(data.warnings || [])
      setSummary(data.summary || null)
      setZoning(data.zoning || null)
    } catch (err: any) {
      setNetError(`Could not reach the floor plan API at ${API_BASE}. (${err.message})`)
    } finally {
      setCompiling(false)
    }
  }, [source, parcel, useZoning])

  const handleSave = useCallback(async () => {
    if (!parcelId) {
      setNetError('Enter a parcel ID before saving.')
      return
    }
    setSaving(true)
    setNetError(null)
    try {
      const body: Record<string, unknown> = { parcel_id: parcelId, plan_name: planName, source, created_by: 'zonewise-ui' }
      if (useZoning) body.parcel = toParcelPayload(parcel)

      const res = await fetch(`${API_BASE}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setNetError(data.error || 'Save failed.')
        return
      }
      setZoning(data.zoning || null)
    } catch (err: any) {
      setNetError(`Save failed: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }, [parcelId, planName, source, parcel, useZoning])

  const handleLoad = useCallback(async () => {
    if (!parcelId) {
      setNetError('Enter a parcel ID to load a saved plan.')
      return
    }
    setLoadingPlan(true)
    setNetError(null)
    try {
      const params = new URLSearchParams({ parcel_id: parcelId, plan_name: planName || 'default' })
      const res = await fetch(`${API_BASE}/get?${params.toString()}`)
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setNetError(data.error || 'Load failed.')
        return
      }
      if (!data.plan) {
        setNetError(`No saved plan found for parcel "${parcelId}" / plan "${planName || 'default'}".`)
        return
      }
      setSource(data.plan.source ?? DEFAULT_SOURCE)
      setSvg(data.plan.svg ?? null)
      setSummary(data.plan.summary ?? null)
      setZoning(data.plan.zoning_result ?? null)
      setErrors([])
      setWarnings(data.plan.compiler_warnings ?? [])
    } catch (err: any) {
      setNetError(`Load failed: ${err.message}`)
    } finally {
      setLoadingPlan(false)
    }
  }, [parcelId, planName])

  const handleDownloadPdf = useCallback(async () => {
    if (!svg) return
    setExportingPdf(true)
    setNetError(null)
    try {
      // Dynamically imported — both libraries touch the DOM/Canvas and must
      // never load during SSR. This handler only ever runs client-side.
      const [{ jsPDF }, svg2pdfModule] = await Promise.all([
        import('jspdf'),
        import('svg2pdf.js'),
      ])
      const svg2pdf = (svg2pdfModule as any).svg2pdf ?? (svg2pdfModule as any).default

      const parser = new DOMParser()
      const parsed = parser.parseFromString(svg, 'image/svg+xml')
      const svgEl = parsed.documentElement as unknown as SVGSVGElement
      if (parsed.querySelector('parsererror') || svgEl.tagName.toLowerCase() !== 'svg') {
        throw new Error('Could not parse the compiled SVG for export.')
      }

      const { width, height } = getSvgDimensions(svgEl)
      const orientation = width >= height ? 'landscape' : 'portrait'
      const pdf = new jsPDF({ orientation, unit: 'pt', format: [width, height] })

      await svg2pdf(svgEl, pdf, { x: 0, y: 0, width, height })

      const safeName = (parcelId || planName || 'floor-plan').replace(/[^a-z0-9_-]+/gi, '-')
      pdf.save(`${safeName}.pdf`)
    } catch (err: any) {
      setNetError(`PDF export failed: ${err.message}`)
    } finally {
      setExportingPdf(false)
    }
  }, [svg, parcelId, planName])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <header className="border-b border-slate-800 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between max-w-7xl mx-auto">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-white tracking-tight">Floor Plan Studio</h1>
            <p className="text-xs text-slate-500 mt-0.5">ZoneWise.AI — parcel-aware floor plan compiler</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={parcelId}
              onChange={(e) => setParcelId(e.target.value)}
              placeholder="Parcel ID"
              className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600 flex-1 min-w-[7rem] sm:flex-none sm:w-40"
            />
            <input
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder="Plan name"
              className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600 flex-1 min-w-[6rem] sm:flex-none sm:w-32"
            />
            <button
              onClick={handleLoad}
              disabled={loadingPlan}
              title="Load a previously saved plan for this parcel ID / plan name"
              className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded px-3 py-1.5 text-sm font-medium text-slate-200 disabled:opacity-50"
            >
              {loadingPlan ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderOpen className="h-4 w-4" />}
              Load
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded px-3 py-1.5 text-sm font-medium text-slate-200 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={!svg || exportingPdf}
              title={!svg ? 'Compile a plan first' : 'Download this plan as a PDF'}
              className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded px-3 py-1.5 text-sm font-medium text-slate-200 disabled:opacity-50"
            >
              {exportingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              Download PDF
            </button>
            <button className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded px-3 py-1.5 text-sm font-medium text-slate-200">
              <History className="h-4 w-4" />
              History
            </button>
          </div>
        </div>
      </header>

      {netError && (
        <div className="max-w-7xl mx-auto mt-4 px-6">
          <div className="flex items-start gap-2 bg-amber-950 border border-amber-800 rounded px-4 py-3 text-sm text-amber-300">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{netError}</span>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">Plan source (.arch)</label>
              <button
                onClick={handleCompile}
                disabled={compiling}
                className="inline-flex items-center gap-1.5 bg-blue-700 hover:bg-blue-600 rounded px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {compiling && <Loader2 className="h-4 w-4 animate-spin" />}
                Compile
              </button>
            </div>
            <textarea
              value={source}
              onChange={(e) => setSource(e.target.value)}
              spellCheck={false}
              className="w-full h-80 bg-slate-900 border border-slate-700 rounded p-3 text-sm font-mono text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
            />
          </div>

          <div className="border border-slate-800 rounded p-4">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-3">
              <input
                type="checkbox"
                checked={useZoning}
                onChange={(e) => setUseZoning(e.target.checked)}
                className="rounded border-slate-600 bg-slate-800"
              />
              Check against parcel zoning constraints
            </label>

            {useZoning && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Lot width (ft)" value={parcel.lot_width_ft} onChange={(v) => setParcel((p) => ({ ...p, lot_width_ft: v }))} />
                <Field label="Lot depth (ft)" value={parcel.lot_depth_ft} onChange={(v) => setParcel((p) => ({ ...p, lot_depth_ft: v }))} />
                <Field label="Front setback (ft)" value={parcel.setbacks_front_ft} onChange={(v) => setParcel((p) => ({ ...p, setbacks_front_ft: v }))} />
                <Field label="Rear setback (ft)" value={parcel.setbacks_rear_ft} onChange={(v) => setParcel((p) => ({ ...p, setbacks_rear_ft: v }))} />
                <Field label="Side setback (ft)" value={parcel.setbacks_side_ft} onChange={(v) => setParcel((p) => ({ ...p, setbacks_side_ft: v }))} />
                <Field label="Max lot coverage (%)" value={parcel.max_lot_coverage_pct} onChange={(v) => setParcel((p) => ({ ...p, max_lot_coverage_pct: v }))} />
                <Field label="Septic bedroom cap" value={parcel.septic_bedroom_cap} onChange={(v) => setParcel((p) => ({ ...p, septic_bedroom_cap: v }))} placeholder="blank = central sewer" />
                <Field label="Utility tier" value={parcel.utility_tier} onChange={(v) => setParcel((p) => ({ ...p, utility_tier: v }))} placeholder="central / septic / UNDETERMINED" />
              </div>
            )}
          </div>

          {errors.length > 0 && (
            <div className="border border-red-900 bg-red-950/40 rounded p-4">
              <p className="text-sm font-semibold text-red-400 mb-2">Compile errors</p>
              <ul className="space-y-1 text-sm font-mono text-red-300">
                {errors.map((e, i) => (
                  <li key={i}>{e.message}</li>
                ))}
              </ul>
            </div>
          )}

          {warnings.length > 0 && (
            <div className="border border-amber-900 bg-amber-950/40 rounded p-4">
              <p className="text-sm font-semibold text-amber-400 mb-2">Warnings ({warnings.length})</p>
              <ul className="space-y-1 text-sm font-mono text-amber-300">
                {warnings.map((w, i) => (
                  <li key={i}>{w.message}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded border border-slate-800 overflow-hidden">
            <div className="bg-blue-950 min-h-[20rem] flex items-center justify-center p-4">
              {svg ? (
                <div className="bg-white rounded shadow-2xl p-2 w-full" dangerouslySetInnerHTML={{ __html: svg }} />
              ) : (
                <p className="text-blue-400 text-sm font-mono">Compile a plan to see it here.</p>
              )}
            </div>
            {summary && (
              <div className="bg-slate-900 px-4 py-2 flex items-center justify-between text-xs font-mono text-slate-400 border-t border-slate-800">
                <span>{summary.totals?.rooms ?? summary.rooms?.length ?? 0} rooms</span>
                <span>{summary.totals?.floor_area_m2 ?? '—'} m²</span>
                <span>{summary.totals?.doors ?? 0} doors</span>
                <span>{summary.totals?.windows ?? 0} windows</span>
              </div>
            )}
          </div>

          {zoning && (
            <div className="border border-slate-800 rounded p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-slate-200">Zoning compliance</p>
                <StatusBadge status={zoning.ok ? 'pass' : 'fail'} />
              </div>

              <div className="space-y-2">
                {(zoning.checks || []).map((c: any, i: number) => (
                  <div key={i} className="flex items-start justify-between gap-3 py-2 border-t border-slate-800 first:border-t-0 first:pt-0">
                    <div>
                      <p className="text-sm text-slate-300">
                        <RuleLabel rule={c.rule} />
                      </p>
                      {c.status === 'skipped' ? (
                        <p className="text-xs text-slate-500 mt-0.5">{c.reason}</p>
                      ) : (
                        <p className="text-xs font-mono text-slate-500 mt-0.5">{JSON.stringify(c.detail)}</p>
                      )}
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                ))}
              </div>

              {zoning.problems && zoning.problems.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-800">
                  <ul className="space-y-1 text-sm text-red-400">
                    {zoning.problems.map((p: string, i: number) => (
                      <li key={i}>• {p}</li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-xs text-slate-600 mt-3">
                Dimensional-fit and coverage check only — not a full site-plan setback check. See zoning.js for scope.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-xs text-slate-500">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-sm font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
      />
    </label>
  )
}
