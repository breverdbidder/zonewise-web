// lib/explorer/chat-actions.ts
// Programmatic map action dispatch — called by ExplorerChat and SearchChips
// to drive the map imperatively from text commands.

import type { ExplorerMapHandle } from '@/components/explorer/ExplorerMap'
import type { ZoningFilter, ChoroplethMetric } from './constants'

export type MapAction =
  | { type: 'FLY';       lat: number; lng: number; zoom?: number }
  | { type: 'CHOROPLETH'; metric: ChoroplethMetric }
  | { type: 'FILTER';    zoning: ZoningFilter }
  | { type: 'LAYER';     id: string; on: boolean }

/** Parse all [MAP:*] commands from an AI response string */
export function parseMapActions(text: string): MapAction[] {
  const actions: MapAction[] = []
  const re = /\[MAP:(\w+)\s+([^\]]+)\]/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    const [, action, args] = m
    try {
      switch (action) {
        case 'FLY': {
          const parts = args.trim().split(/,\s*/)
          const lat  = parseFloat(parts[0])
          const lng  = parseFloat(parts[1])
          const zoom = parts[2] ? parseFloat(parts[2]) : 14
          if (!isNaN(lat) && !isNaN(lng)) actions.push({ type: 'FLY', lat, lng, zoom })
          break
        }
        case 'CHOROPLETH':
          actions.push({ type: 'CHOROPLETH', metric: args.trim() as ChoroplethMetric })
          break
        case 'FILTER':
          actions.push({ type: 'FILTER', zoning: args.trim() as ZoningFilter })
          break
        case 'LAYER': {
          const [id, onOff] = args.trim().split(/\s+/)
          actions.push({ type: 'LAYER', id, on: onOff === 'on' })
          break
        }
      }
    } catch {}
  }
  return actions
}

/** Dispatch parsed actions to the map ref */
export function dispatchMapActions(
  actions: MapAction[],
  mapRef: React.RefObject<ExplorerMapHandle | null>,
) {
  const map = mapRef.current
  if (!map) return
  for (const action of actions) {
    try {
      switch (action.type) {
        case 'FLY':        map.flyTo(action.lat, action.lng, action.zoom); break
        case 'CHOROPLETH': map.setChoroplethMetric(action.metric);         break
        case 'FILTER':     map.filterZoning(action.zoning);                break
        case 'LAYER':      map.toggleLayer(action.id, action.on);          break
      }
    } catch {}
  }
}

/** Convenience: parse + dispatch in one call */
export function handleMapResponse(
  text: string,
  mapRef: React.RefObject<ExplorerMapHandle | null>,
) {
  dispatchMapActions(parseMapActions(text), mapRef)
}

/** Strip [MAP:*] commands from display text */
export function stripMapActions(text: string): string {
  return text.replace(/\[MAP:[^\]]+\]\n?/g, '').trim()
}
