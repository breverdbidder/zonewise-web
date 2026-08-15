'use client'

import { motion } from 'framer-motion'

/**
 * Two ICPs, stated plainly rather than blended into one vague pitch.
 * Developers ask "what can I build?" Investors ask "should I buy this at all?"
 * ZoneWise answers both, which is the category wedge.
 */

const AUDIENCES = [
  {
    tag: 'For developers & builders',
    title: 'Know the envelope before you option the land.',
    points: [
      'Permitted uses, setbacks, height and FAR resolved per parcel — cited to the governing code, not summarized.',
      'Buildable envelope and unit yield, with scenarios you can compare side by side.',
      'Utility service tier surfaced up front — central water and sewer change the legal envelope and the septic bedroom cap.',
      'Feasibility output your architect can start from instead of recreate.',
    ],
  },
  {
    tag: 'For investors & capital allocators',
    title: 'Underwrite the site, not the story.',
    points: [
      'Highest-and-best-use analysis grounded in what the parcel can legally carry.',
      'Every figure traceable to its source — county records, appraiser data, and code citations.',
      'Risk surfaced before committee, not discovered during diligence.',
      'Exportable analysis that stands up inside an IC memo.',
    ],
  },
]

export function AudienceSection() {
  return (
    <section className="border-t border-slate-800 bg-[#020617] py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="mb-14 max-w-2xl"
        >
          <div className="mb-4 font-mono text-xs uppercase tracking-[0.14em] text-[#F59E0B]">
            One platform, two questions
          </div>
          <h2 className="text-3xl font-bold leading-[1.12] tracking-tight text-white sm:text-4xl">
            &ldquo;What can I build here?&rdquo; is only half the decision.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-slate-400">
            Site-planning tools answer the first question once you have already committed to
            the parcel. ZoneWise answers it alongside the one that comes first — whether the
            site is worth acquiring at all.
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-2">
          {AUDIENCES.map((a, i) => (
            <motion.div
              key={a.tag}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, delay: i * 0.12 }}
              className="rounded-lg border p-8"
              style={{ background: '#0d1829', borderColor: 'rgba(30,58,95,0.5)' }}
            >
              <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.1em] text-slate-500">
                {a.tag}
              </div>
              <h3 className="mb-6 text-xl font-semibold leading-snug text-white sm:text-2xl">
                {a.title}
              </h3>
              <ul className="space-y-4">
                {a.points.map((p) => (
                  <li key={p} className="flex gap-3 text-[14px] leading-relaxed text-slate-400">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[#F59E0B]" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
