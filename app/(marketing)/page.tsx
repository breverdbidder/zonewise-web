import Link from 'next/link'
import SplitScreenPreview from '@/components/SplitScreenPreview'

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-800">
      {/* Header */}
      <header className="border-b sticky top-0 bg-white/95 backdrop-blur z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#1E3A5F] rounded-lg flex items-center justify-center relative">
              <span className="text-white font-bold">Z</span>
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#F59E0B] rounded-full" />
            </div>
            <span className="text-xl font-bold text-slate-800">ZoneWise.AI</span>
          </div>
          <nav className="flex items-center gap-6">
            <a href="#pricing" className="text-gray-700 hover:text-slate-800 hidden sm:block">Pricing</a>
            <Link href="/login" className="text-gray-700 hover:text-slate-800">Login</Link>
            <Link href="/signup" className="bg-[#1E3A5F] text-white px-4 py-2 rounded-lg hover:bg-[#162D4A]">
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-800 mb-6">
            Florida&apos;s AI-Powered Real Estate
            <span className="text-[#1E3A5F] block mt-2">Intelligence</span>
          </h1>
          <p className="text-xl text-gray-700 mb-4">
            Distressed Assets Decoded. For Everyone. Everywhere.
          </p>
          <p className="text-sm text-gray-500 mb-2">
            Founded by Ariel Shapira, Inventor &amp; Founder
          </p>
          <a
            href="https://everestcapitalusa.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-[#1E3A5F] font-medium border border-[#1E3A5F]/20 rounded-full px-4 py-1.5 hover:bg-[#1E3A5F]/5 transition-colors mb-8"
          >
            Powering Everest Capital USA
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          <div className="block">
            <Link href="/signup" className="inline-block bg-[#1E3A5F] text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-[#162D4A]">
              Start Free
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-[#1E3A5F]">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div><p className="text-3xl font-bold text-[#F59E0B]">67</p><p className="text-slate-300">Counties</p></div>
          <div><p className="text-3xl font-bold text-[#F59E0B]">298</p><p className="text-slate-300">KPIs</p></div>
          <div><p className="text-3xl font-bold text-[#F59E0B]">10.8M</p><p className="text-slate-300">Parcels</p></div>
          <div><p className="text-3xl font-bold text-[#F59E0B]">AI+ML</p><p className="text-slate-300">Powered</p></div>
        </div>
      </section>

      {/* Our Edge - Feature Cards */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-slate-900">Our Edge</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-[#1E3A5F]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-[#1E3A5F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2 text-slate-800">Foreclosure Intelligence</h3>
              <p className="text-gray-700 text-sm">Real-time tracking of lis pendens, default judgments, and auction schedules across all 67 counties.</p>
            </div>
            <div className="text-center p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-[#1E3A5F]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-[#1E3A5F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2 text-slate-800">Tax Deed Analysis</h3>
              <p className="text-gray-700 text-sm">Automated due diligence on tax deed sales with title search integration and lien analysis.</p>
            </div>
            <div className="text-center p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-[#1E3A5F]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-[#1E3A5F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2 text-slate-800">Zoning Coverage</h3>
              <p className="text-gray-700 text-sm">Comprehensive zoning data with setbacks, permitted uses, and building envelope calculations statewide.</p>
            </div>
            <div className="text-center p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-[#1E3A5F]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-[#1E3A5F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2 text-slate-800">ML Predictions</h3>
              <p className="text-gray-700 text-sm">Machine learning models predict property values, market trends, and investment opportunities.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Preview */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4 text-slate-900">Platform Preview</h2>
          <p className="text-center text-gray-700 mb-12">See how ZoneWise.AI brings real estate intelligence to life</p>
          <SplitScreenPreview />
        </div>
      </section>

      {/* Origin Story */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8 text-slate-900">The Origin Story</h2>
          <div className="prose prose-lg max-w-none text-gray-700">
            <p>
              Ariel Shapira spent years navigating Florida&apos;s distressed asset markets&mdash;from tax deed auctions in rural counties to foreclosure dockets in metropolitan courthouses. The process was fragmented: county clerks used different systems, auction calendars were buried in PDFs, and critical zoning data required manual lookups across dozens of municipal websites.
            </p>
            <p>
              The insight was simple but powerful: what if every data point an investor needs&mdash;liens, zoning setbacks, auction schedules, comparable sales, and building envelopes&mdash;could be unified into a single AI-powered platform that covers all 67 Florida counties?
            </p>
            <p>
              ZoneWise.AI was born from that vision. Built on the operational foundation of{' '}
              <a href="https://everestcapitalusa.com" target="_blank" rel="noopener noreferrer" className="text-[#1E3A5F] font-medium hover:underline">
                Everest Capital USA
              </a>
              , the platform combines proprietary data pipelines, machine learning models, and a multilingual conversational interface to make distressed asset intelligence accessible to everyone&mdash;from first-time investors to institutional funds.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4 text-slate-900">Simple Pricing</h2>
          <p className="text-center text-gray-700 mb-12">Start free, upgrade when you need more</p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border">
              <h3 className="font-semibold text-lg text-slate-800">Free</h3>
              <p className="text-3xl font-bold my-4 text-slate-900">$0<span className="text-base font-normal text-gray-500">/mo</span></p>
              <ul className="space-y-2 text-sm text-gray-700 mb-6">
                <li>&#10003; 25 queries/month</li>
                <li>&#10003; Basic zoning lookup</li>
              </ul>
              <Link href="/signup" className="block text-center py-2 border rounded-lg hover:bg-slate-50 text-slate-700">Get Started</Link>
            </div>
            <div className="bg-white p-6 rounded-xl border-2 border-[#1E3A5F] relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#1E3A5F] text-white text-xs px-3 py-1 rounded-full">Popular</span>
              <h3 className="font-semibold text-lg text-slate-800">Pro</h3>
              <p className="text-3xl font-bold my-4 text-slate-900">$29<span className="text-base font-normal text-gray-500">/mo</span></p>
              <ul className="space-y-2 text-sm text-gray-700 mb-6">
                <li>&#10003; 500 queries/month</li>
                <li>&#10003; Interactive map</li>
                <li>&#10003; PDF exports</li>
              </ul>
              <Link href="/signup?plan=pro" className="block text-center py-2 bg-[#1E3A5F] text-white rounded-lg hover:bg-[#162D4A]">Start Trial</Link>
            </div>
            <div className="bg-white p-6 rounded-xl border">
              <h3 className="font-semibold text-lg text-slate-800">Team</h3>
              <p className="text-3xl font-bold my-4 text-slate-900">$99<span className="text-base font-normal text-gray-500">/mo</span></p>
              <ul className="space-y-2 text-sm text-gray-700 mb-6">
                <li>&#10003; 2,000 queries/month</li>
                <li>&#10003; 5 team members</li>
                <li>&#10003; Priority support</li>
              </ul>
              <Link href="/signup?plan=team" className="block text-center py-2 border rounded-lg hover:bg-slate-50 text-slate-700">Start Trial</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-[#1E3A5F] text-slate-300">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <p className="text-white font-medium">Founded by Ariel Shapira</p>
              <a
                href="https://everestcapitalusa.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#F59E0B] hover:text-[#FBBF24] text-sm"
              >
                Everest Capital USA
              </a>
            </div>
            <div className="flex gap-6 text-sm">
              <Link href="/terms" className="hover:text-white">Terms</Link>
              <Link href="/privacy" className="hover:text-white">Privacy</Link>
              <Link href="/disclaimer" className="hover:text-white">Disclaimer</Link>
            </div>
          </div>
          <p className="text-center text-xs mt-6 text-slate-400">
            &copy; 2026 ZoneWise.AI. Information for guidance only. Not legal, financial, or investment advice. Always verify with local authorities and licensed professionals before making real estate decisions.
          </p>
        </div>
      </footer>
    </div>
  )
}
