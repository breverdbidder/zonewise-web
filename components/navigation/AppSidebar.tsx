'use client'

import {
  Map,
  Gavel,
  LayoutDashboard,
  MessageSquare,
  Building2,
  FileText,
  Activity,
  Settings,
  CreditCard,
  CircleHelp,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { NavMain, type NavGroup } from './NavMain'
import { NavUser } from './NavUser'

const navGroups: NavGroup[] = [
  {
    label: 'Intelligence',
    items: [
      { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
      { title: 'Auctions', url: '/auctions', icon: Gavel },
      { title: 'Explorer', url: '/explorer', icon: Map },
    ],
  },
  {
    label: 'Analysis',
    items: [
      { title: 'Feasibility', url: '/feasibility', icon: Building2 },
      { title: 'Reports', url: '/report', icon: FileText },
      { title: 'KPIs', url: '/kpis', icon: Activity },
    ],
  },
  {
    label: 'AI',
    items: [
      { title: 'Zoning Chat', url: '/chat', icon: MessageSquare },
    ],
  },
  {
    label: 'Account',
    items: [
      { title: 'Billing', url: '/settings/billing', icon: CreditCard },
      { title: 'Settings', url: '/settings/account', icon: Settings },
      { title: 'Help', url: '/help', icon: CircleHelp },
    ],
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      variant="inset"
      className="border-r border-slate-800 bg-[#020617]"
      {...props}
    >
      <SidebarHeader className="border-b border-slate-800">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[#1E3A5F] text-[#F59E0B] font-bold text-sm">
                  ZW
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-slate-100">ZoneWise.AI</span>
                  <span className="truncate text-xs text-slate-400">Foreclosure Intelligence</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={navGroups} />
      </SidebarContent>
      <SidebarFooter className="border-t border-slate-800">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
