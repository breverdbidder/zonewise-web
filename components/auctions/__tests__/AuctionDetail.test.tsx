/**
 * AuctionDetail unit tests
 * Component: components/auctions/AuctionDetail.tsx
 */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import AuctionDetail from '../AuctionDetail'
import type { AuctionDetail as AuctionDetailType } from '@/types/auctions'

// Mock Next.js navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a>,
}))

vi.mock('next/image', () => ({
  default: ({ src, alt }: any) => <img src={src} alt={alt} />,
}))

// Mock next/dynamic (AuctionDetailMap is dynamically imported)
vi.mock('next/dynamic', () => ({
  default: () => () => <div data-testid="auction-detail-map">Map</div>,
}))

// Mock lib/zoning
vi.mock('@/lib/zoning', () => ({
  parseDimensionalStandards: vi.fn(() => null),
}))

const makeAuctionDetail = (overrides: Partial<AuctionDetailType> = {}): AuctionDetailType => ({
  id: 42,
  county: 'Brevard',
  case_number: 'FC-2024-042',
  property_address: '42 Elm Street, Rockledge, FL 32955',
  auction_type: 'foreclosure',
  auction_date: '2024-08-20',
  plaintiff: 'Nationstar Mortgage',
  defendant: 'Jane Smith',
  judgment_amount: 320000,
  assessed_value: 350000,
  opening_bid: 180000,
  parcel_id: '24-36-02-00-00042.0-0000.00',
  source_url: 'https://brevard.realforeclose.com/listing/42',
  scraped_at: '2024-03-10T00:00:00Z',
  created_at: '2024-03-10T00:00:00Z',
  fl_parcel_id: null,
  fl_co_no: 15,
  just_value: 380000,
  land_value: 60000,
  total_living_area: 2200,
  year_built: 2003,
  owner_name: 'Jane Smith',
  lot_sqft: 10000,
  centroid_lat: 28.35,
  centroid_lng: -80.72,
  photo_url: null,
  enriched_at: '2024-03-10T12:00:00Z',
  is_condo: false,
  is_vacant_land: false,
  address_status: 'verified',
  dor_use_code: '001',
  zoning_category: 'SF',
  zone_code: 'RS-1',
  municipality: 'Rockledge',
  bcpao_photo_url: null,
  zoning: null,
  recommendation: 'BID',
  recommendation_color: 'text-green-500',
  max_bid: 210000,
  bid_ratio: 0.85,
  ...overrides,
})

describe('AuctionDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading spinner while fetching', () => {
    // Fetch never resolves in this test
    global.fetch = vi.fn(() => new Promise(() => {})) as any
    render(<AuctionDetail auctionId="42" />)
    expect(screen.getByText(/Loading auction/i)).toBeInTheDocument()
  })

  it('shows error message when auction is not found (404)', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({}),
    }) as any

    render(<AuctionDetail auctionId="999" />)
    await waitFor(() => {
      expect(screen.getByText(/Auction not found/i)).toBeInTheDocument()
    })
  })

  it('shows generic error when fetch fails', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    }) as any

    render(<AuctionDetail auctionId="999" />)
    await waitFor(() => {
      expect(screen.getByText(/Failed to load auction/i)).toBeInTheDocument()
    })
  })

  it('renders auction data after successful fetch', async () => {
    const detail = makeAuctionDetail()
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => detail,
    }) as any

    render(<AuctionDetail auctionId="42" />)
    await waitFor(() => {
      expect(screen.getByText('42 Elm Street, Rockledge, FL 32955')).toBeInTheDocument()
    })
    expect(screen.getByText('FC-2024-042')).toBeInTheDocument()
  })

  it('renders BID recommendation badge when API returns BID', async () => {
    const detail = makeAuctionDetail({ recommendation: 'BID' })
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => detail,
    }) as any

    render(<AuctionDetail auctionId="42" />)
    await waitFor(() => {
      expect(screen.getAllByText('BID').length).toBeGreaterThan(0)
    })
  })

  it('renders back-to-auctions button on error', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({}),
    }) as any

    render(<AuctionDetail auctionId="bad-id" />)
    await waitFor(() => {
      expect(screen.getByText(/Back to Auctions/i)).toBeInTheDocument()
    })
  })
})
