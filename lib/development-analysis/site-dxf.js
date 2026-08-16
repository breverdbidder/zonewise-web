// Site Massing DXF export — new capability alongside the existing PNG
// snapshot export in MassingEngine.tsx (handleSnapshot). Parallel export
// path only; does not touch the 3D render or the floorplan tool's DXF path.
//
// No existing DXF writer was found anywhere in this repo (the floorplan tool
// only exports PDF, client-side, via jsPDF/svg2pdf.js) — this introduces
// `dxf-writer` (js-dxf) as the first DXF dependency, plus `proj4` for the
// EPSG:4326 -> Florida State Plane reprojection the spec requires.

// Guard against webpack resolving these CJS packages via their `module`
// field and wrapping the export in an ESM-interop namespace object (seen
// during `next build`: proj4 came back as `{ default: fn }` instead of the
// callable function itself, so `proj4.defs` was undefined at import time).
const DrawingMod = require('dxf-writer')
const Drawing = DrawingMod.default || DrawingMod
const proj4Mod = require('proj4')
const proj4 = proj4Mod.default || proj4Mod

// Verified against epsg.io — these are the exact +proj4 defs published for
// NAD83 / Florida {East,West,North} (ftUS). Do not hand-edit without
// re-checking the source; a wrong constant here silently mis-scales every
// DXF this module writes.
proj4.defs('EPSG:2236', '+proj=tmerc +lat_0=24.3333333333333 +lon_0=-81 +k=0.999941177 +x_0=200000.0001016 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=us-ft +no_defs +type=crs')
proj4.defs('EPSG:2237', '+proj=tmerc +lat_0=24.3333333333333 +lon_0=-82 +k=0.999941177 +x_0=200000.0001016 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=us-ft +no_defs +type=crs')
proj4.defs('EPSG:2238', '+proj=lcc +lat_0=29 +lon_0=-84.5 +lat_1=30.75 +lat_2=29.5833333333333 +x_0=600000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=us-ft +no_defs +type=crs')

// FL DOR county name -> NAD83 State Plane zone (ftUS), per epsg.io county
// coverage lists for EPSG:2236/2237/2238. Keys are lowercase, trimmed.
const FL_COUNTY_TO_EPSG = {
  // East — EPSG:2236
  brevard: 'EPSG:2236', broward: 'EPSG:2236', clay: 'EPSG:2236', collier: 'EPSG:2236',
  'miami-dade': 'EPSG:2236', dade: 'EPSG:2236', duval: 'EPSG:2236', flagler: 'EPSG:2236',
  glades: 'EPSG:2236', hendry: 'EPSG:2236', highlands: 'EPSG:2236', 'indian river': 'EPSG:2236',
  lake: 'EPSG:2236', martin: 'EPSG:2236', monroe: 'EPSG:2236', nassau: 'EPSG:2236',
  okeechobee: 'EPSG:2236', orange: 'EPSG:2236', osceola: 'EPSG:2236', 'palm beach': 'EPSG:2236',
  putnam: 'EPSG:2236', seminole: 'EPSG:2236', 'st johns': 'EPSG:2236', 'st lucie': 'EPSG:2236',
  volusia: 'EPSG:2236',
  // West — EPSG:2237
  charlotte: 'EPSG:2237', citrus: 'EPSG:2237', desoto: 'EPSG:2237', 'de soto': 'EPSG:2237',
  hardee: 'EPSG:2237', hernando: 'EPSG:2237', hillsborough: 'EPSG:2237', lee: 'EPSG:2237',
  levy: 'EPSG:2237', manatee: 'EPSG:2237', marion: 'EPSG:2237', pasco: 'EPSG:2237',
  pinellas: 'EPSG:2237', polk: 'EPSG:2237', sarasota: 'EPSG:2237', sumter: 'EPSG:2237',
  // North — EPSG:2238
  alachua: 'EPSG:2238', baker: 'EPSG:2238', bay: 'EPSG:2238', bradford: 'EPSG:2238',
  calhoun: 'EPSG:2238', columbia: 'EPSG:2238', dixie: 'EPSG:2238', escambia: 'EPSG:2238',
  franklin: 'EPSG:2238', gadsden: 'EPSG:2238', gilchrist: 'EPSG:2238', gulf: 'EPSG:2238',
  hamilton: 'EPSG:2238', holmes: 'EPSG:2238', jackson: 'EPSG:2238', jefferson: 'EPSG:2238',
  lafayette: 'EPSG:2238', leon: 'EPSG:2238', liberty: 'EPSG:2238', madison: 'EPSG:2238',
  okaloosa: 'EPSG:2238', 'santa rosa': 'EPSG:2238', suwannee: 'EPSG:2238', taylor: 'EPSG:2238',
  union: 'EPSG:2238', wakulla: 'EPSG:2238', walton: 'EPSG:2238', washington: 'EPSG:2238',
}

