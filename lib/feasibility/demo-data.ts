// ZoneWise.AI — Demo Data (Phase 1)
// TODO: Replace with Supabase queries in Phase 2 (Issue #23)

import type { SiteData, ZoningControl, RentComp, UnitRent, UnitMix } from '@/types/feasibility'

export const DEMO_SITE: SiteData = {
  address: '1233 Highway A1A, Satellite Beach, FL 32937',
  parcelId: '26-37-03-76-00012.0-0001.00',
  parcelValue: 485000,
  ownership: 'COASTAL HOLDINGS LLC',
  zone: 'GU (General Use)',
  zoneCity: 'Satellite Beach',
  county: 'Brevard',
  flood: 'AE',
  qoz: 'No',
  lotArea: 12500,
  maxHeight: 35,
  far: 2.0,
  coverage: 0.50,
  setFront: 25,
  setSide: 10,
  setRear: 20,
  parking: 1.5,
  yearBuilt: 1972,
  livingUnits: 1,
  lat: 28.1764,
  lng: -80.5901,
}

export const DEMO_ZONING_CONTROLS: ZoningControl[] = [
  { control: 'Max Height', value: '35 ft', assumption: 'GU residential maximum (Brevard County)', citation: '§62-1334' },
  { control: 'FAR', value: '2.0', assumption: 'General Use district standard', citation: '§62-1336' },
  { control: 'Lot Coverage', value: '50%', assumption: 'Impervious surface maximum', citation: '§62-1338' },
  { control: 'Front Setback', value: '25 ft', assumption: 'Arterial road (A1A) requirement', citation: '§62-1340' },
  { control: 'Side Setback', value: '10 ft', assumption: 'Interior lot minimum', citation: '§62-1340' },
  { control: 'Rear Setback', value: '20 ft', assumption: 'Standard rear yard', citation: '§62-1340' },
  { control: 'Parking', value: '1.5/unit', assumption: 'Multifamily residential requirement', citation: '§62-1400' },
]

export const DEMO_COMPS: RentComp[] = [
  { name: 'Oceanfront Villas', addr: '1100 Hwy A1A', units: 24, year: 2019, occ: 96, one: 1850, two: 2400 },
  { name: 'Beach Walk Apts', addr: '455 Jackson Ave', units: 16, year: 2021, occ: 98, one: 1750, two: 2250 },
  { name: 'Pelican Landing', addr: '700 S Patrick Dr', units: 32, year: 2018, occ: 95, one: 1650, two: 2100 },
  { name: 'Atlantic Breeze', addr: '890 Hwy A1A', units: 20, year: 2020, occ: 97, one: 1900, two: 2500 },
  { name: 'Sea Grape Commons', addr: '320 Desoto Pkwy', units: 12, year: 2022, occ: 99, one: 1800, two: 2350 },
]

export const DEMO_UNIT_RENTS: UnitRent[] = [
  { type: 'Studio', rent: 1450, sf: 425, psf: 3.41 },
  { type: 'One BR', rent: 1790, sf: 650, psf: 2.75 },
  { type: 'Two BR', rent: 2320, sf: 950, psf: 2.44 },
  { type: 'Three BR', rent: 2850, sf: 1250, psf: 2.28 },
]

export const DEMO_UNIT_MIX: UnitMix[] = [
  { type: 'Studio', pct: 10, sf: 425, rent: 1450 },
  { type: 'One BR', pct: 40, sf: 650, rent: 1790 },
  { type: 'Two BR', pct: 35, sf: 950, rent: 2320 },
  { type: 'Three BR', pct: 15, sf: 1250, rent: 2850 },
]
