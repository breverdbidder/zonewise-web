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
    <div className="min-h-full bg-[#020617] px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-[#F59E0B]">
          <SettingsIcon className="h-3.5 w-3.5" /> Settings
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Account</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-400">
          Manage your profile, security and notification preferences.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {SECTIONS.map((s) => (
            <div
              key={s.title}
              className="flex flex-col rounded-lg border p-5"
              style={{ background: '#0d1829', borderColor: 'rgba(30,58,95,0.6)' }}
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[#1E3A5F]">
                <s.icon className="h-4 w-4 text-[#F59E0B]" />
              </div>
              <h2 className="text-sm font-semibold text-white">{s.title}</h2>
              <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-slate-400">{s.body}</p>
              <Link
                href={s.href}
                className="mt-4 inline-flex w-fit items-center rounded-md border px-4 py-2 text-[12.5px] font-semibold text-slate-200 transition-colors hover:border-[#F59E0B]/50 hover:text-white"
                style={{ borderColor: '#1E293B' }}
              >
                {s.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-lg border p-5" style={{ background: '#0d1829', borderColor: 'rgba(30,58,95,0.6)' }}>
          <h2 className="text-sm font-semibold text-white">Data &amp; coverage</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-slate-400">
            ZoneWise.AI covers all 67 Florida counties across 10.8M+ parcels. Feasibility tools are
            in beta and some values are sample data while coverage expands.
          </p>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[11px] text-slate-500">
            <Link href="/terms" className="hover:text-[#F59E0B]">Terms</Link>
            <Link href="/privacy" className="hover:text-[#F59E0B]">Privacy</Link>
            <Link href="/disclaimer" className="hover:text-[#F59E0B]">Disclaimer</Link>
            <Link href="/help" className="hover:text-[#F59E0B]">Help</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
