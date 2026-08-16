'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { hasLeadCookie, captureLead, isValidEmail } from '@/lib/gate/client'

/**
 * Shared anonymous email-capture gate for /massing, /floorplan, /proforma.
 * One capture (LEAD_GATE_COOKIE, set server-side by /api/floorplan/lead)
 * unlocks all three tools for the session — this hook just reflects that
 * cookie and queues whatever action triggered the gate so it can resume
 * immediately after a successful submit.
 */
export function useLeadGate() {
  const [unlocked, setUnlocked] = useState(false)
  const [showGate, setShowGate] = useState(false)
  const [gateMessage, setGateMessage] = useState<string | null>(null)
  const pendingSourceRef = useRef<string>('')
  const pendingActionRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    setUnlocked(hasLeadCookie())
  }, [])

  const requireGate = useCallback(
    (action: (() => void) | null, source: string, message?: string) => {
      if (unlocked) {
        action?.()
        return
      }
      pendingActionRef.current = action
      pendingSourceRef.current = source
      setGateMessage(message ?? null)
      setShowGate(true)
    },
    [unlocked]
  )

  const submitGate = useCallback(async (email: string) => {
    if (!isValidEmail(email)) return false
    await captureLead(email, pendingSourceRef.current || 'unknown_gate')
    // Unlock regardless of write outcome — the visitor already gave us the
    // email; don't block them on a lead-write hiccup.
    setUnlocked(true)
    setShowGate(false)
    setGateMessage(null)
    const action = pendingActionRef.current
    pendingActionRef.current = null
    action?.()
    return true
  }, [])

  const cancelGate = useCallback(() => {
    setShowGate(false)
    setGateMessage(null)
    pendingActionRef.current = null
  }, [])

  // For inline gates rendered in place of locked content (e.g. Pro Forma's
  // Formula Transparency section) rather than triggered by requireGate from
  // a button click — same capture + unlock, explicit source, no pending action.
  const unlockWithSource = useCallback(async (email: string, source: string) => {
    if (!isValidEmail(email)) return false
    await captureLead(email, source)
    setUnlocked(true)
    setShowGate(false)
    setGateMessage(null)
    return true
  }, [])

  return { unlocked, showGate, gateMessage, requireGate, submitGate, cancelGate, unlockWithSource }
}
