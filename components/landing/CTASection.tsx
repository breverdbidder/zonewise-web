import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function CTASection() {
  return (
    <section className="bg-[#1B2737]/20 border-t border-[#1B2737]/40 py-20">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Ready to find your next deal?
        </h2>
        <p className="text-slate-400 mb-8 text-lg">
          Zoning intelligence and feasibility analysis across all 67 Florida counties — with a platform built to run in all 50 states.
        </p>
        <Button
          size="lg"
          className="bg-[#1A90FF] text-slate-900 hover:bg-[#005EB8] font-semibold px-10"
          asChild
        >
          <Link href="/sign-up">Get started free</Link>
        </Button>
      </div>
    </section>
  )
}
