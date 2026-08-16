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
  Boxes,
  PencilRuler,
  Calculator,
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
      // Auctions hidden from ZoneWise nav (Ariel, Aug 15 2026, Option B).
      // The /auctions route and components/auctions/ REMAIN INTACT and reachable
      // by direct URL — this only removes it from the demo/nav path, because
      // auction content belongs to BidDeed.AI's surface, not ZoneWise's.
      // Restore this line to re-expose it.
      // { title: 'Auctions', url: '/auctions', icon: Gavel },
      { title: 'Explorer', url: '/explorer', icon: Map },
    ],
  },
  {
    label: 'Analysis',
    items: [
      { title: 'Feasibility', url: '/feasibility', icon: Building2 },
      // Building footprints + height estimates (Microsoft GlobalML, CDLA Permissive 2.0)
      { title: 'Footprints', url: '/footprints', icon: Boxes },
      { title: 'Reports', url: '/report', icon: FileText },
      { title: 'KPIs', url: '/kpis', icon: Activity },
    ],
  },
  {
    label: 'Design Tools',
    items: [
      { title: '3D Massing', url: '/massing', icon: Boxes },
      { title: 'Floor Plans', url: '/floorplan', icon: PencilRuler },
      { title: 'Pro Forma', url: '/proforma', icon: Calculator },
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
                  <span className="truncate text-xs text-slate-400">Zoning & Feasibility</span>
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
