import TopNav from '@/components/navigation/TopNav'

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen flex flex-col">
      <TopNav />
      <div className="flex-1 min-h-0">
        {children}
      </div>
    </div>
  )
}
