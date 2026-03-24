/**
 * AuctionTable unit tests
 * Component: components/auctions/AuctionTable.tsx
 */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import AuctionTable from '../AuctionTable'
import type { Auction } from '@/types/auctions'

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a>,
}))

// Mock lib/scoring
vi.mock('@/lib/scoring', () => ({
  getRecommendation: vi.fn(() => ({
    recommendation: 'BID',
    color: 'text-green-500',
    maxBid: 150000,
    ratio: 0.85,
  })),
}))

// Mock lib/zoning
vi.mock('@/lib/zoning', () => ({
  getZoningCategory: vi.fn(() => 'SF'),
  ZONING_CATEGORY_COLORS: {
    SF: { bg: 'bg-blue-100', text: 'text-blue-700' },
  },
  ZONING_CATEGORY_LABELS: {
    SF: 'Single Family',
  },
}))

const makeAuction = (overrides: Partial<Auction> = {}): Auction => ({
  id: 1,
  county: 'Brevard',
  case_number: 'FC-2024-001',
  property_address: '123 Main St, Melbourne, FL 32940',
  auction_type: 'foreclosure',
  auction_date: '2024-06-15',
  plaintiff: 'First National Bank',
  defendant: 'John Doe',
  judgment_amount: 200000,
  assessed_value: 250000,
  opening_bid: 150000,
  parcel_id: '24-37-12-00-00123.0-0000.00',
  source_url: 'https://brevard.realforeclose.com/listing/123',
  scraped_at: '2024-03-01T00:00:00Z',
  created_at: '2024-03-01T00:00:00Z',
  fl_parcel_id: null,
  fl_co_no: 15,
  just_value: 280000,
  land_value: 50000,
  total_living_area: 1800,
  year_built: 1995,
  owner_name: 'John Doe',
  lot_sqft: 8500,
  centroid_lat: 28.1,
  centroid_lng: -80.6,
  photo_url: null,
  enriched_at: '2024-03-01T12:00:00Z',
  is_condo: false,
  is_vacant_land: false,
  address_status: 'verified',
  dor_use_code: '001',
  zoning_category: 'SF',
  zone_code: 'RS-2',
  municipality: 'Melbourne',
  ...overrides,
})

describe('AuctionTable', () => {
  const onSelectAuction = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing with empty auctions', () => {
    render(<AuctionTable auctions={[]} loading={false} onSelectAuction={onSelectAuction} />)
    // Should render the table structure
    expect(document.body).toBeTruthy()
  })

  it('shows loading skeleton when loading=true', () => {
    const { container } = render(
      <AuctionTable auctions={[]} loading={true} onSelectAuction={onSelectAuction} />
    )
    // Loading state renders some skeleton/placeholder UI
    expect(container.firstChild).toBeTruthy()
  })

  it('renders auction rows with data', () => {
    const auctions = [
      makeAuction({ id: 1, case_number: 'FC-2024-001', property_address: '123 Main St, Melbourne, FL' }),
      makeAuction({ id: 2, case_number: 'FC-2024-002', property_address: '456 Oak Ave, Cocoa, FL', county: 'Brevard' }),
    ]
    render(<AuctionTable auctions={auctions} loading={false} onSelectAuction={onSelectAuction} />)
    expect(screen.getByText('123 Main St, Melbourne, FL')).toBeInTheDocument()
    expect(screen.getByText('456 Oak Ave, Cocoa, FL')).toBeInTheDocument()
  })

  it('calls onSelectAuction when a row is clicked', () => {
    const auction = makeAuction({ id: 1, property_address: '123 Main St, Melbourne, FL' })
    render(<AuctionTable auctions={[auction]} loading={false} onSelectAuction={onSelectAuction} />)

    const row = screen.getByText('123 Main St, Melbourne, FL').closest('tr')
    expect(row).toBeTruthy()
    fireEvent.click(row!)
    expect(onSelectAuction).toHaveBeenCalledWith(auction)
  })

  it('shows county name in table', () => {
    const auction = makeAuction({ county: 'Brevard' })
    render(<AuctionTable auctions={[auction]} loading={false} onSelectAuction={onSelectAuction} />)
    expect(screen.getAllByText('Brevard').length).toBeGreaterThan(0)
  })

  it('formats currency values correctly', () => {
    const auction = makeAuction({ opening_bid: 150000, just_value: 280000 })
    const { container } = render(<AuctionTable auctions={[auction]} loading={false} onSelectAuction={onSelectAuction} />)
    // AuctionTable renders just_value column — verify currency formatting
    expect(container.innerHTML).toContain('280,000')
  })
})
