import Link from 'next/link'
import SplitScreenPreview from '@/components/SplitScreenPreview'
import BetaSignupForm from '@/components/BetaSignupForm'

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
            <a href="/kpis" className="text-gray-600 hover:text-slate-800 hidden sm:block text-sm">298 KPIs</a>
            <a href="/demo.html" className="text-zw-navy font-semibold hover:text-zw-navy-700 hidden sm:block text-sm border border-zw-navy/30 px-3 py-1 rounded-lg hover:bg-zw-navy/5 transition-all">
              ▶ Live Demo
            </a>
            <a href="#pricing" className="text-gray-600 hover:text-slate-800 hidden sm:block text-sm">Pricing</a>
            <a href="#beta-signup" className="bg-zw-navy text-white px-4 py-2 rounded-lg hover:bg-zw-navy-700 text-sm font-medium transition-colors">
              Join the Beta
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="py-24 sm:py-32 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
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
          <a href="/demo.html" className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-full text-sm font-medium mb-8 hover:bg-amber-100 transition-colors">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse inline-block"></span>
            ▶ See BidWise in action — 34-second live demo
          </a>
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
            <a href="#beta-signup" className="bg-zw-navy text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-zw-navy-700 transition-all hover:shadow-lg hover:shadow-zw-navy/20">
              Join the Beta
            </a>
            <a href="/demo.html" className="border-2 border-zw-navy text-zw-navy px-8 py-4 rounded-xl text-lg font-semibold hover:bg-zw-navy hover:text-white transition-all flex items-center gap-2">
              ▶ Watch BidWise Live
            </a>
            <a href="#how" className="text-zw-navy font-medium flex items-center gap-2 px-8 py-4 rounded-xl hover:bg-slate-50 transition-colors">
              See how it works
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </a>
          </div>
          <div className="inline-flex items-center gap-3 bg-white border border-gray-200 rounded-full px-6 py-3 shadow-sm">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-sm text-gray-600">
              No guesswork. No outdated data. Just real intelligence across all 67 Florida counties.
            </span>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-10 bg-zw-navy">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
          <div>
            <p className="text-3xl sm:text-4xl font-bold text-zw-orange">67</p>
            <p className="text-slate-300 text-sm mt-1">Counties</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-bold text-zw-orange">369</p>
            <p className="text-slate-300 text-sm mt-1">Jurisdictions</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-bold text-zw-orange">5,950</p>
            <p className="text-slate-300 text-sm mt-1">Zoning Districts</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-bold text-zw-orange">10.5M</p>
            <p className="text-slate-300 text-sm mt-1">Parcels</p>
          </div>
          <div className="col-span-2 md:col-span-1">
            <p className="text-3xl sm:text-4xl font-bold text-zw-orange">AI+ML</p>
            <p className="text-slate-300 text-sm mt-1">Powered</p>
          </div>
        </div>
      </section>

      {/* How It Works — 12 Wise Modules */}
      <section id="how" className="py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-slate-900">
            The 12-Stage <span className="text-zw-navy">Wise System</span>
          </h2>
          <p className="text-center text-gray-500 mb-4 max-w-xl mx-auto">
            Every auction property passes through all 12 modules — automatically.
          </p>
          <p className="text-center text-zw-navy font-bold mb-12 text-lg">
            ⭐ Everything exists to get you to one number: <span className="underline">BidWise</span>
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { n:1,  name:"DiscoverWise",  desc:"Find upcoming auctions across 67 FL counties",          color:"#1E3A5F" },
              { n:2,  name:"GatherWise",    desc:"Pull all property data — BCPAO, photos, history",       color:"#1E3A5F" },
              { n:3,  name:"TitleWise",     desc:"Verify the full chain of title",                        color:"#1E3A5F" },
              { n:4,  name:"LienWise",      desc:"Map the complete lien waterfall",                       color:"#1E3A5F" },
              { n:5,  name:"TaxWise",       desc:"Check tax certificates and delinquencies",              color:"#1E3A5F" },
              { n:6,  name:"NeighborWise",  desc:"Neighborhood intelligence — income, vacancy, demand",   color:"#1E3A5F" },
              { n:7,  name:"ScoreWise",     desc:"AI bid probability score — should you bid?",            color:"#1E3A5F" },
              { n:8,  name:"BidWise",       desc:"Your exact max bid. The number that matters.",          color:"#F5A623", hero:true },
              { n:9,  name:"CallWise",      desc:"Final BID / REVIEW / SKIP decision output",            color:"#1E3A5F" },
              { n:10, name:"InsightWise",   desc:"Full 298-KPI auction intelligence report",             color:"#1E3A5F" },
              { n:11, name:"TrackWise",     desc:"Track outcome — flip, rent, or pass",                  color:"#1E3A5F" },
              { n:12, name:"VaultWise",     desc:"Archive every deal, decision, and result",             color:"#1E3A5F" },
            ].map((m) => (
              <div key={m.n} className={`rounded-xl p-5 border transition-all duration-200 hover:shadow-md ${m.hero ? "bg-zw-navy text-white border-zw-navy shadow-lg scale-105" : "bg-white border-gray-200"}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${m.hero ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                    {String(m.n).padStart(2,"0")}
                  </span>
                  {m.hero && <span className="text-xs font-bold text-amber-300">⭐ HERO</span>}
                </div>
                <h3 className={`font-bold text-base mb-1 ${m.hero ? "text-white" : "text-slate-900"}`}>
                  {m.name}
                </h3>
                <p className={`text-xs leading-relaxed ${m.hero ? "text-blue-100" : "text-gray-500"}`}>
                  {m.desc}
                </p>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-400 text-sm mt-8">
            12 modules · 298 KPIs · Every Florida county · No analyst needed
          </p>
        </div>
      </section>

      {/* Platform Preview */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-slate-900">Meet your real estate intelligence partner</h2>
          <p className="text-center text-gray-500 mb-12 max-w-xl mx-auto">
            Tackle any property question — from zoning setbacks to foreclosure due diligence — in one conversation.
          </p>
          <div className="relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 bg-zw-orange text-white text-xs px-4 py-1.5 rounded-full font-semibold shadow-md">
              PREVIEW &mdash; Coming Soon
            </div>
            <SplitScreenPreview />
          </div>
        </div>
      </section>

      {/* Agent & Skill Showcase */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-slate-900">AI Agents &amp; Skills</h2>
          <p className="text-center text-gray-500 mb-12">Specialized agents backed by real Florida data</p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {[
              { name: 'Zoning Lookup', desc: 'Find zoning districts in any Florida city', icon: (
                <svg className="w-6 h-6 text-zw-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              )},
              { name: 'District Compare', desc: 'Compare districts across jurisdictions', icon: (
                <svg className="w-6 h-6 text-zw-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
              )},
              { name: 'Research', desc: 'Open-ended zoning intelligence queries', icon: (
                <svg className="w-6 h-6 text-zw-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
              )},
              { name: 'Permit Check', desc: 'Check what uses are permitted in any zone', icon: (
                <svg className="w-6 h-6 text-zw-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
              )},
            ].map((agent, i) => (
              <div key={i} className="border border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:border-zw-navy/20 transition-all">
                <div className="w-10 h-10 bg-zw-navy/10 rounded-lg flex items-center justify-center mb-4">
                  {agent.icon}
                </div>
                <h3 className="font-bold text-slate-800 mb-1">{agent.name}</h3>
                <p className="text-gray-500 text-sm">{agent.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { name: '67 FL Counties', value: '369 jurisdictions' },
              { name: '5,950 Districts', value: 'Indexed & searchable' },
              { name: 'District Lookup', value: 'Instant regex path' },
              { name: 'Density Compare', value: 'Claude Sonnet 4.5' },
              { name: 'Setback Analysis', value: 'Front/side/rear' },
              { name: 'Permitted Uses', value: 'By-right & conditional' },
            ].map((skill, i) => (
              <div key={i} className="bg-slate-50 border rounded-lg p-3 text-center">
                <p className="text-sm font-medium text-slate-700">{skill.name}</p>
                <p className="text-xs text-gray-400 mt-1">{skill.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Desktop App — Coming Soon */}
      <section className="py-20 bg-zw-navy">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">ZoneWise Desktop</h2>
          <p className="text-slate-300 mb-8 max-w-xl mx-auto">
            Desktop app coming soon. Join the beta for first access.
          </p>
          <a href="#beta-signup" className="inline-flex items-center justify-center gap-2 bg-white text-zw-navy px-6 py-3 rounded-lg font-semibold hover:bg-slate-100 transition-colors">
            Join the Beta
          </a>
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

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-slate-900">Early access pricing</h2>
          <p className="text-center text-gray-500 mb-16 max-w-xl mx-auto">
            Get in early. Lock in founder benefits before we launch.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-8 border-2 border-zw-navy relative shadow-lg shadow-zw-navy/5">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-zw-navy text-white text-xs px-4 py-1 rounded-full font-medium">Available Now</span>
              <h3 className="font-bold text-lg text-slate-800">Beta Access</h3>
              <p className="text-4xl font-bold my-4 text-slate-900">$0</p>
              <p className="text-sm text-gray-400 mb-6">Free during beta</p>
              <ul className="space-y-3 text-sm text-gray-600 mb-8">
                <li className="flex items-start gap-2"><svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>AI-powered zoning lookups</li>
                <li className="flex items-start gap-2"><svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>All 67 Florida counties</li>
                <li className="flex items-start gap-2"><svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>District &amp; setback analysis</li>
                <li className="flex items-start gap-2"><svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Permitted use search</li>
              </ul>
              <a href="#beta-signup" className="block text-center py-3 bg-zw-navy text-white rounded-xl hover:bg-zw-navy-700 font-medium transition-colors">Join the Beta</a>
            </div>
            <div className="bg-white rounded-2xl p-8 border border-gray-200 relative opacity-80">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gray-400 text-white text-xs px-4 py-1 rounded-full font-medium">Coming Soon</span>
              <h3 className="font-bold text-lg text-slate-800">Founding Member</h3>
              <p className="text-4xl font-bold my-4 text-slate-400">TBD</p>
              <p className="text-sm text-gray-400 mb-6">Lifetime discounted rate</p>
              <ul className="space-y-3 text-sm text-gray-600 mb-8">
                <li className="flex items-start gap-2"><svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Everything in Beta</li>
                <li className="flex items-start gap-2"><svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>3D building envelopes</li>
                <li className="flex items-start gap-2"><svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Foreclosure &amp; tax deed tracking</li>
                <li className="flex items-start gap-2"><svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>PDF &amp; DOCX exports</li>
              </ul>
              <span className="block text-center py-3 border border-gray-300 rounded-xl text-gray-400 font-medium cursor-not-allowed">Coming Soon</span>
            </div>
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
          <a href="#beta-signup" className="inline-block bg-white text-zw-navy px-10 py-4 rounded-xl text-lg font-semibold hover:bg-slate-100 transition-colors">
            Join the Beta
          </a>
        </div>
      </section>

      {/* Beta Signup */}
      <section id="beta-signup" className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Get early access
          </h2>
          <p className="text-gray-500 text-lg mb-10 max-w-xl mx-auto">
            Enter your email to join the beta. We&apos;ll notify you when your account is ready.
          </p>
          <div className="relative">
            <BetaSignupForm />
          </div>
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
            &copy; 2026 ZoneWise.AI &mdash; The AI for Real Estate Intelligence.
            Information for guidance only. Not legal, financial, or investment advice.
            Always verify with local authorities and licensed professionals before making real estate decisions.
          </p>
        </div>
      </footer>
    </div>
  )
}
