import { LandingNavbar } from '@/components/landing/LandingNavbar'
import { HeroCinematicSection } from '@/components/landing/HeroCinematicSection'
import { StatsSection } from '@/components/landing/StatsSection'
import { FeaturesSection } from '@/components/landing/FeaturesSection'
import { CaseStudySection } from '@/components/landing/CaseStudySection'
import { AudienceSection } from '@/components/landing/AudienceSection'
import { OperatorSection } from '@/components/landing/OperatorSection'
import { PricingSection } from '@/components/landing/PricingSection'
import { CTASection } from '@/components/landing/CTASection'
import { LandingFooter } from '@/components/landing/LandingFooter'

export const dynamic = 'force-dynamic'

export default function Home() {
  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <LandingNavbar />
      <HeroCinematicSection />
      <StatsSection />
      <FeaturesSection />
      <CaseStudySection />
      <AudienceSection />
      <OperatorSection />
      <PricingSection />
      <CTASection />
      <LandingFooter />
    </div>
  )
}
