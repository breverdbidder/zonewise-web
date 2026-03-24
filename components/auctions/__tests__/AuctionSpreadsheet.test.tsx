/**
 * AuctionSpreadsheet unit tests
 * Component: components/auctions/AuctionSpreadsheet.tsx
 */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import AuctionSpreadsheet from '../AuctionSpreadsheet'
import type { Auction } from '@/types/auctions'

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a>,
}))

// Mock lib/export
vi.mock('@/lib/export', () => ({
  downloadCSV: vi.fn(),
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
  source_url: null,
  scraped_at: null,
  created_at: null,
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
  enriched_at: null,
  is_condo: false,
  is_vacant_land: false,
  address_status: 'verified',
  dor_use_code: '001',
  zoning_category: 'SF',
  zone_code: 'RS-2',
  municipality: 'Melbourne',
  ...overrides,
})

describe('AuctionSpreadsheet', () => {
  const onSelectAuction = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing with empty auctions', () => {
    render(<AuctionSpreadsheet auctions={[]} loading={false} onSelectAuction={onSelectAuction} />)
    expect(document.body).toBeTruthy()
  })

  it('renders auction data in spreadsheet rows', () => {
    const auctions = [
      makeAuction({ id: 1, property_address: '100 Palm Dr, Titusville, FL', county: 'Brevard' }),
      makeAuction({ id: 2, property_address: '200 Cocoa Blvd, Cocoa, FL', county: 'Brevard', case_number: 'FC-2024-002' }),
    ]
    render(<AuctionSpreadsheet auctions={auctions} loading={false} onSelectAuction={onSelectAuction} />)
    expect(screen.getByText('100 Palm Dr, Titusville, FL')).toBeInTheDocument()
    expect(screen.getByText('200 Cocoa Blvd, Cocoa, FL')).toBeInTheDocument()
  })

  it('shows loading state when loading=true', () => {
    const { container } = render(
      <AuctionSpreadsheet auctions={[]} loading={true} onSelectAuction={onSelectAuction} />
    )
    expect(container.firstChild).toBeTruthy()
  })

  it('calls onSelectAuction when a row is clicked', () => {
    const auction = makeAuction({ id: 1, property_address: '999 Test Ave, Melbourne, FL' })
    render(<AuctionSpreadsheet auctions={[auction]} loading={false} onSelectAuction={onSelectAuction} />)

    const addressEl = screen.getByText('999 Test Ave, Melbourne, FL')
    const row = addressEl.closest('tr')
    expect(row).toBeTruthy()
    fireEvent.click(row!)
    expect(onSelectAuction).toHaveBeenCalledWith(auction)
  })

  it('displays sort column headers', () => {
    render(<AuctionSpreadsheet auctions={[]} loading={false} onSelectAuction={onSelectAuction} />)
    // Column headers should be present
    expect(screen.getByText(/County/i)).toBeInTheDocument()
    expect(screen.getByText(/Address/i)).toBeInTheDocument()
  })

  it('sorts when column header is clicked', () => {
    const auctions = [
      makeAuction({ id: 1, county: 'Sarasota', property_address: '1 Z Street, Sarasota, FL' }),
      makeAuction({ id: 2, county: 'Alachua', property_address: '2 A Street, Gainesville, FL', case_number: 'FC-2024-002' }),
    ]
    render(<AuctionSpreadsheet auctions={auctions} loading={false} onSelectAuction={onSelectAuction} />)
    // Click County header to sort
    const countyHeader = screen.getByText(/County/i)
    fireEvent.click(countyHeader)
    // After sort click, component should not crash
    expect(screen.getByText('1 Z Street, Sarasota, FL')).toBeInTheDocument()
    expect(screen.getByText('2 A Street, Gainesville, FL')).toBeInTheDocument()
  })
})
