import Link from 'next/link'
import SplitScreenPreview from '@/components/SplitScreenPreview'

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-800">
      {/* Header */}
      <header className="border-b sticky top-0 bg-white/95 backdrop-blur z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-zw-navy rounded-lg flex items-center justify-center relative">
              <span className="text-white font-bold">Z</span>
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-zw-orange rounded-full" />
            </div>
            <span className="text-xl font-bold text-slate-800">ZoneWise.AI</span>
          </div>
          <nav className="flex items-center gap-6">
            <a href="#how" className="text-gray-600 hover:text-slate-800 hidden sm:block text-sm">How It Works</a>
            <a href="#pricing" className="text-gray-600 hover:text-slate-800 hidden sm:block text-sm">Pricing</a>
            <Link href="/login" className="text-gray-600 hover:text-slate-800 text-sm">Login</Link>
            <Link href="/signup" className="bg-zw-navy text-white px-4 py-2 rounded-lg hover:bg-zw-navy-700 text-sm font-medium transition-colors">
              Try ZoneWise Free
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero — Claude-style: bold claim + trust statement */}
      <section className="py-24 sm:py-32 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
        {/* Subtle grid background */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(to right, #1E3A5F 1px, transparent 1px), linear-gradient(to bottom, #1E3A5F 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
        <div className="max-w-4xl mx-auto px-4 text-center relative">
          <p className="text-zw-navy font-medium tracking-wide text-sm mb-6 uppercase">
            Powering{' '}
            <a href="https://everestcapitalusa.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-zw-navy-400 transition-colors">
              Everest Capital USA
            </a>
          </p>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 mb-8 leading-[1.1] tracking-tight">
            The AI for<br />
            <span className="text-zw-navy">Real Estate Intelligence</span>
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 mb-4 max-w-2xl mx-auto leading-relaxed">
            Distressed assets decoded. For everyone. Everywhere.
          </p>
          <p className="text-sm text-gray-400 mb-10">
            Founded by Ariel Shapira, Inventor &amp; Founder
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/signup" className="bg-zw-navy text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-zw-navy-700 transition-all hover:shadow-lg hover:shadow-zw-navy/20">
              Start Free
            </Link>
            <a href="#how" className="text-zw-navy font-medium flex items-center gap-2 px-8 py-4 rounded-xl hover:bg-slate-50 transition-colors">
              See how it works
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </a>
          </div>

          {/* Trust Statement — Claude's "No ads" equivalent */}
          <div className="inline-flex items-center gap-3 bg-white border border-gray-200 rounded-full px-6 py-3 shadow-sm">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-sm text-gray-600">
              No guesswork. No outdated data. Just real intelligence across all 67 Florida counties.
            </span>
          </div>
        </div>
      </section>

      {/* Stats — hard numbers, not features */}
      <section className="py-10 bg-zw-navy">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
          <div>
            <p className="text-3xl sm:text-4xl font-bold text-zw-orange">67</p>
            <p className="text-slate-300 text-sm mt-1">Counties</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-bold text-zw-orange">808+</p>
            <p className="text-slate-300 text-sm mt-1">Jurisdictions</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-bold text-zw-orange">1,542</p>
            <p className="text-slate-300 text-sm mt-1">Zoning Districts</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-bold text-zw-orange">10.8M</p>
            <p className="text-slate-300 text-sm mt-1">Parcels</p>
          </div>
          <div className="col-span-2 md:col-span-1">
            <p className="text-3xl sm:text-4xl font-bold text-zw-orange">AI+ML</p>
            <p className="text-slate-300 text-sm mt-1">Powered</p>
          </div>
        </div>
      </section>

      {/* Use Cases — Claude-style: Analyze / Research / Build */}
      <section id="how" className="py-24">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-slate-900">How you can use ZoneWise</h2>
          <p className="text-center text-gray-500 mb-16 max-w-xl mx-auto">
            Ask anything about Florida real estate. ZoneWise reasons through zoning codes, lien structures, and market data — so you don&apos;t have to.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Analyze */}
            <div className="group">
              <div className="bg-slate-50 rounded-2xl p-8 hover:bg-zw-navy hover:text-white transition-all duration-300 h-full">
                <div className="w-12 h-12 bg-zw-navy/10 group-hover:bg-white/10 rounded-xl flex items-center justify-center mb-6 transition-colors">
                  <svg className="w-6 h-6 text-zw-navy group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3">Analyze</h3>
                <p className="text-gray-500 group-hover:text-slate-300 transition-colors mb-6 text-sm leading-relaxed">
                  Zoning setbacks, building envelopes, permitted uses, lien priority — analyzed in seconds, not hours.
                </p>
                <div className="bg-white/5 border border-gray-200 group-hover:border-white/20 rounded-lg p-3 transition-colors">
                  <p className="text-xs text-gray-400 group-hover:text-slate-400 mb-1">Try asking:</p>
                  <p className="text-sm font-medium">&ldquo;What can I build on parcel 28-37-15 in Melbourne?&rdquo;</p>
                </div>
              </div>
            </div>

            {/* Research */}
            <div className="group">
              <div className="bg-slate-50 rounded-2xl p-8 hover:bg-zw-navy hover:text-white transition-all duration-300 h-full">
                <div className="w-12 h-12 bg-zw-navy/10 group-hover:bg-white/10 rounded-xl flex items-center justify-center mb-6 transition-colors">
                  <svg className="w-6 h-6 text-zw-navy group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3">Research</h3>
                <p className="text-gray-500 group-hover:text-slate-300 transition-colors mb-6 text-sm leading-relaxed">
                  Foreclosure dockets, tax deed sales, auction calendars, and comparable sales across all 67 counties.
                </p>
                <div className="bg-white/5 border border-gray-200 group-hover:border-white/20 rounded-lg p-3 transition-colors">
                  <p className="text-xs text-gray-400 group-hover:text-slate-400 mb-1">Try asking:</p>
                  <p className="text-sm font-medium">&ldquo;Find foreclosures under $150K in Duval with clear title&rdquo;</p>
                </div>
              </div>
            </div>

            {/* Build */}
            <div className="group">
              <div className="bg-slate-50 rounded-2xl p-8 hover:bg-zw-navy hover:text-white transition-all duration-300 h-full">
                <div className="w-12 h-12 bg-zw-navy/10 group-hover:bg-white/10 rounded-xl flex items-center justify-center mb-6 transition-colors">
                  <svg className="w-6 h-6 text-zw-navy group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3">Build</h3>
                <p className="text-gray-500 group-hover:text-slate-300 transition-colors mb-6 text-sm leading-relaxed">
                  3D building envelopes, feasibility reports, and investment analysis — your AI development partner.
                </p>
                <div className="bg-white/5 border border-gray-200 group-hover:border-white/20 rounded-lg p-3 transition-colors">
                  <p className="text-xs text-gray-400 group-hover:text-slate-400 mb-1">Try asking:</p>
                  <p className="text-sm font-medium">&ldquo;Show me the max buildable envelope for this lot&rdquo;</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Preview */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-slate-900">Meet your real estate intelligence partner</h2>
          <p className="text-center text-gray-500 mb-12 max-w-xl mx-auto">
            Tackle any property question — from zoning setbacks to foreclosure due diligence — in one conversation.
          </p>
          <SplitScreenPreview />
        </div>
      </section>

      {/* The Intelligence Layer — what makes ZoneWise different */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-slate-900">The intelligence layer</h2>
          <p className="text-center text-gray-500 mb-16 max-w-xl mx-auto">
            ZoneWise doesn&apos;t just search — it reasons. Every answer draws from structured data pipelines that cover the entire state.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-gray-100 rounded-2xl p-8 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 mb-2">Foreclosure Intelligence</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">Real-time tracking of lis pendens, default judgments, and auction schedules. Lien priority analysis tells you what survives — not what you hope survives.</p>
                </div>
              </div>
            </div>

            <div className="border border-gray-100 rounded-2xl p-8 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" /></svg>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 mb-2">Tax Deed Analysis</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">Automated due diligence on tax deed sales with title search integration, surplus fund tracking, and redemption period monitoring.</p>
                </div>
              </div>
            </div>

            <div className="border border-gray-100 rounded-2xl p-8 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 mb-2">Statewide Zoning Coverage</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">Setbacks, permitted uses, building envelope calculations, and height restrictions for 1,542 zoning districts across 808+ jurisdictions.</p>
                </div>
              </div>
            </div>

            <div className="border border-gray-100 rounded-2xl p-8 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 mb-2">ML Predictions</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">Machine learning models trained on historical auction data predict property values, third-party purchase probability, and optimal bid strategies.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing — Claude-model: capability tiers, NOT query limits */}
      <section id="pricing" className="py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-slate-900">Choose your plan</h2>
          <p className="text-center text-gray-500 mb-16 max-w-xl mx-auto">
            Every plan includes full AI access. Upgrade for deeper intelligence, not more messages.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Free */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200">
              <h3 className="font-bold text-lg text-slate-800">Free</h3>
              <p className="text-4xl font-bold my-4 text-slate-900">$0</p>
              <p className="text-sm text-gray-400 mb-6">Explore the intelligence</p>
              <ul className="space-y-3 text-sm text-gray-600 mb-8">
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  AI-powered zoning lookups
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Basic property intelligence
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  7-language support
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Interactive map
                </li>
              </ul>
              <Link href="/signup" className="block text-center py-3 border border-gray-300 rounded-xl hover:bg-slate-50 text-slate-700 font-medium transition-colors">
                Get Started
              </Link>
            </div>

            {/* Pro — the sweet spot */}
            <div className="bg-white rounded-2xl p-8 border-2 border-zw-navy relative shadow-lg shadow-zw-navy/5">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-zw-navy text-white text-xs px-4 py-1 rounded-full font-medium">Most Popular</span>
              <h3 className="font-bold text-lg text-slate-800">Pro</h3>
              <p className="text-4xl font-bold my-4 text-slate-900">$29<span className="text-base font-normal text-gray-400">/mo</span></p>
              <p className="text-sm text-gray-400 mb-6">Full intelligence access</p>
              <ul className="space-y-3 text-sm text-gray-600 mb-8">
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Everything in Free
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Foreclosure &amp; tax deed tracking
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  3D building envelopes
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  PDF &amp; DOCX report exports
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Lien priority analysis
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Priority access
                </li>
              </ul>
              <Link href="/signup?plan=pro" className="block text-center py-3 bg-zw-navy text-white rounded-xl hover:bg-zw-navy-700 font-medium transition-colors">
                Start Free Trial
              </Link>
            </div>

            {/* Investor */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200">
              <h3 className="font-bold text-lg text-slate-800">Investor</h3>
              <p className="text-4xl font-bold my-4 text-slate-900">$79<span className="text-base font-normal text-gray-400">/mo</span></p>
              <p className="text-sm text-gray-400 mb-6">Professional-grade tools</p>
              <ul className="space-y-3 text-sm text-gray-600 mb-8">
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Everything in Pro
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  ML auction predictions
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Portfolio tracking &amp; alerts
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  API access
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Bulk property analysis
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Maximum priority
                </li>
              </ul>
              <Link href="/signup?plan=investor" className="block text-center py-3 border border-gray-300 rounded-xl hover:bg-slate-50 text-slate-700 font-medium transition-colors">
                Start Free Trial
              </Link>
            </div>

            {/* Enterprise */}
            <div className="bg-zw-navy rounded-2xl p-8 text-white">
              <h3 className="font-bold text-lg">Enterprise</h3>
              <p className="text-4xl font-bold my-4">Custom</p>
              <p className="text-sm text-slate-300 mb-6">For teams &amp; institutions</p>
              <ul className="space-y-3 text-sm text-slate-300 mb-8">
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-zw-orange mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Everything in Investor
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-zw-orange mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Multi-seat workspaces
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-zw-orange mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  White-label reports
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-zw-orange mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Custom data pipelines
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-zw-orange mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  SSO &amp; admin controls
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-zw-orange mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Dedicated support
                </li>
              </ul>
              <a href="mailto:ariel@everestcapitalusa.com" className="block text-center py-3 bg-white text-zw-navy rounded-xl hover:bg-slate-100 font-medium transition-colors">
                Contact Sales
              </a>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-8">
            All plans include full AI access with no per-query limits. Upgrade for deeper capabilities, not more messages.
          </p>
        </div>
      </section>

      {/* Origin Story */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-slate-900">The origin story</h2>
          <div className="space-y-6 text-gray-600 text-lg leading-relaxed">
            <p>
              Ariel Shapira spent years navigating Florida&apos;s distressed asset markets&mdash;from tax deed auctions in rural counties to foreclosure dockets in metropolitan courthouses. The process was fragmented: county clerks used different systems, auction calendars were buried in PDFs, and critical zoning data required manual lookups across dozens of municipal websites.
            </p>
            <p>
              The insight was simple but powerful: what if every data point an investor needs&mdash;liens, zoning setbacks, auction schedules, comparable sales, and building envelopes&mdash;could be unified into a single AI-powered platform that covers all 67 Florida counties?
            </p>
            <p>
              ZoneWise.AI was born from that vision. Built on the operational foundation of{' '}
              <a href="https://everestcapitalusa.com" target="_blank" rel="noopener noreferrer" className="text-zw-navy font-medium hover:underline">
                Everest Capital USA
              </a>
              , the platform combines proprietary data pipelines, machine learning models, and a multilingual conversational interface to make distressed asset intelligence accessible to everyone&mdash;from first-time investors to institutional funds.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-zw-navy">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Start making smarter real estate decisions
          </h2>
          <p className="text-slate-300 text-lg mb-10 max-w-xl mx-auto">
            Join investors across Florida who use ZoneWise to analyze properties, track auctions, and find opportunities others miss.
          </p>
          <Link href="/signup" className="inline-block bg-white text-zw-navy px-10 py-4 rounded-xl text-lg font-semibold hover:bg-slate-100 transition-colors">
            Try ZoneWise Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-zw-navy-800 text-slate-400">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                <div className="w-6 h-6 bg-zw-navy rounded flex items-center justify-center">
                  <span className="text-white font-bold text-xs">Z</span>
                </div>
                <span className="text-white font-medium">ZoneWise.AI</span>
              </div>
              <p className="text-sm">Founded by Ariel Shapira</p>
              <a
                href="https://everestcapitalusa.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zw-orange hover:text-zw-orange-300 text-sm"
              >
                Everest Capital USA
              </a>
            </div>
            <div className="flex gap-8 text-sm">
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/disclaimer" className="hover:text-white transition-colors">Disclaimer</Link>
            </div>
          </div>
          <p className="text-center text-xs mt-8 text-slate-500">
            &copy; 2026 ZoneWise.AI &mdash; Florida&apos;s AI-Powered Real Estate Intelligence.
            Information for guidance only. Not legal, financial, or investment advice.
            Always verify with local authorities and licensed professionals before making real estate decisions.
          </p>
        </div>
      </footer>
    </div>
  )
}
