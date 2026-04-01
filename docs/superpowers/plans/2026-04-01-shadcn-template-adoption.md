# shadcn Full Template Adoption (SUMMIT #182) Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adopt the shadcn-dashboard-landing-template into zonewise-web — rethemed to Navy/Orange brand, merged with existing Mapbox/Supabase stack, dashboard powered by ResizablePanelGroup, chat as Dify placeholder.

**Architecture:**
Template is Tailwind v4 (oklch colors, `@import "tailwindcss"`) — zonewise-web is Tailwind v3 (HSL CSS vars, `tailwind.config.ts`). Strategy: use `npx shadcn@latest add` to generate v3-compatible components, cherry-pick template layout patterns (AppSidebar, landing sections), translate brand colors to HSL. Never import template's globals.css directly.

**Tech Stack:** Next.js 16, Tailwind v3, shadcn/ui (new-york style), react-resizable-panels, Clerk auth, Stripe, Supabase, Mapbox GL

**Boundaries:**
- DO_NOT_CHANGE: `app/api/**`, `lib/explorer/**`, `lib/feasibility/**`, `lib/supabase/**`, `components/explorer/**`, `components/feasibility/**`, `components/auctions/**`, `components/conquest/**`, middleware.ts, all test files
- SCOPE_LIMITS: No Tailwind v4 migration. No theme-customizer. No dnd-kit. No cmdk (already have command). No new DB tables.

---

## Chunk 1: Environment prep + shadcn component installation

### Task 1: Install missing shadcn UI components

