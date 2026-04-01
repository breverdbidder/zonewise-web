import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function CTASection() {
  return (
    <section className="bg-[#1E3A5F]/20 border-t border-[#1E3A5F]/40 py-20">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Ready to find your next deal?
        </h2>
        <p className="text-slate-400 mb-8 text-lg">
          Join Brevard County investors using ZoneWise to underwrite faster and win at auction.
        </p>
        <Button
          size="lg"
          className="bg-[#F59E0B] text-slate-900 hover:bg-[#D97706] font-semibold px-10"
          asChild
        >
          <Link href="/sign-up">Get started free</Link>
        </Button>
      </div>
    </section>
  )
}
