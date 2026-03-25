import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('next/dynamic', () => ({
  default: () => () => null,
}))

vi.mock('three', () => ({
  Scene: vi.fn(),
  PerspectiveCamera: vi.fn(),
  WebGLRenderer: vi.fn(() => ({ setSize: vi.fn(), render: vi.fn(), domElement: document.createElement('canvas') })),
  BoxGeometry: vi.fn(),
  MeshStandardMaterial: vi.fn(),
  Mesh: vi.fn(() => ({ position: { set: vi.fn() }, rotation: {} })),
  AmbientLight: vi.fn(),
  DirectionalLight: vi.fn(() => ({ position: { set: vi.fn() } })),
  Group: vi.fn(() => ({ add: vi.fn(), rotation: {} })),
  Vector3: vi.fn(),
  Color: vi.fn(),
  EdgesGeometry: vi.fn(),
  LineSegments: vi.fn(() => ({ position: { set: vi.fn() } })),
  LineBasicMaterial: vi.fn(),
}))

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(() => ({ from: vi.fn(), auth: {} })),
}))

vi.mock('@/lib/hooks/useEnvelopeData', () => ({
  useEnvelopeData: vi.fn(() => ({
    parcels: [], loading: false, error: null,
    fetchParcels: vi.fn(), fetchParcelById: vi.fn(), fetchHBU: vi.fn(),
  })),
}))

vi.mock('@/lib/development-analysis/hbu-engine', () => ({
  computeEnvelope: vi.fn(() => ({})),
  calculateHBU: vi.fn(() => []),
  mapRow: vi.fn((r: any) => r),
  CONSTRUCTION_COSTS: {},
  ZONE_PERMITTED: {},
}))

import { DevIntelTab } from '../components/envelope/DevIntelTab'

describe('DevIntelTab', () => {
  it('renders without crashing', () => {
    const { container } = render(<DevIntelTab />)
    expect(container).toBeDefined()
  })
})
