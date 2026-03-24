/**
 * CountyGrid unit tests
 * Component: components/conquest/CountyGrid.tsx
 */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import CountyGrid from '../CountyGrid'
import type { CountyConquestStatus } from '@/lib/conquest'

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a>,
}))

// Mock Supabase client
const mockUnsubscribe = vi.fn()
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    })),
    removeChannel: vi.fn(),
  })),
}))

// Mock conquest lib
vi.mock('@/lib/conquest', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/conquest')>()
  return {
    ...actual,
    subscribeToConquestUpdates: vi.fn(() => mockUnsubscribe),
  }
})

const makeCounty = (overrides: Partial<CountyConquestStatus> = {}): CountyConquestStatus => ({
  slug: 'brevard',
  name: 'Brevard',
  fips: '12009',
  dor_number: 15,
  region: 'central',
  population: 601942,
  total_parcels: 351424,
  zoned_parcels: 327882,
  coverage_pct: 93.3,
  conquered: true,
  last_run: '2024-03-01',
  ...overrides,
})

describe('CountyGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing with empty data', () => {
    render(<CountyGrid initialData={[]} />)
    expect(document.body).toBeTruthy()
  })

  it('renders county cards for each county', () => {
    const counties = [
      makeCounty({ slug: 'brevard', name: 'Brevard', conquered: true }),
      makeCounty({ slug: 'orange', name: 'Orange', conquered: false, region: 'central', dor_number: 48, coverage_pct: 0 }),
    ]
    render(<CountyGrid initialData={counties} />)
    expect(screen.getByText('Brevard')).toBeInTheDocument()
    expect(screen.getByText('Orange')).toBeInTheDocument()
  })

  it('shows CONQUERED badge for conquered counties', () => {
    const counties = [makeCounty({ conquered: true })]
    render(<CountyGrid initialData={counties} />)
    expect(screen.getByText('CONQUERED')).toBeInTheDocument()
  })

  it('does not show CONQUERED badge for pending counties', () => {
    const counties = [makeCounty({ conquered: false, coverage_pct: 0, zoned_parcels: 0 })]
    render(<CountyGrid initialData={counties} />)
    expect(screen.queryByText('CONQUERED')).not.toBeInTheDocument()
  })

  it('filters counties by search query', () => {
    const counties = [
      makeCounty({ slug: 'brevard', name: 'Brevard' }),
      makeCounty({ slug: 'alachua', name: 'Alachua', region: 'north', dor_number: 1, conquered: false }),
    ]
    render(<CountyGrid initialData={counties} />)

    const searchInput = screen.getByPlaceholderText(/Search county/i)
    fireEvent.change(searchInput, { target: { value: 'Alachua' } })

    expect(screen.queryByText('Brevard')).not.toBeInTheDocument()
    expect(screen.getByText('Alachua')).toBeInTheDocument()
  })

  it('filters by region when region button is clicked', () => {
    const counties = [
      makeCounty({ slug: 'brevard', name: 'Brevard', region: 'central' }),
      makeCounty({ slug: 'escambia', name: 'Escambia', region: 'panhandle', dor_number: 17, conquered: false, coverage_pct: 0 }),
    ]
    render(<CountyGrid initialData={counties} />)

    // Click the 'panhandle' filter button
    const panhandleBtn = screen.getByText('panhandle')
    fireEvent.click(panhandleBtn)

    expect(screen.queryByText('Brevard')).not.toBeInTheDocument()
    expect(screen.getByText('Escambia')).toBeInTheDocument()
  })

  it('renders search input and region buttons', () => {
    render(<CountyGrid initialData={[]} />)
    expect(screen.getByPlaceholderText(/Search county/i)).toBeInTheDocument()
    expect(screen.getByText(/panhandle/i)).toBeInTheDocument()
    expect(screen.getByText(/north/i)).toBeInTheDocument()
    expect(screen.getByText(/central/i)).toBeInTheDocument()
    expect(screen.getByText(/south/i)).toBeInTheDocument()
  })

  it('displays coverage percentage for each county', () => {
    const counties = [makeCounty({ coverage_pct: 93.3 })]
    render(<CountyGrid initialData={counties} />)
    expect(screen.getByText('93%')).toBeInTheDocument()
  })
})