class SiteDxfUnsupportedCountyError extends Error {
  constructor(county) {
    super(`No verified FL State Plane EPSG mapping for county "${county}" — refusing to write a possibly mis-scaled DXF. Log and skip this county rather than guessing.`)
    this.name = 'SiteDxfUnsupportedCountyError'
    this.county = county
  }
}

function lookupEpsgForCounty(county) {
  const key = (county || '').toLowerCase().trim()
  const epsg = FL_COUNTY_TO_EPSG[key]
  if (!epsg) throw new SiteDxfUnsupportedCountyError(county)
  return epsg
}

function ringToStatePlane(ring, epsgCode) {
  return ring.map(([lng, lat]) => proj4('EPSG:4326', epsgCode, [lng, lat]))
}

/**
 * Export a DXF for one candidate massing footprint on a real parcel.
 *
 * Handles two candidate shapes from site-massing-solver.ts:
 *   - single_family (`CandidateFootprint`): one footprint ring + `.env`
 *     (bw/bd/actualGFA/floors). Original v1 shape, unchanged below.
 *   - townhome_row / multifamily_grid (`MultiUnitCandidate`, added for the
 *     #19149 SSOT consolidation): `.subFootprints` — real per-unit +
 *     access-drive rings (ported from the Worker's unit-packing patterns) —
 *     drawn directly instead of the single-footprint + placeholder-stub-line
 *     approximation the single_family path uses.
 *
 * @param {{ parcel_id: string, address?: string, county: string, boundaryLngLat: [number, number][] }} parcel
 * @param {{ zone_code: string, district_name?: string }} zoning
 * @param {import('./site-massing-solver').CandidateFootprint | import('./site-massing-solver').MultiUnitCandidate} candidate
 * @returns {Buffer}
 */
