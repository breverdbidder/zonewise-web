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
  Scan,
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
  // Discovery leads the nav on purpose. It is stage 1 of The Everest Ascent, and
  // it is the one thing competitors like Algoma cannot match: parcel-level
  // distressed sourcing wired directly into zoning and feasibility analysis.
  //
  // History: hidden from the nav on Aug 15 2026 (Ariel, "Option B") because
  // auction CONTENT belongs to BidDeed.AI's surface. Restored Aug 17 2026 under
  // a Discovery group rather than back under Intelligence — the distinction that
  // resolves both positions is sourcing vs trading. ZoneWise surfaces distressed
  // inventory as a way to FIND parcels to analyse; the bidding/execution workflow
  // stays on BidDeed.AI.
  {
    label: 'Discovery',
    items: [
      // AuctionRadar is the trademarked Everest Ascent stage-1 brand (Ariel,
      // Aug 17 2026). The ROUTE stays /auctions on purpose — renaming the URL
      // would break existing links and SEO for zero gain; only the label carries
      // the brand.
      { title: 'AuctionRadar', url: '/auctions', icon: Gavel },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
      { title: 'Explorer', url: '/explorer', icon: Map },
    ],
  },
  {
    label: 'Analysis',
    items: [
      { title: 'Feasibility', url: '/feasibility', icon: Building2 },
      // Building footprints + height estimates (Microsoft GlobalML, CDLA Permissive 2.0)
      { title: 'Footprints', url: '/footprints', icon: Scan },
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
      className="border-r border-sidebar-border bg-sidebar-background text-sidebar-foreground"
      {...props}
    >
      <SidebarHeader className="border-b border-[rgb(var(--zw-border2))]">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold text-sm">
                  ZW
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-[rgb(var(--zw-ink))]">ZoneWise.AI</span>
                  <span className="truncate text-xs text-[rgb(var(--zw-ink2))]">Zoning & Feasibility</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={navGroups} />
      </SidebarContent>
      <SidebarFooter className="border-t border-[rgb(var(--zw-border2))]">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
