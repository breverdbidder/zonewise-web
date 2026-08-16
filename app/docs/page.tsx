import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'API Reference — ZoneWise.AI',
  description: 'ZoneWise.AI REST API documentation: authentication, endpoints, rate limits, and code examples.',
}

// ── Code block helper ─────────────────────────────────────────────────────────
function CodeBlock({ lang, code }: { lang: string; code: string }) {
  return (
    <div className="rounded-xl overflow-hidden border border-slate-700 my-4">
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 border-b border-slate-700">
        <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">{lang}</span>
      </div>
      <pre className="p-4 overflow-x-auto text-sm bg-slate-950">
        <code className="text-slate-200 font-mono whitespace-pre">{code.trim()}</code>
      </pre>
    </div>
  )
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-16 scroll-mt-20">
      <h2 className="text-2xl font-bold text-white mb-6 pb-3 border-b border-slate-800">{title}</h2>
      {children}
    </section>
  )
}

function EndpointBadge({ method }: { method: 'GET' | 'POST' | 'DELETE' }) {
  const colors = {
    GET: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    POST: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    DELETE: 'bg-red-500/15 text-red-400 border-red-500/30',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-mono font-bold border ${colors[method]}`}>
      {method}
    </span>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-white" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Nav */}
      <nav className="h-14 flex items-center px-6 border-b border-slate-800 sticky top-0 bg-[#020617]/95 backdrop-blur-sm z-20">
        <Link href="/" className="flex items-center gap-2 min-h-11">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-[#1E3A5F] to-[#2d5a8f] flex items-center justify-center">
            <span className="text-white text-xs font-bold">Z</span>
          </div>
          <span className="text-sm font-semibold text-white">
            ZoneWise<span className="text-[#F59E0B]">.AI</span>
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-6 text-sm text-slate-400">
          <Link href="/explorer" className="hover:text-white transition-colors flex items-center min-h-11">Explorer</Link>
          <Link href="/pricing" className="hover:text-white transition-colors flex items-center min-h-11">Pricing</Link>
          <Link href="/help" className="hover:text-white transition-colors flex items-center min-h-11">Help</Link>
          <Link href="/sign-up" className="bg-[#F59E0B] text-slate-950 px-4 py-2 rounded-lg font-bold text-sm hover:brightness-110 transition-all">
            Get API Key
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-16 flex gap-12">
        {/* Sidebar */}
        <aside className="w-48 shrink-0 hidden lg:block">
          <nav className="sticky top-24 space-y-1 text-sm">
            {[
              { href: '#overview', label: 'Overview' },
              { href: '#authentication', label: 'Authentication' },
              { href: '#endpoints', label: 'Endpoints' },
              { href: '#rate-limits', label: 'Rate Limits' },
              { href: '#examples', label: 'Code Examples' },
              { href: '#errors', label: 'Error Codes' },
            ].map(item => (
              <a
                key={item.href}
                href={item.href}
                className="block px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">
          {/* Header */}
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#1E3A5F]/40 border border-[#1E3A5F]/60 rounded-full text-xs text-slate-400 mb-4">
              <span className="w-1.5 h-1.5 bg-[#F59E0B] rounded-full animate-pulse" />
              API v1 · REST · JSON
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">API Reference</h1>
            <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">
              ZoneWise.AI gives you programmatic access to Florida parcel data, zoning intelligence, and AI-powered property analysis. Available on Pro and Enterprise plans.
            </p>
          </div>

          {/* Overview */}
          <Section id="overview" title="Overview">
            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              {[
                { icon: '🌐', title: 'Base URL', value: 'https://zonewise.ai/api/v1' },
                { icon: '📦', title: 'Format', value: 'JSON (application/json)' },
                { icon: '🔐', title: 'Auth', value: 'Bearer token (API key)' },
              ].map(item => (
                <div key={item.title} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="text-xl mb-2">{item.icon}</div>
                  <div className="text-xs text-slate-500 mb-1">{item.title}</div>
                  <div className="text-sm font-mono text-slate-200">{item.value}</div>
                </div>
              ))}
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              All API responses include standard HTTP status codes. Successful responses return <code className="text-[#F59E0B] bg-slate-900 px-1.5 py-0.5 rounded text-xs">200 OK</code> with a JSON body. Errors return <code className="text-red-400 bg-slate-900 px-1.5 py-0.5 rounded text-xs">4xx</code> or <code className="text-red-400 bg-slate-900 px-1.5 py-0.5 rounded text-xs">5xx</code> codes with a structured error body.
            </p>
          </Section>

          {/* Authentication */}
          <Section id="authentication" title="Authentication">
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              All API requests must include your API key in the <code className="text-[#F59E0B] bg-slate-900 px-1.5 py-0.5 rounded text-xs">Authorization</code> header as a Bearer token. Get your API key from the{' '}
              <Link href="/sign-up" className="text-[#F59E0B] hover:underline">account dashboard</Link>.
            </p>
            <CodeBlock lang="http" code={`Authorization: Bearer zw_live_xxxxxxxxxxxxxxxxxxxx`} />
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-sm text-amber-200">
              <strong>Keep your API key secret.</strong> Never expose it in client-side code or public repositories. Use environment variables on your server.
            </div>
          </Section>

          {/* Endpoints */}
          <Section id="endpoints" title="Endpoints">

            {/* Parcel */}
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-3">
                <EndpointBadge method="GET" />
                <code className="text-slate-200 font-mono text-sm">/api/v1/parcels/{'{parcel_id}'}</code>
              </div>
              <p className="text-slate-400 text-sm mb-3">
                Retrieve full parcel data for a given parcel ID. Includes zoning, owner, assessed value, and land use.
              </p>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-sm mb-4">
                <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                  <div className="text-slate-500">parcel_id</div><div className="text-slate-200">string · required · FL county PARCEL_ID format</div>
                  <div className="text-slate-500">county</div><div className="text-slate-200">string · optional · defaults to &quot;brevard&quot;</div>
                </div>
              </div>
              <CodeBlock lang="json" code={`{
  "parcel_id": "2412345",
  "address": "123 Main St, Melbourne, FL 32901",
  "owner": "Smith, John A",
  "zoning": "RU-1-9",
  "land_use": "Single Family Residential",
  "assessed_value": 245000,
  "lot_size_sqft": 8500,
  "zip": "32901",
  "county": "brevard"
}`} />
            </div>

            {/* Zoning */}
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-3">
                <EndpointBadge method="GET" />
                <code className="text-slate-200 font-mono text-sm">/api/v1/zoning/{'{zone_code}'}</code>
              </div>
              <p className="text-slate-400 text-sm mb-3">
                Get zoning district definition: permitted uses, dimensional standards, setbacks.
              </p>
              <CodeBlock lang="json" code={`{
  "zone_code": "RU-1-9",
  "name": "Single-Family Residential District",
  "county": "brevard",
  "permitted_uses": ["single_family", "accessory_structures"],
  "min_lot_size_sqft": 9000,
  "max_height_ft": 35,
  "front_setback_ft": 25,
  "rear_setback_ft": 20,
  "side_setback_ft": 7.5
}`} />
            </div>

            {/* Chat */}
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-3">
                <EndpointBadge method="POST" />
                <code className="text-slate-200 font-mono text-sm">/api/v1/chat</code>
              </div>
              <p className="text-slate-400 text-sm mb-3">
                Send a natural language query to the ZoneWise AI. Returns a streaming or non-streaming response with property and zoning intelligence.
              </p>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-sm mb-4">
                <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                  <div className="text-slate-500">messages</div><div className="text-slate-200">array · required · OpenAI-format message array</div>
                  <div className="text-slate-500">county</div><div className="text-slate-200">string · optional · defaults to &quot;brevard&quot;</div>
                  <div className="text-slate-500">stream</div><div className="text-slate-200">boolean · optional · defaults to true</div>
                </div>
              </div>
            </div>

            {/* KPIs */}
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-3">
                <EndpointBadge method="GET" />
                <code className="text-slate-200 font-mono text-sm">/api/v1/kpis</code>
              </div>
              <p className="text-slate-400 text-sm">
                Returns all 298 property KPI definitions across 17 categories. Used to power the InsightWise report.
              </p>
            </div>
          </Section>

          {/* Rate Limits */}
          <Section id="rate-limits" title="Rate Limits">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Plan</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Requests/min</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Requests/day</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Chat queries/day</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  {[
                    { plan: 'Free', rpm: '—', rpd: '—', chat: '3' },
                    { plan: 'Starter ($39/mo)', rpm: '30', rpd: '1,000', chat: '20' },
                    { plan: 'Pro ($99/mo)', rpm: '120', rpd: 'Unlimited', chat: 'Unlimited' },
                    { plan: 'Enterprise', rpm: 'Custom', rpd: 'Custom', chat: 'Custom' },
                  ].map((row, i) => (
                    <tr key={row.plan} className={`border-b border-slate-900 ${i === 2 ? 'bg-[#1E3A5F]/10' : ''}`}>
                      <td className="py-3 px-4 font-medium">{row.plan}</td>
                      <td className="py-3 px-4 font-mono text-xs">{row.rpm}</td>
                      <td className="py-3 px-4 font-mono text-xs">{row.rpd}</td>
                      <td className="py-3 px-4 font-mono text-xs">{row.chat}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-slate-500 text-xs mt-4">
              When rate limited, the API returns <code className="text-red-400">429 Too Many Requests</code> with a <code className="text-slate-300">Retry-After</code> header.
            </p>
          </Section>

          {/* Code Examples */}
          <Section id="examples" title="Code Examples">

            <h3 className="text-lg font-semibold text-white mb-3">cURL</h3>
            <CodeBlock lang="bash" code={`curl -X GET \\
  "https://zonewise.ai/api/v1/parcels/2412345" \\
  -H "Authorization: Bearer zw_live_xxxxxxxxxxxxxxxxxxxx" \\
  -H "Content-Type: application/json"`} />

            <h3 className="text-lg font-semibold text-white mb-3 mt-8">Python</h3>
            <CodeBlock lang="python" code={
`import requests

API_KEY = "zw_live_xxxxxxxxxxxxxxxxxxxx"
BASE_URL = "https://zonewise.ai/api/v1"

headers = {
    "Authorization": "Bearer " + API_KEY,
    "Content-Type": "application/json",
}

# Fetch parcel data
response = requests.get(BASE_URL + "/parcels/2412345", headers=headers)
parcel = response.json()
print("Zoning:", parcel["zoning"])
print("Assessed value:", parcel["assessed_value"])

# Send a chat query
chat_response = requests.post(
    BASE_URL + "/chat",
    headers=headers,
    json={
        "messages": [
            {"role": "user", "content": "What are the setbacks for RU-1-9 zoning?"}
        ],
        "stream": False
    }
)
print(chat_response.json()["content"])`
            } />

            <h3 className="text-lg font-semibold text-white mb-3 mt-8">JavaScript / TypeScript</h3>
            <CodeBlock lang="typescript" code={`const API_KEY = process.env.ZONEWISE_API_KEY!
const BASE_URL = 'https://zonewise.ai/api/v1'

// Fetch parcel data
async function getParcel(parcelId: string) {
  const res = await fetch(\`\${BASE_URL}/parcels/\${parcelId}\`, {
    headers: {
      Authorization: \`Bearer \${API_KEY}\`,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) throw new Error(\`API error: \${res.status}\`)
  return res.json()
}

// Chat query
async function askZoneWise(question: string) {
  const res = await fetch(\`\${BASE_URL}/chat\`, {
    method: 'POST',
    headers: {
      Authorization: \`Bearer \${API_KEY}\`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: question }],
      stream: false,
    }),
  })
  return res.json()
}

// Usage
const parcel = await getParcel('2412345')
console.log('Zoning:', parcel.zoning)

const answer = await askZoneWise('What can I build on RU-1-9 land?')
console.log(answer.content)`} />
          </Section>

          {/* Error Codes */}
          <Section id="errors" title="Error Codes">
            <div className="space-y-3">
              {[
                { code: '400', label: 'Bad Request', desc: 'Missing or invalid parameters. Check the request body.' },
                { code: '401', label: 'Unauthorized', desc: 'API key missing or invalid. Include a valid Bearer token.' },
                { code: '403', label: 'Forbidden', desc: 'Feature not available on your current plan. Upgrade to access.' },
                { code: '404', label: 'Not Found', desc: 'Parcel or resource does not exist in the database.' },
                { code: '429', label: 'Rate Limited', desc: 'Too many requests. Check Retry-After header and back off.' },
                { code: '500', label: 'Server Error', desc: 'Internal error. Retry after a short delay. Contact support if persistent.' },
              ].map(err => (
                <div key={err.code} className="flex items-start gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <code className={`text-sm font-mono font-bold shrink-0 ${
                    err.code.startsWith('4') ? 'text-amber-400' : 'text-red-400'
                  }`}>{err.code}</code>
                  <div>
                    <div className="text-sm font-semibold text-white mb-0.5">{err.label}</div>
                    <div className="text-xs text-slate-400">{err.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* CTA */}
          <div className="mt-12 p-8 bg-[#1E3A5F]/20 border border-[#1E3A5F]/40 rounded-2xl text-center">
            <h3 className="text-xl font-bold text-white mb-2">Ready to integrate?</h3>
            <p className="text-slate-400 text-sm mb-6">Get your API key on the Pro plan. Unlimited requests, full parcel database, AI chat.</p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#F59E0B] text-slate-950 rounded-xl font-bold text-sm hover:brightness-110 transition-all"
            >
              View Pricing — From $39/mo
            </Link>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 text-center">
        <p className="text-xs text-slate-500">
          © 2026 ZoneWise.AI · Everest Capital USA ·{' '}
          <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy</Link> ·{' '}
          <Link href="/terms" className="hover:text-slate-300 transition-colors">Terms</Link> ·{' '}
          <Link href="/help" className="hover:text-slate-300 transition-colors">Help</Link>
        </p>
      </footer>
    </div>
  )
}
