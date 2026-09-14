import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function CTASection() {
  return (
    <section className="bg-[rgb(var(--zw-elev)/0.2)] border-t border-[rgb(var(--zw-border2)/0.4)] py-20">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-[rgb(var(--zw-ink))] mb-4">
          Ready to find your next deal?
        </h2>
        <p className="text-[rgb(var(--zw-ink2))] mb-8 text-lg">
          Zoning intelligence and feasibility analysis across all 67 Florida counties — with a platform built to run in all 50 states.
        </p>
        <Button
          size="lg"
          className="bg-[rgb(var(--zw-brand))] text-[rgb(var(--zw-ink))] hover:bg-[#005EB8] font-semibold px-10"
          asChild
        >
          <Link href="/sign-up">Get started free</Link>
        </Button>
      </div>
    </section>
  )
}
