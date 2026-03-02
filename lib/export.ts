import type { Auction } from '@/types/auctions'

const CSV_HEADERS = [
  'County', 'Case Number', 'Address', 'Auction Date', 'Type',
  'Plaintiff', 'Defendant', 'Just Value', 'Opening Bid', 'Judgment Amount',
  'Year Built', 'Living Area (sqft)', 'Lot (sqft)', 'Owner',
  'Parcel ID', 'Vacant Land', 'Condo',
]

function escapeCSV(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return '"' + val.replace(/"/g, '""') + '"'
  }
  return val
}

function auctionToRow(a: Auction): string[] {
  return [
    a.county || '',
    a.case_number || '',
    a.property_address || '',
    a.auction_date || '',
    a.auction_type || '',
    a.plaintiff || '',
    a.defendant || '',
    a.just_value?.toString() || '',
    a.opening_bid?.toString() || '',
    a.judgment_amount?.toString() || '',
    a.year_built?.toString() || '',
    a.total_living_area?.toString() || '',
    a.lot_sqft?.toString() || '',
    a.owner_name || '',
    a.parcel_id || '',
    a.is_vacant_land ? 'Yes' : 'No',
    a.is_condo ? 'Yes' : 'No',
  ]
}

export function downloadCSV(auctions: Auction[], filename = 'zonewise-auctions.csv') {
  const rows = auctions.map(a => auctionToRow(a).map(escapeCSV).join(','))
  const csv = [CSV_HEADERS.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
