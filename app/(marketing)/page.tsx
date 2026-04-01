import { LandingNavbar } from '@/components/landing/LandingNavbar'
import { HeroSection } from '@/components/landing/HeroSection'
import { StatsSection } from '@/components/landing/StatsSection'
import { FeaturesSection } from '@/components/landing/FeaturesSection'
import { PricingSection } from '@/components/landing/PricingSection'
import { CTASection } from '@/components/landing/CTASection'
import { LandingFooter } from '@/components/landing/LandingFooter'

export const dynamic = 'force-dynamic'

export default function Home() {
  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <LandingNavbar />
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <PricingSection />
      <CTASection />
      <LandingFooter />
    </div>
  )
}
