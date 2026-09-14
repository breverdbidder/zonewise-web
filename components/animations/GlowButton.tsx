'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { track } from '@/lib/posthog'

interface GlowButtonProps {
  href: string
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline'
  className?: string
  external?: boolean
}

export default function GlowButton({
  href,
  children,
  variant = 'primary',
  className = '',
  external = false,
}: GlowButtonProps) {
  const baseClasses = 'relative inline-flex items-center gap-2 px-8 py-4 rounded-xl text-lg font-semibold overflow-hidden transition-colors'

  const variantClasses = {
    primary: 'bg-[rgb(var(--zw-brand))] text-[rgb(var(--zw-brand-ink))] hover:bg-[#005EB8]',
    secondary: 'bg-[rgb(var(--zw-elev))] text-[rgb(var(--zw-ink))] hover:bg-[rgb(var(--zw-elev))]',
    outline: 'border-2 border-[rgb(var(--zw-border2))] text-[rgb(var(--zw-ink2))] hover:bg-[rgb(var(--zw-elev))] hover:text-[rgb(var(--zw-ink))]',
  }

  const glowColor = variant === 'primary'
    ? 'rgba(245, 158, 11, 0.4)'
    : 'rgba(30, 58, 95, 0.4)'

  const Component = external ? 'a' : Link

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      className="inline-block"
    >
      <Component
        href={href}
        onClick={() => track({ name: 'signup_clicked', properties: { location: `hero_${variant ?? 'primary'}` } })}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
        style={{
          transition: 'box-shadow 0.3s ease',
        }}
        onMouseEnter={(e: any) => {
          e.currentTarget.style.boxShadow = `0 0 24px ${glowColor}, 0 0 48px ${glowColor.replace('0.4', '0.15')}`
        }}
        onMouseLeave={(e: any) => {
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        {/* Shimmer sweep */}
        <motion.span
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)',
            transform: 'skewX(-20deg)',
          }}
          initial={{ x: '-150%' }}
          whileHover={{ x: '150%' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
        <span className="relative z-10 flex items-center gap-2">{children}</span>
      </Component>
    </motion.div>
  )
}
