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

      {/* How It Works */}
      <section id="how" className="py-24">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-slate-900">How you can use ZoneWise</h2>
          <p className="text-center text-gray-500 mb-16 max-w-xl mx-auto">
            Ask anything about Florida real estate. ZoneWise reasons through zoning codes, lien structures, and market data — so you don&apos;t have to.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
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
              { name: '5,395 Districts', value: 'Indexed & searchable' },
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

      {/* Desktop Download + Try in Browser */}
      <section className="py-20 bg-zw-navy">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Get ZoneWise Desktop</h2>
          <p className="text-slate-300 mb-8 max-w-xl mx-auto">
            Full-featured desktop app powered by Craft Agents with offline caching,
            3D building envelopes, and local session persistence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <a
              href="https://github.com/breverdbidder/zonewise-desktop/releases/download/v2.5.0/ZoneWise-AI-x64.exe"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-white text-zw-navy px-6 py-3 rounded-lg font-semibold hover:bg-slate-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.5.5.09.66-.22.66-.48v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.93 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0112 6.8c.85.004 1.71.115 2.51.34 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.16.58.67.48A10.01 10.01 0 0022 12c0-5.52-4.48-10-10-10z"/></svg>
              Download for Windows
            </a>
            <a
              href="https://github.com/breverdbidder/zonewise-desktop/releases/download/v2.5.0/ZoneWise-AI-arm64.dmg"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 border border-white/30 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22 17.607c-.786 2.28-3.139 6.317-5.563 6.361-1.608.031-2.125-.953-3.963-.953-1.837 0-2.412.923-3.932.983-2.572.099-6.542-5.827-6.542-10.995 0-4.747 3.308-7.1 6.198-7.143 1.55-.028 3.014 1.045 3.959 1.045.949 0 2.727-1.29 4.596-1.101.782.033 2.979.316 4.389 2.377-3.741 2.442-3.158 7.549.858 9.426zm-5.222-17.607c-2.826.114-5.132 3.079-4.81 5.531 2.612.203 5.118-2.725 4.81-5.531z"/></svg>
              Download for macOS
            </a>
          </div>
          <a
            href="https://zonewise-desktop-viewer.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-zw-orange hover:text-zw-orange-300 text-sm font-medium transition-colors"
          >
            Or try in your browser
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
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
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-slate-900">Choose your plan</h2>
          <p className="text-center text-gray-500 mb-16 max-w-xl mx-auto">
            Every plan includes full AI access. Upgrade for deeper intelligence, not more messages.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-8 border border-gray-200">
              <h3 className="font-bold text-lg text-slate-800">Free</h3>
              <p className="text-4xl font-bold my-4 text-slate-900">$0</p>
              <p className="text-sm text-gray-400 mb-6">Explore the intelligence</p>
              <ul className="space-y-3 text-sm text-gray-600 mb-8">
                <li className="flex items-start gap-2"><svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>AI-powered zoning lookups</li>
                <li className="flex items-start gap-2"><svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Basic property intelligence</li>
                <li className="flex items-start gap-2"><svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>7-language support</li>
                <li className="flex items-start gap-2"><svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Interactive map</li>
              </ul>
              <Link href="/signup" className="block text-center py-3 border border-gray-300 rounded-xl hover:bg-slate-50 text-slate-700 font-medium transition-colors">Get Started</Link>
            </div>
            <div className="bg-white rounded-2xl p-8 border-2 border-zw-navy relative shadow-lg shadow-zw-navy/5">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-zw-navy text-white text-xs px-4 py-1 rounded-full font-medium">Most Popular</span>
              <h3 className="font-bold text-lg text-slate-800">Pro</h3>
              <p className="text-4xl font-bold my-4 text-slate-900">$29<span className="text-base font-normal text-gray-400">/mo</span></p>
              <p className="text-sm text-gray-400 mb-6">Full intelligence access</p>
              <ul className="space-y-3 text-sm text-gray-600 mb-8">
                <li className="flex items-start gap-2"><svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Everything in Free</li>
                <li className="flex items-start gap-2"><svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Foreclosure &amp; tax deed tracking</li>
                <li className="flex items-start gap-2"><svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>3D building envelopes</li>
                <li className="flex items-start gap-2"><svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>PDF &amp; DOCX exports</li>
              </ul>
              <Link href="/signup?plan=pro" className="block text-center py-3 bg-zw-navy text-white rounded-xl hover:bg-zw-navy-700 font-medium transition-colors">Start Free Trial</Link>
            </div>
            <div className="bg-white rounded-2xl p-8 border border-gray-200">
              <h3 className="font-bold text-lg text-slate-800">Investor</h3>
              <p className="text-4xl font-bold my-4 text-slate-900">$79<span className="text-base font-normal text-gray-400">/mo</span></p>
              <p className="text-sm text-gray-400 mb-6">Professional-grade tools</p>
              <ul className="space-y-3 text-sm text-gray-600 mb-8">
                <li className="flex items-start gap-2"><svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Everything in Pro</li>
                <li className="flex items-start gap-2"><svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>ML auction predictions</li>
                <li className="flex items-start gap-2"><svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Portfolio tracking &amp; alerts</li>
                <li className="flex items-start gap-2"><svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>API access</li>
              </ul>
              <Link href="/signup?plan=investor" className="block text-center py-3 border border-gray-300 rounded-xl hover:bg-slate-50 text-slate-700 font-medium transition-colors">Start Free Trial</Link>
            </div>
            <div className="bg-zw-navy rounded-2xl p-8 text-white">
              <h3 className="font-bold text-lg">Enterprise</h3>
              <p className="text-4xl font-bold my-4">Custom</p>
              <p className="text-sm text-slate-300 mb-6">For teams &amp; institutions</p>
              <ul className="space-y-3 text-sm text-slate-300 mb-8">
                <li className="flex items-start gap-2"><svg className="w-4 h-4 text-zw-orange mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Everything in Investor</li>
                <li className="flex items-start gap-2"><svg className="w-4 h-4 text-zw-orange mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Multi-seat workspaces</li>
                <li className="flex items-start gap-2"><svg className="w-4 h-4 text-zw-orange mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>White-label reports</li>
                <li className="flex items-start gap-2"><svg className="w-4 h-4 text-zw-orange mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Custom data pipelines</li>
              </ul>
              <a href="mailto:ariel@everestcapitalusa.com" className="block text-center py-3 bg-white text-zw-navy rounded-xl hover:bg-slate-100 font-medium transition-colors">Contact Sales</a>
            </div>
          </div>
          <p className="text-center text-xs text-gray-400 mt-8">
            All plans include full AI access with no per-query limits. Upgrade for deeper capabilities, not more messages.
          </p>
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
            &copy; 2026 ZoneWise.AI &mdash; The AI for Real Estate Intelligence.
            Information for guidance only. Not legal, financial, or investment advice.
            Always verify with local authorities and licensed professionals before making real estate decisions.
          </p>
        </div>
      </footer>
    </div>
  )
}
