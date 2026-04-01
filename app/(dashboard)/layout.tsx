import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/navigation/AppSidebar'
import { SiteHeader } from '@/components/navigation/SiteHeader'

export const dynamic = 'force-dynamic'

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider
      style={{
        '--sidebar-width': '15rem',
        '--sidebar-width-icon': '3rem',
      } as React.CSSProperties}
    >
      <AppSidebar />
      <SidebarInset className="bg-[#020617] h-screen overflow-hidden flex flex-col">
        <SiteHeader />
        <div className="flex-1 min-h-0 overflow-hidden">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
