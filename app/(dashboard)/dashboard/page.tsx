import EnterpriseLayout from '@/components/enterprise/EnterpriseLayout'
import SplitScreen from '@/components/conversion/SplitScreen'
import DashboardContainer from '@/components/conversion/DashboardContainer'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Dashboard | ZoneWise.AI',
  description: 'AI-powered real estate intelligence across all 67 Florida counties'
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col" style={{ minHeight: '100vh', background: '#020617' }}>
      <EnterpriseLayout />
      <div className="flex-1" style={{ minHeight: '600px' }}>
        <SplitScreen
          left={<DashboardContainer />}
          right={
            <div
              className="flex items-center justify-center h-full text-sm"
              style={{ color: 'rgba(255,255,255,0.3)', background: '#020617' }}
            >
              Select a deal to preview details
            </div>
          }
        />
      </div>
    </div>
  )
}
