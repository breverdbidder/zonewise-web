/**
 * Shared test helpers and MSW mock setup for API route integration tests.
 * External dependencies: BCPAO GIS, Gemini, Supabase.
 */

import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { vi } from 'vitest'

// ─── Env vars (must be set before any route import) ──────────────────────────
export function setTestEnv() {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  process.env.GEMINI_API_KEY = 'test-gemini-key'
  process.env.DEEPSEEK_API_KEY = 'test-deepseek-key'
}

// ─── Mock BCPAO GIS feature response ─────────────────────────────────────────
export const MOCK_BCPAO_FEATURE = {
  features: [
    {
      attributes: {
        PARCEL_ID: '24-36-14-54-00002.0-0004.00',
        TaxAcct: 2436145400002,
        OWNER_NAME: 'SAMPLE OWNER LLC',
        PHYSICAL_ADDR: '123 MAIN ST MELBOURNE FL 32901',
        ZONING: 'BU-1',
        JURISDICTION: 'Melbourne',
        TOT_VAL: 250000,
        LAND_VAL: 80000,
      },
    },
  ],
}

export const MOCK_BCPAO_EMPTY = { features: [] }

// ─── Mock Gemini API response ─────────────────────────────────────────────────
export const MOCK_GEMINI_RESPONSE = {
  candidates: [
    {
      content: {
        parts: [{ text: 'BU-1 zoning allows general retail and office uses.' }],
      },
    },
  ],
}

// ─── MSW handlers ─────────────────────────────────────────────────────────────
export const handlers = [
  // BCPAO GIS parcel query — success
  http.get('https://gis.brevardfl.gov/gissrv/rest/services/Base_Map/Parcel_New_WKID2881/MapServer/5/query', () => {
    return HttpResponse.json(MOCK_BCPAO_FEATURE)
  }),

  // BCPAO zoning overlay — success
  http.get('https://gis.brevardfl.gov/gissrv/rest/services/Planning_Development/Zoning_WKID2881/MapServer/0/query', () => {
    return HttpResponse.json({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [[[-80.7, 28.1], [-80.6, 28.1], [-80.6, 28.2], [-80.7, 28.2], [-80.7, 28.1]]] },
          properties: { ZONING: 'BU-1', JURISDICTION: 'Melbourne' },
        },
      ],
    })
  }),

  // Gemini LLM — success
  http.post('https://generativelanguage.googleapis.com/*', () => {
    return HttpResponse.json(MOCK_GEMINI_RESPONSE)
  }),

  // BCPAO photo proxy target
  http.get('https://www.bcpao.us/*', () => {
    return new HttpResponse(new Uint8Array([0xff, 0xd8, 0xff]), {
      headers: { 'Content-Type': 'image/jpeg' },
    })
  }),
]

export const server = setupServer(...handlers)

// ─── Supabase mock factory ────────────────────────────────────────────────────
export function buildSupabaseMock(overrides: Record<string, unknown> = {}) {
  const mockFrom = vi.fn()
  const client = {
    from: mockFrom,
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    ...overrides,
  }
  return { mockFrom, client }
}
