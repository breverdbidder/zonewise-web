export const dynamic = 'force-dynamic'

import ProFormaStudio from '@/components/proforma/ProFormaStudio'
import ErrorBoundary from '@/components/ErrorBoundary'
import ToolIntroBanner from '@/components/ToolIntroBanner'

export const metadata = {
  title: 'Pro Forma Studio | ZoneWise.AI',
  description: 'Development financial modeling — cost, revenue, NOI, IRR, and Algoma-style outcome reports for Brevard County parcels',
}

export default function ProFormaPage() {
  return (
    <ErrorBoundary>
      <ToolIntroBanner
        title="Pro Forma Studio"
        description="Turn a unit count and building envelope into a full development pro forma"
        steps={[
          'Enter the unit count and gross floor area from the 3D Massing Studio (or type them in directly).',
          'Choose a construction type, land basis, and deal type (rental hold vs. build-and-sell), then supply your own rent or sale price assumption — this tool never fabricates market comps.',
          'Click "Calculate Pro Forma" to see development cost, NOI, cap-rate-implied value, cash-on-cash return, multi-year IRR, and equity multiple — every number shown alongside its formula.',
          'Optionally check "Compare against a baseline scenario" (e.g. as-of-right single family vs. optimized multifamily) to generate a before/after comparison block.',
          'Attach a PNG render exported from the Massing Studio, then click "Download PDF" for a shareable outcome report.',
        ]}
        tip="Hard cost $/sf and soft cost % are starting assumptions, not live market data — tune them per project before using this for a real underwriting decision."
      />
      <ProFormaStudio />
    </ErrorBoundary>
  )
}
