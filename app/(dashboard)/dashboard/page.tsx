import DashboardClient from './client'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Dashboard | ZoneWise.AI',
  description: 'AI-powered real estate intelligence across all 67 Florida counties'
}

export default function DashboardPage() {
  return <DashboardClient />
}
