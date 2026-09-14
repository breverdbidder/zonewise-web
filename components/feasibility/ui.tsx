'use client'

import { COLORS } from '@/lib/feasibility/constants'

interface BadgeProps {
  text: string
  color?: string
}

export function Badge({ text, color = COLORS.brand }: BadgeProps) {
  return (
    <span
      className="text-[10px] font-semibold ml-2 rounded-full px-2 py-0.5"
      style={{ background: color + '15', color }}
    >
      {text}
    </span>
  )
}

interface CardProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export function Card({ children, className = '', style }: CardProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 overflow-hidden ${className}`}
      style={style}
    >
      {children}
    </div>
  )
}

export function SectionLabel({ text }: { text: string }) {
  return (
    <div className="text-[10px] text-[rgb(var(--zw-ink2))] uppercase tracking-wider mb-1.5 font-semibold">
      {text}
    </div>
  )
}

interface KVRowProps {
  label: string
  value: string
  bold?: boolean
  mono?: boolean
}

export function KVRow({ label, value, bold, mono }: KVRowProps) {
  return (
    <div className="flex justify-between py-1 text-[13px] border-b border-slate-50">
      <span className="text-[rgb(var(--zw-ink2))]">{label}</span>
      <span
        className={`${bold ? 'font-bold' : 'font-medium'} text-[rgb(var(--zw-ink))]`}
        style={mono ? { fontFamily: "'JetBrains Mono', monospace" } : undefined}
      >
        {value}
      </span>
    </div>
  )
}
