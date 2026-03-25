import { z } from 'zod'

export const parcelIdSchema = z
  .string()
  .min(1)
  .max(30)
  .regex(/^[A-Za-z0-9._\- ]+$/, 'Invalid parcel ID format')

export const addressSchema = z.string().min(3).max(200).trim()

export const bboxSchema = z.object({
  west:  z.number().finite(),
  south: z.number().finite(),
  east:  z.number().finite(),
  north: z.number().finite(),
})

export const chatQuerySchema = z.string().min(1).max(500).trim()

// Prompt injection patterns to strip from chat input
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+(instructions?|prompts?)/gi,
  /you\s+are\s+now\s+/gi,
  /system\s*:/gi,
  /<<SYS>>/gi,
  /<s>\s*\[INST\]/gi,
  /\[\/INST\]/gi,
]

export function sanitizeChatMessage(message: string): string {
  let sanitized = message
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(sanitized)) {
      console.warn('[security] Stripped prompt injection attempt:', sanitized.slice(0, 100))
      sanitized = sanitized.replace(pattern, '[removed]')
    }
  }
  return sanitized
}

export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
} as const
