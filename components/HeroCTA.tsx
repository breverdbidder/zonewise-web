'use client'

import { useEffect, useState } from 'react'
import { posthog, track } from '@/lib/posthog'
import { EXPERIMENTS, getHeroCTAVariant, type ExperimentVariant } from '@/lib/experiments'
import { GlowButton } from '@/components/animations'

const { variants } = EXPERIMENTS.hero_cta_variant

export default function HeroCTA() {
  const [variant, setVariant] = useState<ExperimentVariant>('control')

  useEffect(() => {
    // Resolve variant: PostHog flag → cookie → random 50/50
    const resolved = getHeroCTAVariant()
    setVariant(resolved)

    // Track experiment exposure
    posthog.capture('$experiment_started', {
      experiment: EXPERIMENTS.hero_cta_variant.flag,
      variant: resolved,
    })
  }, [])

  const copy = variants[variant]

  function handleCTAClick(buttonText: string) {
    track({
      name: 'cta_clicked',
      properties: {
        variant,
        location: 'hero',
        button_text: buttonText,
      },
    })
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
      <span onClick={() => handleCTAClick(copy.explorer_cta)}>
        <GlowButton href="/explorer" variant="secondary">
          {copy.explorer_cta}
        </GlowButton>
      </span>
      <span onClick={() => handleCTAClick(copy.beta_cta)}>
        <GlowButton href="#beta-signup" variant="outline">
          {copy.beta_cta}
        </GlowButton>
      </span>
      <a href="#how" className="text-zw-navy font-medium flex items-center gap-2 px-8 py-4 rounded-xl hover:bg-slate-50 transition-colors">
        See how it works
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </a>
    </div>
  )
}
