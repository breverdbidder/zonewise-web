// ─── LLM Metrics Logger ───────────────────────────────────────────────────────
// Fire-and-forget logging to llm_metrics table. Never blocks the response path.

import { createAnonClient } from '@/lib/supabase/server'
import type { LLMProvider } from '@/lib/llm-resilience'

export interface LLMCallLog {
  provider: LLMProvider | 'db_fallback'
  model: string
  tokensIn?: number
  tokensOut?: number
  latencyMs: number
  success: boolean
  route: string
  error?: string
}

// Approximate cost per 1M tokens (USD) — update when pricing changes
const COST_PER_1M: Record<string, number> = {
  'gemini-2.5-flash': 0,      // free tier
  'deepseek-chat': 0.28,
  'db_fallback': 0,
}

function estimateCost(model: string, tokensIn = 0, tokensOut = 0): number {
  const rate = COST_PER_1M[model] ?? 0
  return ((tokensIn + tokensOut) / 1_000_000) * rate
}

export async function logLLMCall(log: LLMCallLog): Promise<void> {
  try {
    const supabase = createAnonClient()
    const model = log.provider === 'gemini'
      ? 'gemini-2.5-flash'
      : log.provider === 'deepseek'
        ? 'deepseek-chat'
        : 'db_fallback'

    await supabase.from('llm_metrics').insert({
      provider: log.provider,
      model,
      tokens_in: log.tokensIn ?? null,
      tokens_out: log.tokensOut ?? null,
      latency_ms: log.latencyMs,
      success: log.success,
      route: log.route,
      error_message: log.error ?? null,
      cost_estimate: estimateCost(model, log.tokensIn, log.tokensOut),
    })
  } catch (err) {
    // Non-fatal — metrics must never block the response
    console.warn('[llm-metrics] Failed to log:', err instanceof Error ? err.message : err)
  }
}
