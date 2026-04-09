// app/(marketing)/competitors/layout.tsx
// Battle Cards Sprint S0a — shared layout for all /competitors/* routes
// Minimal wrapper — page component supplies its own hero + body.

import type { ReactNode } from 'react'

export default function CompetitorsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
