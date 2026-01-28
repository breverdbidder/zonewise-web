import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b sticky top-0 bg-white/95 backdrop-blur z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">Z</span>
            </div>
            <span className="text-xl font-bold text-slate-800">ZoneWise.AI</span>
          </div>
          <nav className="flex items-center gap-6">
            <a href="#pricing" className="text-gray-600 hover:text-slate-800 hidden sm:block">Pricing</a>
            <Link href="/login" className="text-gray-600 hover:text-slate-800">Login</Link>
            <Link href="/signup" className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700">
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-800 mb-6">
            Brevard County Zoning
            <span className="text-teal-600 block mt-2">Intelligence Platform</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Query setbacks, building heights, and permitted uses for all 17 jurisdictions using AI.
          </p>
          <Link href="/signup" className="inline-block bg-teal-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-teal-700">
            Start Free - 25 Queries
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-slate-800">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div><p className="text-3xl font-bold text-teal-400">301</p><p className="text-slate-300">Districts</p></div>
          <div><p className="text-3xl font-bold text-teal-400">10K+</p><p className="text-slate-300">Polygons</p></div>
          <div><p className="text-3xl font-bold text-teal-400">17</p><p className="text-slate-300">Jurisdictions</p></div>
          <div><p className="text-3xl font-bold text-teal-400">56</p><p className="text-slate-300">Zone Codes</p></div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="font-semibold mb-2">Ask in Plain English</h3>
              <p className="text-gray-600">What are the setbacks for R-1 in Satellite Beach?</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="font-semibold mb-2">AI Finds the Answer</h3>
              <p className="text-gray-600">Searches 301 districts across 17 jurisdictions instantly.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✅</span>
              </div>
              <h3 className="font-semibold mb-2">Get Verified Data</h3>
              <p className="text-gray-600">Front: 25ft, Side: 7.5ft, Rear: 20ft, Max Height: 35ft</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Simple Pricing</h2>
          <p className="text-center text-gray-600 mb-12">Start free, upgrade when you need more</p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border">
              <h3 className="font-semibold text-lg">Free</h3>
              <p className="text-3xl font-bold my-4">$0<span className="text-base font-normal text-gray-500">/mo</span></p>
              <ul className="space-y-2 text-sm text-gray-600 mb-6">
                <li>✓ 25 queries/month</li>
                <li>✓ Basic zoning lookup</li>
              </ul>
              <Link href="/signup" className="block text-center py-2 border rounded-lg hover:bg-slate-50">Get Started</Link>
            </div>
            <div className="bg-white p-6 rounded-xl border-2 border-teal-600 relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-600 text-white text-xs px-3 py-1 rounded-full">Popular</span>
              <h3 className="font-semibold text-lg">Pro</h3>
              <p className="text-3xl font-bold my-4">$29<span className="text-base font-normal text-gray-500">/mo</span></p>
              <ul className="space-y-2 text-sm text-gray-600 mb-6">
                <li>✓ 500 queries/month</li>
                <li>✓ Interactive map</li>
                <li>✓ PDF exports</li>
              </ul>
              <Link href="/signup?plan=pro" className="block text-center py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">Start Trial</Link>
            </div>
            <div className="bg-white p-6 rounded-xl border">
              <h3 className="font-semibold text-lg">Team</h3>
              <p className="text-3xl font-bold my-4">$99<span className="text-base font-normal text-gray-500">/mo</span></p>
              <ul className="space-y-2 text-sm text-gray-600 mb-6">
                <li>✓ 2,000 queries/month</li>
                <li>✓ 5 team members</li>
                <li>✓ Priority support</li>
              </ul>
              <Link href="/signup?plan=team" className="block text-center py-2 border rounded-lg hover:bg-slate-50">Start Trial</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-900 text-slate-400">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p>© 2026 ZoneWise.AI 2026</p>
            <div className="flex gap-6 text-sm">
              <Link href="/terms" className="hover:text-white">Terms</Link>
              <Link href="/privacy" className="hover:text-white">Privacy</Link>
              <Link href="/disclaimer" className="hover:text-white">Disclaimer</Link>
            </div>
          </div>
          <p className="text-center text-xs mt-6">Information for guidance only. Verify with local Planning Department.</p>
        </div>
      </footer>
    </div>
  )
}