function exportSiteMassingDXF(parcel, zoning, candidate) {
  const epsgCode = lookupEpsgForCounty(parcel.county)

  const parcelSP = ringToStatePlane(parcel.boundaryLngLat, epsgCode)
  const envelopeSP = ringToStatePlane(candidate.envelopeLngLat, epsgCode)
  const footprintSP = ringToStatePlane(candidate.footprintLngLat, epsgCode)
  const isMultiUnit = Array.isArray(candidate.subFootprints)

  const d = new Drawing()
  d.setUnits('Feet')

  d.addLayer('PARCEL-BNDY', Drawing.ACI.YELLOW, 'CONTINUOUS')
  d.addLayer('SETBACK-LINES', Drawing.ACI.GREEN, 'DASHED')
  d.addLayer('BLDG-FOOTPRINT', Drawing.ACI.CYAN, 'CONTINUOUS')
  d.addLayer('ACCESS-DRIVE', Drawing.ACI.WHITE, 'CONTINUOUS')
  d.addLayer('DIMENSIONS', Drawing.ACI.MAGENTA, 'CONTINUOUS')
  d.addLayer('TEXT-ANNO', Drawing.ACI.BLUE, 'CONTINUOUS')

  d.setActiveLayer('PARCEL-BNDY')
  d.drawPolyline(parcelSP, true)

  d.setActiveLayer('SETBACK-LINES')
  d.drawPolyline(envelopeSP, true)

  const fp = footprintSP
  if (isMultiUnit) {
    // Real per-unit + access-drive geometry, one polyline per sub-footprint —
    // not the single-footprint approximation below.
    for (const sub of candidate.subFootprints) {
      const ringSP = ringToStatePlane(sub.ringLngLat, epsgCode)
      d.setActiveLayer(sub.kind === 'access_drive' ? 'ACCESS-DRIVE' : 'BLDG-FOOTPRINT')
      d.drawPolyline(ringSP, true)
    }
  } else {
    d.setActiveLayer('BLDG-FOOTPRINT')
    d.drawPolyline(fp, true)

    // ACCESS-DRIVE — straight stub from the footprint's front edge midpoint
    // out to the parcel boundary along the front-setback direction. This is a
    // placeholder alignment (no true driveway/curb-cut routing), documented
    // as a simplification — full driveway routing is out of scope for v1.
    d.setActiveLayer('ACCESS-DRIVE')
    const frontMidX = (fp[0][0] + fp[1][0]) / 2
    const frontMidY = (fp[0][1] + fp[1][1]) / 2
    const parcelFrontY = Math.min(...parcelSP.map(p => p[1]))
    d.drawLine(frontMidX, frontMidY, frontMidX, parcelFrontY)
  }

  // DIMENSIONS — width/depth call-outs on the overall footprint bbox. js-dxf
  // has no native DIMENSION entity, so these are drawn as leader lines +
  // text (still a real, parseable DIMENSIONS layer, just not an associative
  // AutoCAD dimension).
  d.setActiveLayer('DIMENSIONS')
  const dimOffset = 8
  const frontMidXDim = (fp[0][0] + fp[1][0]) / 2
  if (isMultiUnit) {
    const widthFt = Math.max(...fp.map(p => p[0])) - Math.min(...fp.map(p => p[0]))
    const depthFt = Math.max(...fp.map(p => p[1])) - Math.min(...fp.map(p => p[1]))
    d.drawLine(fp[0][0], fp[0][1] - dimOffset, fp[1][0], fp[1][1] - dimOffset)
    d.drawText(frontMidXDim, fp[0][1] - dimOffset - 2, 3, 0, `${widthFt.toFixed(1)} ft`, 'center', 'top')
    d.drawLine(fp[1][0] + dimOffset, fp[1][1], fp[2][0] + dimOffset, fp[2][1])
    d.drawText(fp[1][0] + dimOffset + 2, (fp[1][1] + fp[2][1]) / 2, 3, 90, `${depthFt.toFixed(1)} ft`, 'center', 'bottom')
  } else {
    const widthFt = candidate.env.bw * candidate.fitScale
    const depthFt = candidate.env.bd * candidate.fitScale
    d.drawLine(fp[0][0], fp[0][1] - dimOffset, fp[1][0], fp[1][1] - dimOffset)
    d.drawText(frontMidXDim, fp[0][1] - dimOffset - 2, 3, 0, `${widthFt.toFixed(1)} ft`, 'center', 'top')
    d.drawLine(fp[1][0] + dimOffset, fp[1][1], fp[2][0] + dimOffset, fp[2][1])
    d.drawText(fp[1][0] + dimOffset + 2, (fp[1][1] + fp[2][1]) / 2, 3, 90, `${depthFt.toFixed(1)} ft`, 'center', 'bottom')
  }

  // TEXT-ANNO — unit count / GFA / coverage % / north arrow
  d.setActiveLayer('TEXT-ANNO')
  const cx = (Math.min(...parcelSP.map(p => p[0])) + Math.max(...parcelSP.map(p => p[0]))) / 2
  const topY = Math.max(...parcelSP.map(p => p[1])) + 15
  d.drawText(cx, topY, 4, 0, `${zoning.zone_code}${zoning.district_name ? ' — ' + zoning.district_name : ''}`, 'center', 'bottom')
  if (isMultiUnit) {
    d.drawText(cx, topY - 6, 3, 0, `${candidate.layoutType.toUpperCase()}  ·  Units: ${candidate.unitCount}  ·  GFA: ${Math.round(candidate.grossFloorAreaSqft).toLocaleString()} sf  ·  Coverage: ${candidate.lotCoveragePct.toFixed(1)}%`, 'center', 'bottom')
  } else {
    d.drawText(cx, topY - 6, 3, 0, `GFA: ${Math.round(candidate.env.actualGFA * candidate.fitScale * candidate.fitScale).toLocaleString()} sf  ·  Coverage: ${candidate.covPct.toFixed(1)}%  ·  Floors: ${candidate.env.floors}`, 'center', 'bottom')
  }
  const northX = Math.max(...parcelSP.map(p => p[0])) + 15
  const northYBase = Math.max(...parcelSP.map(p => p[1]))
  d.drawLine(northX, northYBase, northX, northYBase + 12)
  d.drawPolyline([[northX - 2, northYBase + 9], [northX, northYBase + 14], [northX + 2, northYBase + 9]], true)
  d.drawText(northX, northYBase + 16, 3, 0, 'N', 'center', 'bottom')

  return Buffer.from(d.toDxfString(), 'utf-8')
}

// Uploads a generated DXF to Supabase Storage at site-dxf/<run_id>/<option_id>.dxf
// and returns the storage path. Same bucket + path convention as the
// decommissioned Worker's site-massing-persistence.js (`saveDxf`), reused
// here rather than reinvented per the #19149 SSOT consolidation. Plain
// `fetch` against the Storage REST API (no supabase-js dependency), so this
// stays a pure-ish module like the rest of this file — the caller (the
// /api/massing/dxf route) supplies the already-authenticated env values.
const DXF_BUCKET = 'site-dxf'

async function saveSiteMassingDxfToStorage({ supabaseUrl, serviceKey, runId, optionId, dxfBuffer }) {
  if (!supabaseUrl || !serviceKey) throw new Error('saveSiteMassingDxfToStorage: supabaseUrl and serviceKey are required')
  const objectPath = `${runId}/${optionId}.dxf`

  const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/${DXF_BUCKET}/${objectPath}`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/dxf',
      'x-upsert': 'true',
    },
    body: dxfBuffer,
  })
  if (!uploadRes.ok) {
    const text = await uploadRes.text()
    throw new Error(`Storage upload (${DXF_BUCKET}/${objectPath}) failed (${uploadRes.status}): ${text}`)
  }

  return `${DXF_BUCKET}/${objectPath}`
}

module.exports = {
  exportSiteMassingDXF,
  saveSiteMassingDxfToStorage,
  lookupEpsgForCounty,
  SiteDxfUnsupportedCountyError,
  FL_COUNTY_TO_EPSG,
  DXF_BUCKET,
}