**Files:**
- Create: `components/ui/resizable.tsx`
- Create: `components/ui/sheet.tsx`
- Create: `components/ui/slider.tsx`
- Create: `components/ui/select.tsx`
- Create: `components/ui/command.tsx`
- Create: `components/ui/card.tsx`
- Create: `components/ui/tabs.tsx`
- Create: `components/ui/badge.tsx`
- Create: `components/ui/sonner.tsx` (toast)
- Create: `components/ui/form.tsx`
- Create: `components/ui/input.tsx`
- Create: `components/ui/scroll-area.tsx`
- Create: `components/ui/chart.tsx`
- Create: `components/ui/sidebar.tsx`
- Create: `components/ui/popover.tsx`
- Create: `components/ui/dropdown-menu.tsx`
- Create: `components/ui/separator.tsx` (dep for sidebar)
- Create: `components/ui/label.tsx` (dep for form)
- Create: `components/ui/skeleton.tsx` (dep for loading states)
- Create: `components/ui/breadcrumb.tsx` (dep for site-header)
- Modify: `package.json` (new deps: react-resizable-panels, sonner, cmdk, @radix-ui/*)

- [ ] **Step 1: Install shadcn components via CLI**

```bash
cd /home/runner/work/cli-anything-biddeed/cli-anything-biddeed/workspace

npx --yes shadcn@latest add resizable --yes --overwrite 2>&1
npx --yes shadcn@latest add sheet --yes --overwrite 2>&1
npx --yes shadcn@latest add slider --yes --overwrite 2>&1
npx --yes shadcn@latest add select --yes --overwrite 2>&1
npx --yes shadcn@latest add command --yes --overwrite 2>&1
npx --yes shadcn@latest add card --yes --overwrite 2>&1
npx --yes shadcn@latest add tabs --yes --overwrite 2>&1
npx --yes shadcn@latest add badge --yes --overwrite 2>&1
npx --yes shadcn@latest add sonner --yes --overwrite 2>&1
npx --yes shadcn@latest add form --yes --overwrite 2>&1
npx --yes shadcn@latest add input --yes --overwrite 2>&1
npx --yes shadcn@latest add scroll-area --yes --overwrite 2>&1
npx --yes shadcn@latest add chart --yes --overwrite 2>&1
npx --yes shadcn@latest add sidebar --yes --overwrite 2>&1
npx --yes shadcn@latest add popover --yes --overwrite 2>&1
npx --yes shadcn@latest add dropdown-menu --yes --overwrite 2>&1
npx --yes shadcn@latest add separator --yes --overwrite 2>&1
npx --yes shadcn@latest add label --yes --overwrite 2>&1
npx --yes shadcn@latest add skeleton --yes --overwrite 2>&1
npx --yes shadcn@latest add breadcrumb --yes --overwrite 2>&1
```

Expected: Each command creates the file in `components/ui/` and installs any missing Radix deps. If shadcn CLI is not yet installed globally, it will be fetched via npx on first run.

- [ ] **Step 2: Verify all UI component files exist**

```bash
ls /home/runner/work/cli-anything-biddeed/cli-anything-biddeed/workspace/components/ui/
```

Expected output includes: `resizable.tsx sheet.tsx slider.tsx select.tsx command.tsx card.tsx tabs.tsx badge.tsx sonner.tsx form.tsx input.tsx scroll-area.tsx chart.tsx sidebar.tsx popover.tsx dropdown-menu.tsx separator.tsx label.tsx skeleton.tsx breadcrumb.tsx`

- [ ] **Step 3: Install react-resizable-panels (required by resizable.tsx)**

```bash
cd /home/runner/work/cli-anything-biddeed/cli-anything-biddeed/workspace
npm install react-resizable-panels sonner 2>&1 | tail -5
```

Expected: `added N packages` — no errors.

- [ ] **Step 4: Verify TypeScript compiles after installs**

```bash
cd /home/runner/work/cli-anything-biddeed/cli-anything-biddeed/workspace
npx tsc --noEmit 2>&1 | head -30
```

Expected: Zero errors in `components/ui/` files. If there are errors in other pre-existing files, note them but do not fix them here (out of scope).

- [ ] **Step 5: Commit**

```bash
cd /home/runner/work/cli-anything-biddeed/cli-anything-biddeed/workspace
git add components/ui/ package.json package-lock.json
git commit -m "feat(#182): install shadcn components — resizable sheet slider select command card tabs badge sonner form input scroll-area chart sidebar popover dropdown-menu"
```

---

## Chunk 2: Brand-align CSS variables for sidebar

The existing `app/globals.css` has navy/orange HSL vars but is missing the sidebar-specific CSS variables required by `components/ui/sidebar.tsx`.

### Task 2: Add sidebar CSS variables to globals.css

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Read current globals.css to find :root block**

```bash
grep -n "sidebar\|--sidebar" /home/runner/work/cli-anything-biddeed/cli-anything-biddeed/workspace/app/globals.css | head -20
```

Expected: Either no results (vars missing) or existing sidebar vars (already done, skip this task).

- [ ] **Step 2: Add sidebar variables to :root and .dark blocks**

Open `app/globals.css`. Find the `:root {` block. After the existing `--ring` variable, add:

```css
  /* Sidebar brand vars — required by components/ui/sidebar.tsx */
  --sidebar: 222.2 47.4% 8%;
  --sidebar-foreground: 210 40% 96%;
  --sidebar-primary: 213 54% 24%;
  --sidebar-primary-foreground: 0 0% 98%;
  --sidebar-accent: 38 92% 50%;
  --sidebar-accent-foreground: 222.2 84% 4.9%;
  --sidebar-border: 217.2 32.6% 17.5%;
  --sidebar-ring: 38 92% 50%;
```

In the `.dark {` block (or create one if absent), add the same sidebar vars (dark mode mirrors the dark background we already use):

```css
  --sidebar: 222.2 47.4% 8%;
  --sidebar-foreground: 210 40% 96%;
  --sidebar-primary: 213 54% 24%;
  --sidebar-primary-foreground: 0 0% 98%;
  --sidebar-accent: 38 92% 50%;
  --sidebar-accent-foreground: 222.2 84% 4.9%;
  --sidebar-border: 217.2 32.6% 17.5%;
  --sidebar-ring: 38 92% 50%;
```

- [ ] **Step 3: Verify sidebar.tsx can resolve its CSS vars**

```bash
grep "var(--sidebar" /home/runner/work/cli-anything-biddeed/cli-anything-biddeed/workspace/components/ui/sidebar.tsx | head -10
```

Check that the var names in sidebar.tsx match what we added. If sidebar.tsx uses `hsl(var(--sidebar))` format, our HSL values (without `hsl()` wrapper) are correct per the project's existing pattern.

- [ ] **Step 4: Commit**

```bash
cd /home/runner/work/cli-anything-biddeed/cli-anything-biddeed/workspace
git add app/globals.css
git commit -m "feat(#182): add sidebar CSS vars — navy/orange brand tokens"
```

---

## Chunk 3: ZoneWise AppSidebar + dashboard layout

Replace the `TopNav`-based dashboard layout with a shadcn Sidebar layout (AppSidebar + SiteHeader). This is the template's main structural pattern.

### Task 3: Create ZoneWise AppSidebar

**Files:**
- Create: `components/navigation/AppSidebar.tsx`
- Create: `components/navigation/NavMain.tsx`
- Create: `components/navigation/NavUser.tsx`
- Create: `components/navigation/SiteHeader.tsx`

- [ ] **Step 1: Create NavMain.tsx**

```tsx
// components/navigation/NavMain.tsx
'use client'

import { ChevronRight, type LucideIcon } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'

export interface NavItem {
  title: string
  url: string
  icon?: LucideIcon
  isActive?: boolean
  items?: { title: string; url: string }[]
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export function NavMain({ groups }: { groups: NavGroup[] }) {
  return (
    <>
      {groups.map((group) => (
        <SidebarGroup key={group.label}>
          <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
          <SidebarMenu>
            {group.items.map((item) =>
              item.items?.length ? (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={item.isActive}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={item.title}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((sub) => (
                          <SidebarMenuSubItem key={sub.title}>
                            <SidebarMenuSubButton asChild>
                              <a href={sub.url}><span>{sub.title}</span></a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ) : (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <a href={item.url}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            )}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  )
}
```

- [ ] **Step 2: Create NavUser.tsx**

Uses Clerk's `useUser` hook to pull real user data.

```tsx
// components/navigation/NavUser.tsx
'use client'

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
} from 'lucide-react'
import { useUser, useClerk } from '@clerk/nextjs'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'

export function NavUser() {
  const { isMobile } = useSidebar()
  const { user } = useUser()
  const { signOut } = useClerk()

  const name = user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? 'User'
  const email = user?.primaryEmailAddress?.emailAddress ?? ''
  const avatar = user?.imageUrl ?? ''
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={avatar} alt={name} />
                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{name}</span>
                <span className="truncate text-xs">{email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={avatar} alt={name} />
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{name}</span>
                  <span className="truncate text-xs">{email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <a href="/settings/billing">
                  <Sparkles className="mr-2 h-4 w-4" />Upgrade to Pro
                </a>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <a href="/settings/account"><BadgeCheck className="mr-2 h-4 w-4" />Account</a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="/settings/billing"><CreditCard className="mr-2 h-4 w-4" />Billing</a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="/settings/notifications"><Bell className="mr-2 h-4 w-4" />Notifications</a>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" />Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
```

- [ ] **Step 3: Create SiteHeader.tsx**

```tsx
// components/navigation/SiteHeader.tsx
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'

export function SiteHeader({ title }: { title?: string }) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-slate-800 bg-[#020617] px-4">
      <SidebarTrigger className="-ml-1 text-slate-400 hover:text-orange-400" />
      <Separator orientation="vertical" className="mr-2 h-4 bg-slate-700" />
      {title && (
        <span className="text-sm font-medium text-slate-300">{title}</span>
      )}
    </header>
  )
}
```

- [ ] **Step 4: Create AppSidebar.tsx with ZoneWise navigation**

```tsx
// components/navigation/AppSidebar.tsx
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
  HelpCircle,
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
      { title: 'Help', url: '/help', icon: HelpCircle },
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
```

- [ ] **Step 5: Verify no import errors**

```bash
cd /home/runner/work/cli-anything-biddeed/cli-anything-biddeed/workspace
npx tsc --noEmit 2>&1 | grep "navigation" | head -20
```

Expected: No errors in `components/navigation/` files.

- [ ] **Step 6: Commit**

```bash
cd /home/runner/work/cli-anything-biddeed/cli-anything-biddeed/workspace
git add components/navigation/AppSidebar.tsx components/navigation/NavMain.tsx components/navigation/NavUser.tsx components/navigation/SiteHeader.tsx
git commit -m "feat(#182): ZoneWise AppSidebar, NavMain, NavUser, SiteHeader — shadcn sidebar pattern"
```

---

### Task 4: Update dashboard layout to use AppSidebar

**Files:**
- Modify: `app/(dashboard)/layout.tsx`

The current layout wraps children in a TopNav+flex column. We replace this with SidebarProvider + AppSidebar + SidebarInset pattern.

- [ ] **Step 1: Replace app/(dashboard)/layout.tsx**

```tsx
// app/(dashboard)/layout.tsx
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/navigation/AppSidebar'
import { SiteHeader } from '@/components/navigation/SiteHeader'

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
      <SidebarInset className="bg-[#020617] min-h-screen">
        <SiteHeader />
        <div className="flex-1 min-h-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
```

- [ ] **Step 2: Verify TypeScript on the layout file**

```bash
cd /home/runner/work/cli-anything-biddeed/cli-anything-biddeed/workspace
npx tsc --noEmit 2>&1 | grep "dashboard.*layout\|layout.*dashboard" | head -10
```

Expected: No errors for the layout file.

- [ ] **Step 3: Commit**

```bash
cd /home/runner/work/cli-anything-biddeed/cli-anything-biddeed/workspace
git add "app/(dashboard)/layout.tsx"
git commit -m "feat(#182): replace TopNav dashboard layout with shadcn SidebarProvider + AppSidebar"
```

---

## Chunk 4: Replace SplitScreen with ResizablePanelGroup

### Task 5: Rewrite SplitScreen using shadcn resizable

The existing `SplitScreen.tsx` hand-rolls drag logic with `mousedown/mousemove`. Replace it with `ResizablePanelGroup` + `ResizablePanel` + `ResizableHandle` from shadcn. The `ClickTracker` context, `DashboardTeaser`, and `ConversionModal` are preserved — they attach to `onClick` on the wrapper div.

**Files:**
- Modify: `components/conversion/SplitScreen.tsx`

- [ ] **Step 1: Rewrite SplitScreen.tsx**

```tsx
// components/conversion/SplitScreen.tsx
'use client'

import React from 'react'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable'
import { ClickTrackerProvider, useClickTracker } from './ClickTracker'
import DashboardTeaser from './DashboardTeaser'
import ConversionModal from './ConversionModal'

interface SplitScreenInnerProps {
  left: React.ReactNode
  right: React.ReactNode
}

function SplitScreenInner({ left, right }: SplitScreenInnerProps) {
  const { isTeaser, trackClick } = useClickTracker()

  return (
    <div className="relative w-full h-full" onClick={trackClick}>
      <ResizablePanelGroup
        direction="horizontal"
        className="w-full h-full"
      >
        <ResizablePanel defaultSize={60} minSize={30} maxSize={70}>
          <div className="h-full overflow-auto">{left}</div>
        </ResizablePanel>
        <ResizableHandle
          withHandle
          className="bg-[rgba(245,158,11,0.15)] hover:bg-[#F59E0B] data-[resize-handle-active]:bg-[#F59E0B] transition-colors w-[4px]"
        />
        <ResizablePanel defaultSize={40} minSize={30} maxSize={70}>
          <div className="h-full overflow-auto">{right}</div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {isTeaser && <DashboardTeaser />}
      <ConversionModal />
    </div>
  )
}

interface SplitScreenProps {
  left: React.ReactNode
  right: React.ReactNode
}

export default function SplitScreen({ left, right }: SplitScreenProps) {
  return (
    <ClickTrackerProvider>
      <SplitScreenInner left={left} right={right} />
    </ClickTrackerProvider>
  )
}
```

- [ ] **Step 2: Verify SplitScreen TypeScript**

```bash
cd /home/runner/work/cli-anything-biddeed/cli-anything-biddeed/workspace
npx tsc --noEmit 2>&1 | grep -i "splitscreen\|SplitScreen" | head -10
```

Expected: No errors.

- [ ] **Step 3: Verify dashboard/page.tsx still imports correctly**

```bash
grep "SplitScreen" /home/runner/work/cli-anything-biddeed/cli-anything-biddeed/workspace/app/\(dashboard\)/dashboard/page.tsx
```

Expected: Still `import SplitScreen from '@/components/conversion/SplitScreen'` — no changes needed in the page file itself.

- [ ] **Step 4: Commit**

```bash
cd /home/runner/work/cli-anything-biddeed/cli-anything-biddeed/workspace
git add components/conversion/SplitScreen.tsx
git commit -m "feat(#182): replace custom SplitScreen drag logic with ResizablePanelGroup"
```

---

## Chunk 5: Landing page template adoption

### Task 6: Restructure marketing landing page with template sections

The current `app/(marketing)/page.tsx` is a single large file. We break it into template-style section components, adapt to ZoneWise brand/content, and keep the existing ZoneWise copy (just restyle the structure).

**Files:**
- Create: `components/landing/HeroSection.tsx`
- Create: `components/landing/FeaturesSection.tsx`
- Create: `components/landing/StatsSection.tsx`
- Create: `components/landing/PricingSection.tsx`
- Create: `components/landing/CTASection.tsx`
- Create: `components/landing/LandingNavbar.tsx`
- Create: `components/landing/LandingFooter.tsx`
- Modify: `app/(marketing)/page.tsx`

- [ ] **Step 1: Create LandingNavbar.tsx**

```tsx
// components/landing/LandingNavbar.tsx
'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function LandingNavbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800 bg-[#020617]/95 backdrop-blur supports-[backdrop-filter]:bg-[#020617]/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1E3A5F] text-[#F59E0B] font-bold text-sm">
              ZW
            </div>
            <span className="font-semibold text-white">ZoneWise.AI</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-400">
            <Link href="/explorer" className="hover:text-white transition-colors">Explorer</Link>
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white" asChild>
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button
              size="sm"
              className="bg-[#F59E0B] text-slate-900 hover:bg-[#D97706] font-semibold"
              asChild
            >
              <Link href="/sign-up">Start free</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Create HeroSection.tsx**

```tsx
// components/landing/HeroSection.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Sparkles } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#020617] py-24 sm:py-32">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(#1E3A5F 1px, transparent 1px), linear-gradient(to right, #1E3A5F 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />
      <div className="relative mx-auto max-w-5xl px-4 text-center">
        <Badge
          variant="outline"
          className="mb-6 border-[#F59E0B]/30 bg-[#F59E0B]/10 text-[#F59E0B]"
        >
          <Sparkles className="mr-1.5 h-3 w-3" />
          Powering Everest Capital USA — 10 years Brevard foreclosure investing
        </Badge>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-[1.05] tracking-tight">
          AI Zoning &amp; Foreclosure<br />
          <span className="text-[#F59E0B]">Intelligence</span> for Florida
        </h1>

        <p className="mx-auto max-w-2xl text-lg sm:text-xl text-slate-400 mb-10">
          245K+ auction records. 10.8M FL parcels. Zoning analysis, development
          envelopes, and deal scoring — all in one platform built by a Brevard
          County investor.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            className="bg-[#F59E0B] text-slate-900 hover:bg-[#D97706] font-semibold px-8"
            asChild
          >
            <Link href="/sign-up">
              Start for free <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
            asChild
          >
            <Link href="/explorer">Explore live map</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Create FeaturesSection.tsx**

```tsx
// components/landing/FeaturesSection.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Map, Gavel, Building2, MessageSquare, FileText, Activity } from 'lucide-react'

const features = [
  {
    icon: Gavel,
    title: 'Auction Intelligence',
    description: '245K+ Florida foreclosure records. County-by-county auction calendars, bid history, and max-bid formula built in.',
  },
  {
    icon: Map,
    title: 'Zoning Explorer',
    description: 'Interactive choropleth map of 10.8M FL parcels. Zoning overlays, ZHVI heatmaps, and neighborhood comps.',
  },
  {
    icon: Building2,
    title: 'Development Feasibility',
    description: 'Buildable envelope math, 3D massing engine, and pro forma scenarios for any Florida parcel.',
  },
  {
    icon: MessageSquare,
    title: 'AI Zoning Chat',
    description: 'Cited answers on permitted uses, setbacks, and height limits from our own Supabase-backed RAG pipeline.',
  },
  {
    icon: FileText,
    title: 'Zoning Reports',
    description: 'One-click PDF zoning reports with HBU analysis, comp sales, and legal lot coverage.',
  },
  {
    icon: Activity,
    title: 'Deal Scoring',
    description: 'Max-bid formula: (ARV×70%)−Repairs−$10K−MIN($25K,15%×ARV). Scored against live auction data.',
  },
]

export function FeaturesSection() {
  return (
    <section className="bg-[#020617] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-14 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Everything a Florida investor needs
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Built by a licensed FL broker and GC with 10+ years in Brevard County foreclosures.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <Card
              key={f.title}
              className="border-slate-800 bg-slate-900/50 hover:border-[#F59E0B]/30 transition-colors"
            >
              <CardHeader className="pb-3">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#1E3A5F]">
                  <f.icon className="h-5 w-5 text-[#F59E0B]" />
                </div>
                <CardTitle className="text-white text-base">{f.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-400">{f.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Create StatsSection.tsx**

```tsx
// components/landing/StatsSection.tsx
const stats = [
  { value: '245K+', label: 'Auction records' },
  { value: '10.8M', label: 'FL parcels' },
  { value: '67', label: 'Florida counties' },
  { value: '93.3%', label: 'Brevard zoning coverage' },
]

export function StatsSection() {
  return (
    <section className="border-y border-slate-800 bg-slate-900/30 py-16">
      <div className="mx-auto max-w-5xl px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-3xl sm:text-4xl font-bold text-[#F59E0B] mb-1">{s.value}</div>
              <div className="text-sm text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Create PricingSection.tsx**

```tsx
// components/landing/PricingSection.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'

const plans = [
  {
    name: 'Free',
    price: '$0',
    description: 'Explore the map. No credit card.',
    cta: 'Start exploring',
    href: '/sign-up',
    highlighted: false,
    features: [
      'Brevard County choropleth map',
      'Public zoning lookup',
      'AI zoning chatbot (limited)',
      '5 auction records/month',
    ],
  },
  {
    name: 'Pro',
    price: '$99',
    description: 'Full intelligence for active investors.',
    cta: 'Start Pro',
    href: '/sign-up?plan=pro',
    highlighted: true,
    badge: 'Most popular',
    features: [
      'All 67 FL counties',
      'Unlimited auction records',
      'Development feasibility studio',
      'Zoning reports (PDF export)',
      'Deal scoring + max-bid formula',
      'Telegram deal alerts',
      'Priority support',
    ],
  },
]

export function PricingSection() {
  return (
    <section className="bg-[#020617] py-20 sm:py-28" id="pricing">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-12 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Simple pricing</h2>
          <p className="text-slate-400">Start free. Upgrade when you find a deal worth closing.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative border ${
                plan.highlighted
                  ? 'border-[#F59E0B]/50 bg-slate-900'
                  : 'border-slate-800 bg-slate-900/50'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-[#F59E0B] text-slate-900 font-semibold">{plan.badge}</Badge>
                </div>
              )}
              <CardHeader className="pb-4">
                <CardTitle className="text-white">{plan.name}</CardTitle>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  {plan.name !== 'Free' && <span className="text-slate-400 text-sm">/month</span>}
                </div>
                <p className="text-sm text-slate-400">{plan.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  className={`w-full font-semibold ${
                    plan.highlighted
                      ? 'bg-[#F59E0B] text-slate-900 hover:bg-[#D97706]'
                      : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                  variant={plan.highlighted ? 'default' : 'outline'}
                  asChild
                >
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                      <Check className="h-4 w-4 text-[#F59E0B] shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 6: Create CTASection.tsx**

```tsx
// components/landing/CTASection.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function CTASection() {
  return (
    <section className="bg-[#1E3A5F]/20 border-t border-[#1E3A5F]/40 py-20">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Ready to find your next deal?
        </h2>
        <p className="text-slate-400 mb-8 text-lg">
          Join Brevard County investors using ZoneWise to underwrite faster and win at auction.
        </p>
        <Button
          size="lg"
          className="bg-[#F59E0B] text-slate-900 hover:bg-[#D97706] font-semibold px-10"
          asChild
        >
          <Link href="/sign-up">Get started free</Link>
        </Button>
      </div>
    </section>
  )
}
```

- [ ] **Step 7: Create LandingFooter.tsx**

```tsx
// components/landing/LandingFooter.tsx
import Link from 'next/link'

export function LandingFooter() {
  return (
    <footer className="border-t border-slate-800 bg-[#020617] py-10">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-[#1E3A5F] text-[#F59E0B] font-bold text-xs">ZW</div>
            <span className="text-sm text-slate-400">ZoneWise.AI — by Everest Capital USA</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-slate-500">
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-slate-300 transition-colors">Terms</Link>
            <Link href="/disclaimer" className="hover:text-slate-300 transition-colors">Disclaimer</Link>
            <Link href="/docs" className="hover:text-slate-300 transition-colors">Docs</Link>
          </div>
          <p className="text-xs text-slate-600">© 2026 Everest Capital USA LLC. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
```

- [ ] **Step 8: Replace app/(marketing)/page.tsx with section-based layout**

```tsx
// app/(marketing)/page.tsx
import { LandingNavbar } from '@/components/landing/LandingNavbar'
import { HeroSection } from '@/components/landing/HeroSection'
import { StatsSection } from '@/components/landing/StatsSection'
import { FeaturesSection } from '@/components/landing/FeaturesSection'
import { PricingSection } from '@/components/landing/PricingSection'
import { CTASection } from '@/components/landing/CTASection'
import { LandingFooter } from '@/components/landing/LandingFooter'

export const dynamic = 'force-dynamic'

export default function Home() {
  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <LandingNavbar />
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <PricingSection />
      <CTASection />
      <LandingFooter />
    </div>
  )
}
```

- [ ] **Step 9: Verify TypeScript on landing components**

```bash
cd /home/runner/work/cli-anything-biddeed/cli-anything-biddeed/workspace
npx tsc --noEmit 2>&1 | grep "landing" | head -20
```

Expected: No errors.

- [ ] **Step 10: Commit**

```bash
cd /home/runner/work/cli-anything-biddeed/cli-anything-biddeed/workspace
git add components/landing/ "app/(marketing)/page.tsx"
git commit -m "feat(#182): template-pattern landing page — HeroSection, FeaturesSection, StatsSection, PricingSection, CTASection, LandingNavbar, LandingFooter"
```

---

## Chunk 6: Chat page Dify placeholder + Toaster provider

### Task 7: Replace chat page with Dify placeholder

The spec says `chat=Dify placeholder`. The existing `app/(dashboard)/chat/page.tsx` uses `ZoningChatbot` (which connects to our own `/api/zoning-chat` endpoint). We keep the existing chatbot but add a Dify migration notice as a banner.

**Files:**
- Modify: `app/(dashboard)/chat/page.tsx`

- [ ] **Step 1: Update chat/page.tsx with Dify placeholder banner**

```tsx
// app/(dashboard)/chat/page.tsx
import type { Metadata } from 'next'
import ZoningChatbot from '@/components/chat/ZoningChatbot'
import ErrorBoundary from '@/components/ErrorBoundary'
import ZoningDisclaimer from '@/components/ZoningDisclaimer'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Sparkles } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'AI Zoning Assistant | ZoneWise.AI',
  description: 'Ask ZoneWise AI about Brevard County zoning codes, permitted uses, setbacks, height limits, and more.',
}

export default function ZoningChatPage() {
  return (
    <div className="flex h-full flex-col bg-[#020617]">
      {/* Dify migration notice */}
      <Card className="mx-4 mt-3 border-[#F59E0B]/20 bg-[#F59E0B]/5 p-3">
        <div className="flex items-center gap-2 text-xs text-[#F59E0B]">
          <Sparkles className="h-3.5 w-3.5 shrink-0" />
          <span>
            <strong>Coming soon:</strong> Advanced multi-agent chat powered by Dify.AI — with memory, tool use, and multi-county context.
          </span>
          <Badge variant="outline" className="ml-auto border-[#F59E0B]/30 text-[#F59E0B] text-[10px]">
            Dify
          </Badge>
        </div>
      </Card>

      {/* Existing zoning chatbot */}
      <div className="shrink-0 border-b border-slate-800 bg-slate-900/80 px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold text-slate-200">AI Zoning Assistant</h1>
          <p className="text-xs text-slate-500">Brevard County · Structured RAG · Cited answers · Gemini Flash</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded border border-slate-700 bg-slate-800/60 px-2 py-1 font-mono text-xs text-slate-400">
            🏛 Zoning
          </span>
          <span className="rounded border border-emerald-800 bg-emerald-900/30 px-2 py-1 font-mono text-xs text-emerald-400">
            ✓ Own Data
          </span>
        </div>
      </div>

      <ErrorBoundary>
        <ZoningChatbot />
      </ErrorBoundary>
      <ZoningDisclaimer />
    </div>
  )
}
```

- [ ] **Step 2: Add Toaster to root layout (required for sonner)**

Read `app/layout.tsx` and add the `<Toaster />` from sonner after the existing providers. If a toast provider already exists, skip this step.

```bash
grep -n "Toaster\|sonner\|toast" /home/runner/work/cli-anything-biddeed/cli-anything-biddeed/workspace/app/layout.tsx
```

If no Toaster found, add to app/layout.tsx — inside the `<ThemeProvider>` block, add `<Toaster />` as a sibling to `{children}`:

```tsx
import { Toaster } from '@/components/ui/sonner'
// ...
<ThemeProvider>
  <OnboardingProvider>
    <OnboardingTour />
    <main id="main-content">{children}</main>
    <Toaster position="bottom-right" theme="dark" />
  </OnboardingProvider>
</ThemeProvider>
```

- [ ] **Step 3: Commit**

```bash
cd /home/runner/work/cli-anything-biddeed/cli-anything-biddeed/workspace
git add "app/(dashboard)/chat/page.tsx" app/layout.tsx
git commit -m "feat(#182): chat page Dify placeholder banner + Toaster provider"
```

---

## Chunk 7: TypeScript validation + build check + push

### Task 8: Full TypeScript + build validation

- [ ] **Step 1: Full TypeScript check**

```bash
cd /home/runner/work/cli-anything-biddeed/cli-anything-biddeed/workspace
npx tsc --noEmit 2>&1 | head -60
```

Expected: Any errors should be in pre-existing files (not files we touched). Files we touched: `components/ui/*`, `components/navigation/*`, `components/landing/*`, `components/conversion/SplitScreen.tsx`, `app/(dashboard)/layout.tsx`, `app/(dashboard)/chat/page.tsx`, `app/(marketing)/page.tsx`, `app/globals.css`, `app/layout.tsx`.

If any of OUR files have errors, fix them before proceeding.

- [ ] **Step 2: Next.js build check**

```bash
cd /home/runner/work/cli-anything-biddeed/cli-anything-biddeed/workspace
npm run build 2>&1 | tail -30
```

Expected: Build completes. Note any new errors vs pre-existing. Only fix errors in files we touched.

- [ ] **Step 3: Fix any build errors in touched files**

For each error, identify which file and fix only that file. Common issues to expect:
- Missing `'use client'` directive on components that use hooks
- Missing imports
- Type mismatches in ResizablePanelGroup (check `react-resizable-panels` API)

- [ ] **Step 4: Commit fixes**

```bash
cd /home/runner/work/cli-anything-biddeed/cli-anything-biddeed/workspace
git add -A
git commit -m "fix(#182): TypeScript/build fixes post-template adoption"
```

---

### Task 9: Push to main + comment on #182

- [ ] **Step 1: Push to main**

```bash
cd /home/runner/work/cli-anything-biddeed/cli-anything-biddeed/workspace
git push origin main 2>&1
```

Expected: Push succeeds. GitHub Actions will trigger `deploy-prod` workflow.

- [ ] **Step 2: Verify GitHub Actions CI is green**

```bash
GH_TOKEN="${GITHUB_TOKEN}" gh run list --repo breverdbidder/cli-anything-biddeed --limit 3 2>&1
```

Wait for the most recent run to complete.

- [ ] **Step 3: Comment results on issue #182**

```bash
GH_TOKEN="${GITHUB_TOKEN}" gh issue comment 182 --repo breverdbidder/cli-anything-biddeed --body "$(cat <<'EOF'
## SUMMIT #182 — shadcn Full Template Adoption ✅

**Completed:** 2026-04-01

### What shipped

| Area | Change |
|------|--------|
| **shadcn components** | Installed: resizable, sheet, slider, select, command, card, tabs, badge, sonner, form, input, scroll-area, chart, sidebar, popover, dropdown-menu, separator, label, skeleton, breadcrumb |
| **ResizablePanelGroup** | Replaced custom SplitScreen drag logic — `components/conversion/SplitScreen.tsx` now wraps `ResizablePanelGroup` + `ResizablePanel` + `ResizableHandle` |
| **AppSidebar** | New shadcn sidebar layout for all dashboard routes — `components/navigation/AppSidebar.tsx`, `NavMain`, `NavUser`, `SiteHeader` |
| **Dashboard layout** | `app/(dashboard)/layout.tsx` → SidebarProvider + AppSidebar + SidebarInset (replaces TopNav) |
| **Landing page** | Rebuilt with template-pattern sections — `HeroSection`, `FeaturesSection`, `StatsSection`, `PricingSection`, `CTASection`, `LandingNavbar`, `LandingFooter` |
| **Chat page** | Dify placeholder banner added; existing ZoningChatbot preserved |
| **Brand** | Navy #1E3A5F · Orange #F59E0B · Inter · bg #020617 applied throughout |
| **Preserved** | Mapbox/choropleth, all API routes, Supabase queries, Clerk auth, Stripe checkout, conversion components (ClickTracker, DashboardTeaser, ConversionModal, BuyBoxForm, HybridPreview) |

### Commits
See main branch — commits prefixed `feat(#182):` and `fix(#182):`

### Deployment
Auto-deployed via `deploy-prod` GitHub Actions → Cloudflare Pages / Vercel
EOF
)" 2>&1
```

Expected: `Created comment` response.

- [ ] **Step 4: Close SUMMIT — mark complete**

All tasks done. Session summary via `/tldr`.

---

## Plan/Actual Deviation Log

*Fill in during/after execution:*

| Task | Planned | Actual | Deviation |
|------|---------|--------|-----------|
| shadcn add | npx shadcn@latest add | TBD | — |
| SplitScreen | ResizablePanelGroup wrapper | TBD | — |
| AppSidebar | New component | TBD | — |
| Dashboard layout | SidebarProvider swap | TBD | — |
| Landing page | 7 section components | TBD | — |
| Chat page | Dify banner | TBD | — |

## Verification Evidence

*Required before marking DONE (Evidence-Before-Claims protocol):*

- [ ] `npx tsc --noEmit` → zero errors in touched files
- [ ] `npm run build` → succeeds
- [ ] `git push origin main` → succeeds
- [ ] GitHub Actions CI → green
- [ ] Issue #182 comment → posted
