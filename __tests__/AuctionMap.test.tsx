import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

// vi.mock is hoisted — cannot reference top-level variables from the test file
// Use vi.hoisted() to define class mocks that work with hoisting
const { MockMap, MockMarker } = vi.hoisted(() => {
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

  class MockMarker {
    setLngLat = vi.fn().mockReturnThis()
    addTo = vi.fn().mockReturnThis()
    remove = vi.fn()
    getElement = vi.fn(() => document.createElement('div'))
  }

  return { MockMap, MockMarker }
})

vi.mock('mapbox-gl', () => ({
  default: {
    Map: MockMap,
    NavigationControl: class { onAdd = vi.fn() },
    Marker: MockMarker,
    Popup: class {
      setLngLat = vi.fn().mockReturnThis()
      setHTML = vi.fn().mockReturnThis()
      addTo = vi.fn().mockReturnThis()
    },
    accessToken: '',
  },
}))

vi.mock('mapbox-gl/dist/mapbox-gl.css', () => ({}))

vi.mock('@/lib/theme-context', () => ({
  useTheme: () => ({ theme: 'dark' }),
}))

vi.mock('@/lib/scoring', () => ({
  getRecommendation: vi.fn(() => 'BUY'),
}))

vi.mock('@/lib/zoning', () => ({
  getZoningCategory: vi.fn(() => 'residential'),
  ZONING_CATEGORY_COLORS: {},
  ZONING_CATEGORY_LABELS: {},
}))

import AuctionMap from '../components/auctions/AuctionMap'

describe('AuctionMap', () => {
  it('renders without crashing', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({ data: [], returned: 0, total_mappable: 0, total_matching: 0 }),
        })
      ) as unknown as typeof fetch
    )
    const { container } = render(<AuctionMap onSelectAuction={vi.fn()} />)
    expect(container).toBeDefined()
  })
})
