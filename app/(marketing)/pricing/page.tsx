import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Pricing — ZoneWise.AI',
  description: 'Early access pricing for Florida\'s AI-powered real estate intelligence platform.',
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-800">
      {/* Nav */}
      <nav className="h-14 flex items-center px-6 border-b border-gray-200 bg-white">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-[#1E3A5F] to-[#2d5a8f] flex items-center justify-center">
            <span className="text-white text-xs font-bold">Z</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">
            ZoneWise<span className="text-[#F59E0B]">.AI</span>
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-4">
          <Link href="/explore" className="text-sm text-gray-600 hover:text-gray-900">Explore</Link>
          <Link href="/#beta-signup" className="text-sm bg-[#1E3A5F] text-white px-4 py-2 rounded-lg hover:bg-[#2d5a8f]">Join Beta</Link>
        </div>
      </nav>

      {/* Pricing */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl sm:text-5xl font-bold text-center mb-4 text-slate-900">
            Simple, transparent pricing
          </h1>
          <p className="text-center text-gray-500 mb-16 max-w-xl mx-auto text-lg">
            Start free. Upgrade when you need more.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Free */}
            <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 relative">
              <h3 className="font-bold text-lg text-slate-800">Free</h3>
              <p className="text-4xl font-bold my-4 text-slate-900">$0</p>
              <p className="text-sm text-gray-400 mb-6">No credit card needed</p>
              <ul className="space-y-3 text-sm text-gray-600 mb-8">
                {['Choropleth heatmap (all ZIPs)', '5 parcel clicks/day', '3 AI chat messages/day', 'Basic zoning overlay'].map(f => (
                  <li key={f} className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/explore" className="block text-center py-3 bg-[#1E3A5F] text-white rounded-xl font-bold text-sm hover:bg-[#2d5a8f] transition-colors">
                Explore Now
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-white rounded-2xl p-8 border-2 border-[#1E3A5F] relative shadow-lg">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#F59E0B] text-white text-xs px-4 py-1 rounded-full font-medium">Most Popular</span>
              <h3 className="font-bold text-lg text-slate-800">Pro</h3>
              <p className="text-4xl font-bold my-4 text-slate-900">$29<span className="text-lg font-normal text-gray-400">/mo</span></p>
              <p className="text-sm text-gray-400 mb-6">For active investors & developers</p>
              <ul className="space-y-3 text-sm text-gray-600 mb-8">
                {['Everything in Free', 'Unlimited parcel clicks', 'Unlimited AI chat', 'Zoning filters & overlays', 'Export CSV/PDF reports', 'Auction calendar integration'].map(f => (
                  <li key={f} className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/#beta-signup" className="block text-center py-3 bg-[#F59E0B] text-slate-900 rounded-xl font-bold text-sm hover:brightness-110 transition-all">
                Start Free Trial
              </Link>
            </div>

            {/* Enterprise */}
            <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 relative">
              <h3 className="font-bold text-lg text-slate-800">Enterprise</h3>
              <p className="text-4xl font-bold my-4 text-slate-900">Custom</p>
              <p className="text-sm text-gray-400 mb-6">For municipalities & teams</p>
              <ul className="space-y-3 text-sm text-gray-600 mb-8">
                {['Everything in Pro', 'API & MCP access', 'Citizen-facing zoning chatbot', 'Bulk parcel analysis', 'Custom integrations', 'Dedicated support'].map(f => (
                  <li key={f} className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    {f}
                  </li>
                ))}
              </ul>
              <a href="mailto:ariel@everestcapitalusa.com" className="block text-center py-3 border border-gray-300 rounded-xl text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors">
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
