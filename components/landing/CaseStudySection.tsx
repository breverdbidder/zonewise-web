'use client'

import { motion } from 'framer-motion'

/**
 * Flagship case study — 1581 & 1591 Lakewood Drive NE, Palm Bay FL.
 *
 * This is the page's central argument and the direct answer to competitors whose
 * proof is somebody else's project. Every figure here is a recorded transaction
 * from Everest Capital USA's own book — founder's capital, founder's risk.
 *
 * Framing rule: this is an ENTITLEMENT AND DEVELOPMENT story. The acquisition
 * method is deliberately incidental — zoning judgment is the subject.
 */

const TIMELINE = [
  {
    step: '01',
    label: 'The dirt',
    body: 'Two adjacent vacant lots in Palm Bay. Nothing on them. Nothing obvious about them.',
    figure: '$20,100',
    figureLabel: 'Acquisition basis',
  },
  {
    step: '02',
    label: 'What the zoning actually allowed',
    body: 'Read together rather than as two separate single-family lots, the parcels supported a materially denser use than either could carry alone.',
    figure: '16 units',
    figureLabel: 'Multifamily capacity identified',
  },
  {
    step: '03',
    label: 'The entitlement',
    body: 'Title cleared, then engineered through entitlement to a development-ready multifamily pad.',
    figure: '4 yr 3 mo',
    figureLabel: 'Raw dirt to entitled land',
  },
  {
    step: '04',
    label: 'The outcome',
    body: 'Sold as a 16-unit entitled multifamily development pad, with seller financing held directly.',
    figure: '$320,000',
    figureLabel: 'Disposition',
  },
]

export function CaseStudySection() {
  return (
    <section className="relative overflow-hidden border-y border-[rgb(var(--zw-border2)/0.4)] bg-[rgb(var(--zw-page))] pt-20 pb-14 sm:pt-28 sm:pb-16">
      {/* Ambient navy wash — CSS only, no WebGL */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 20% 0%, rgb(var(--zw-border2) / 0.55) 0%, transparent 65%)',
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <div
            className="mb-4 font-mono text-xs uppercase tracking-[0.14em] text-[rgb(var(--zw-brand))]"
          >
            Case study · Palm Bay, Florida
          </div>

          <h2 className="max-w-3xl text-3xl font-bold leading-[1.1] tracking-tight text-[rgb(var(--zw-ink))] sm:text-5xl">
            $20,100 of vacant dirt.
            <br />
            <span className="text-[rgb(var(--zw-brand))]">A 16-unit entitlement nobody else read.</span>
          </h2>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-[rgb(var(--zw-ink2))] sm:text-lg">
            Most feasibility software is sold on somebody else&apos;s project. This one was
            bought, entitled, and sold with our own capital — the same judgment the platform
            now runs automatically, on any parcel in Florida.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TIMELINE.map((t, i) => (
            <motion.div
              key={t.step}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.09 }}
              className="flex flex-col rounded-lg border p-6"
              style={{
                background: 'rgb(var(--zw-card))',
                borderColor: i === 3 ? 'rgb(var(--zw-brand) / 0.35)' : 'rgb(var(--zw-border2) / 0.5)',
                boxShadow:
                  i === 3
                    ? 'rgb(var(--zw-brand) / 0.06) 0px 0px 30px, rgba(0,0,0,0.3) 0px 10px 30px -10px'
                    : 'rgba(0,0,0,0.3) 0px 10px 30px -10px',
              }}
            >
              <div className="mb-3 font-mono text-[11px] tracking-[0.05em] text-[rgb(var(--zw-ink2))]">
                {t.step}
              </div>
              <div className="mb-2 text-sm font-semibold text-[rgb(var(--zw-ink))]">{t.label}</div>
              <p className="mb-6 flex-1 text-[13px] leading-relaxed text-[rgb(var(--zw-ink2))]">
                {t.body}
              </p>
              <div
                className="font-mono text-2xl font-semibold tabular-nums"
                style={{ color: i === 3 ? '#10B981' : 'rgb(var(--zw-brand))' }}
              >
                {t.figure}
              </div>
              <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.06em] text-[rgb(var(--zw-ink2))]">
                {t.figureLabel}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Provenance line */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[rgb(var(--zw-border2))] pt-6 font-mono text-xs text-[rgb(var(--zw-ink2))]"
        >
          <span>1581 &amp; 1591 Lakewood Drive NE, Palm Bay, FL</span>
          <span className="text-[rgb(var(--zw-ink))]">·</span>
          <span>Parcel 28-37-22-01-5-5</span>
          <span className="text-[rgb(var(--zw-ink))]">·</span>
          <span>Recorded, Brevard County Clerk</span>
          <span className="text-[rgb(var(--zw-ink))]">·</span>
          <a
            href="https://everestcapitalusa.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block py-2 text-[rgb(var(--zw-brand))] transition-colors hover:text-[#FBBF24]"
          >
            Full track record →
          </a>
        </motion.div>
      </div>
    </section>
  )
}
