import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

// vi.mock is hoisted — use vi.hoisted() for class mocks
const { MockMap } = vi.hoisted(() => {
  class MockMap {
    on = vi.fn()
    off = vi.fn()
    remove = vi.fn()
    addControl = vi.fn()
    getCanvas = vi.fn(() => ({ style: {} }))
    flyTo = vi.fn()
    setStyle = vi.fn()
    addSource = vi.fn()
    addLayer = vi.fn()
    getLayer = vi.fn(() => null)
    getSource = vi.fn(() => null)
    setFilter = vi.fn()
    setPaintProperty = vi.fn()
    isStyleLoaded = vi.fn(() => true)
  }

  return { MockMap }
})

vi.mock('mapbox-gl', () => ({
  default: {
    Map: MockMap,
    NavigationControl: class { onAdd = vi.fn() },
    AttributionControl: class { onAdd = vi.fn() },
    accessToken: '',
  },
}))

vi.mock('mapbox-gl/dist/mapbox-gl.css', () => ({}))

vi.mock('@/lib/feasibility/constants', () => ({
  getMapboxToken: vi.fn(() => 'pk.mock-token'),
}))

vi.mock('@/lib/explorer/constants', () => ({
  ENDPOINTS: {},
  BREVARD_BOUNDS: [[-81.5, 27.8], [-80.3, 28.8]],
  BREVARD_CENTER: [-80.9, 28.3],
  ZONING_LABELS: {},
  formatAddress: vi.fn((a: string) => a),
  formatCurrency: vi.fn((n: number) => `$${n}`),
  getZoningColor: vi.fn(() => '#ccc'),
  CHOROPLETH_COLOR_STOPS: [],
}))

vi.mock('@/lib/explorer/zillow', () => ({}))

import ExplorerMap from '../components/explorer/ExplorerMap'

describe('ExplorerMap', () => {
  it('renders without crashing', () => {
    const { container } = render(<ExplorerMap />)
    expect(container).toBeDefined()
  })
})
