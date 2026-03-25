// ─── LLM Resilience: Circuit Breaker + Timeout + Fallback ────────────────────
// Wraps Gemini and DeepSeek calls with production-grade failure isolation.

export type LLMProvider = 'gemini' | 'deepseek'

interface ProviderState {
  failures: number
  cooldownUntil: number
  lastError: string
}

// ─── CircuitBreaker ───────────────────────────────────────────────────────────

export class CircuitBreaker {
  private readonly maxFailures: number
  private readonly cooldownMs: number
  private readonly state: Record<LLMProvider, ProviderState>

  constructor(opts: { maxFailures?: number; cooldownMs?: number } = {}) {
    this.maxFailures = opts.maxFailures ?? 3
    this.cooldownMs = opts.cooldownMs ?? 300_000 // 5 min
    this.state = {
      gemini: { failures: 0, cooldownUntil: 0, lastError: '' },
      deepseek: { failures: 0, cooldownUntil: 0, lastError: '' },
    }
  }

  isOpen(provider: LLMProvider): boolean {
    const s = this.state[provider]
    return s.failures >= this.maxFailures && Date.now() < s.cooldownUntil
  }

  recordFailure(provider: LLMProvider, error: string): void {
    const s = this.state[provider]
    s.failures++
    s.lastError = error.slice(0, 200)
    if (s.failures >= this.maxFailures) {
      s.cooldownUntil = Date.now() + this.cooldownMs
    }
  }

  recordSuccess(provider: LLMProvider): void {
    const s = this.state[provider]
    s.failures = 0
    s.cooldownUntil = 0
    s.lastError = ''
  }

  getStatus(): Record<LLMProvider, { isOpen: boolean; failures: number; cooldownUntil: number; lastError: string }> {
    const result = {} as Record<LLMProvider, { isOpen: boolean; failures: number; cooldownUntil: number; lastError: string }>
    for (const provider of ['gemini', 'deepseek'] as LLMProvider[]) {
      const s = this.state[provider]
      result[provider] = {
        isOpen: this.isOpen(provider),
        failures: s.failures,
        cooldownUntil: s.cooldownUntil,
        lastError: s.lastError,
      }
    }
    return result
  }
}

// Module-level singleton so circuit state persists across requests within one process
export const circuitBreaker = new CircuitBreaker()

// ─── Payload types ────────────────────────────────────────────────────────────

export interface LLMPayload {
  systemPrompt: string
  userContent: string
}

export interface LLMResult {
  text: string
  provider: LLMProvider | 'db_fallback'
  latencyMs: number
  tokensIn?: number
  tokensOut?: number
}

// ─── ResilientLLMClient ───────────────────────────────────────────────────────

export class ResilientLLMClient {
  private readonly cb: CircuitBreaker

  constructor(cb: CircuitBreaker = circuitBreaker) {
    this.cb = cb
  }

  // Single provider call with AbortController timeout
  async callWithTimeout(
    provider: LLMProvider,
    payload: LLMPayload,
    timeoutMs: number,
  ): Promise<string> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      if (provider === 'gemini') {
        return await this._callGemini(payload, controller.signal)
      } else {
        return await this._callDeepSeek(payload, controller.signal)
      }
    } finally {
      clearTimeout(timer)
    }
  }

  // Primary entry point: Gemini (8s) → DeepSeek (12s) → DB-only fallback
  async callWithFallback(
    payload: LLMPayload,
    dbFallbackFn: () => string,
  ): Promise<LLMResult> {
    const providers: { name: LLMProvider; timeoutMs: number }[] = [
      { name: 'gemini', timeoutMs: 8_000 },
      { name: 'deepseek', timeoutMs: 12_000 },
    ]

    for (const { name, timeoutMs } of providers) {
      if (this.cb.isOpen(name)) {
        console.log(`[llm-resilience] Circuit open for ${name}, skipping`)
        continue
      }

      const start = Date.now()
      try {
        const text = await this.callWithTimeout(name, payload, timeoutMs)
        this.cb.recordSuccess(name)
        return {
          text,
          provider: name,
          latencyMs: Date.now() - start,
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.log(`[llm-resilience] ${name} failed (${msg.slice(0, 100)}), trying next`)
        this.cb.recordFailure(name, msg)
      }
    }

    // All providers failed — return DB-only response
    console.log('[llm-resilience] All LLM providers failed, using DB-only fallback')
    return {
      text: dbFallbackFn(),
      provider: 'db_fallback',
      latencyMs: 0,
    }
  }

  // ─── Internal provider implementations ──────────────────────────────────────

  private async _callGemini(payload: LLMPayload, signal: AbortSignal): Promise<string> {
    const key = process.env.GEMINI_API_KEY
    if (!key) throw new Error('GEMINI_API_KEY not configured')

    const fullPrompt = payload.systemPrompt + '\n\n' + payload.userContent

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
        }),
        signal,
      },
    )

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Gemini ${res.status}: ${err.slice(0, 200)}`)
    }

    const json = await res.json()
    const text: string | undefined = json.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) throw new Error('Gemini returned empty response')
    return text
  }

  private async _callDeepSeek(payload: LLMPayload, signal: AbortSignal): Promise<string> {
    const key = process.env.DEEPSEEK_API_KEY
    if (!key) throw new Error('DEEPSEEK_API_KEY not configured')

    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: payload.systemPrompt },
          { role: 'user', content: payload.userContent },
        ],
        temperature: 0.3,
        max_tokens: 1024,
      }),
      signal,
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`DeepSeek ${res.status}: ${err.slice(0, 200)}`)
    }

    const json = await res.json()
    const text: string | undefined = json.choices?.[0]?.message?.content
    if (!text) throw new Error('DeepSeek returned empty response')
    return text
  }
}

// Module-level singleton
export const resilientLLM = new ResilientLLMClient(circuitBreaker)
