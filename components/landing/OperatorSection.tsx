'use client'

import { motion } from 'framer-motion'

/**
 * The moat. Competitors' credibility is customer logos; ours is the founder's own
 * closed book. Everything stated here is verifiable at everestcapitalusa.com.
 *
 * Deliberately unquantified: "hundreds of closings" is true and survives diligence.
 * A specific count would invite a request to produce the list.
 */

const CREDENTIALS = [
  {
    k: '20 years',
    v: 'Buying and developing distressed Florida real estate — at the courthouse and online.',
  },
  {
    k: 'Hundreds',
    v: 'Closed acquisitions. The projects published on our firm site are a fraction of the book.',
  },
  {
    k: 'Licensed GC',
    v: 'Vertically integrated. Permits to certificate of occupancy, in-house — not subcontracted out.',
  },
  {
    k: '14 claims',
    v: 'Provisional patent covering the underlying analysis method.',
  },
]

export function OperatorSection() {
  return (
    <section className="bg-[#020617] py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-14 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
          {/* Argument */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-4 font-mono text-xs uppercase tracking-[0.14em] text-[#F59E0B]">
              Why this exists
            </div>

            <h2 className="text-3xl font-bold leading-[1.12] tracking-tight text-white sm:text-4xl">
              Built by the developer,
              <br />
              not sold to him.
            </h2>

            <div className="mt-6 space-y-5 text-base leading-relaxed text-slate-400">
              <p>
                Feasibility software is usually written by software companies who have never
                carried a site. ZoneWise.AI was built by an operator who spent two decades
                buying dirt, reading zoning, entitling parcels, and building on them — with
                his own capital at risk on every one.
              </p>
              <p>
                That matters most where it is least visible. Our construction cost assumptions
                come from invoices actually paid, through an in-house licensed general
                contractor. Our risk flags exist because those risks once cost us money. The
                platform is the codification of a book of work, not a model trained on
                listings.
              </p>
              <p className="text-slate-300">
                Everest Capital USA still runs on it every week. If it stops being right, we
                are the first ones to find out.
              </p>
            </div>

            <a
              href="https://everestcapitalusa.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2 rounded-md border px-5 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:border-[#F59E0B]/50 hover:text-white"
              style={{ borderColor: '#1E293B' }}
            >
              See the track record
              <span aria-hidden="true">→</span>
            </a>
          </motion.div>

          {/* Credentials */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="grid grid-cols-1 gap-px overflow-hidden rounded-lg sm:grid-cols-2 lg:grid-cols-1"
            style={{ background: '#1E293B' }}
          >
            {CREDENTIALS.map((c) => (
              <div key={c.k} className="p-6" style={{ background: '#0d1829' }}>
                <div className="font-mono text-xl font-semibold tabular-nums text-[#F59E0B]">
                  {c.k}
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-400">{c.v}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
