import Link from 'next/link'
import { Settings as SettingsIcon, User, Shield, Bell } from 'lucide-react'

export const dynamic = 'force-dynamic'

/**
 * /settings/account — previously 404 while linked from the app sidebar.
 *
 * Profile and security are delegated to Clerk's hosted user profile rather than
 * re-implemented, so this page stays correct even while Clerk configuration is
 * being repaired.
 */

const SECTIONS = [
  {
    icon: User,
    title: 'Profile',
    body: 'Name, email address and profile photo.',
    href: '/user',
    cta: 'Manage profile',
  },
  {
    icon: Shield,
    title: 'Security',
    body: 'Password, connected accounts and active sessions.',
    href: '/user',
    cta: 'Manage security',
  },
  {
    icon: Bell,
    title: 'Notifications',
    body: 'County monitoring alerts and report-ready emails.',
    href: '/settings/billing',
    cta: 'View plan',
  },
]

export default function AccountSettingsPage() {
  return (
    <div className="min-h-full bg-[rgb(var(--zw-page))] px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-[rgb(var(--zw-brand))]">
          <SettingsIcon className="h-3.5 w-3.5" /> Settings
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[rgb(var(--zw-ink))] sm:text-3xl">Account</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-[rgb(var(--zw-ink2))]">
          Manage your profile, security and notification preferences.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {SECTIONS.map((s) => (
            <div
              key={s.title}
              className="flex flex-col rounded-lg border p-5"
              style={{ background: 'rgb(var(--zw-card))', borderColor: 'rgb(var(--zw-border2) / 0.6)' }}
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[rgb(var(--zw-elev))]">
                <s.icon className="h-4 w-4 text-[rgb(var(--zw-brand))]" />
              </div>
              <h2 className="text-sm font-semibold text-[rgb(var(--zw-ink))]">{s.title}</h2>
              <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-[rgb(var(--zw-ink2))]">{s.body}</p>
              <Link
                href={s.href}
                className="mt-4 inline-flex w-fit items-center rounded-md border px-4 py-2 text-[12.5px] font-semibold text-[rgb(var(--zw-ink2))] transition-colors hover:border-[rgb(var(--zw-brand)/0.5)] hover:text-[rgb(var(--zw-ink))]"
                style={{ borderColor: 'rgb(var(--zw-border2))' }}
              >
                {s.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-lg border p-5" style={{ background: 'rgb(var(--zw-card))', borderColor: 'rgb(var(--zw-border2) / 0.6)' }}>
          <h2 className="text-sm font-semibold text-[rgb(var(--zw-ink))]">Data &amp; coverage</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-[rgb(var(--zw-ink2))]">
            ZoneWise.AI covers all 67 Florida counties across 10.5M+ parcels. Feasibility tools are
            in beta and some values are sample data while coverage expands.
          </p>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[11px] text-[rgb(var(--zw-ink2))]">
            <Link href="/terms" className="hover:text-[rgb(var(--zw-brand))]">Terms</Link>
            <Link href="/privacy" className="hover:text-[rgb(var(--zw-brand))]">Privacy</Link>
            <Link href="/disclaimer" className="hover:text-[rgb(var(--zw-brand))]">Disclaimer</Link>
            <Link href="/help" className="hover:text-[rgb(var(--zw-brand))]">Help</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
