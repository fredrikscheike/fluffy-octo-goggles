// ── Domain types (mirrors the extension's shared/types) ──────────────────────

export type WritingStylePreset =
  | 'match_my_style'
  | 'formal'
  | 'casual'
  | 'concise'
  | 'detailed'

export interface LearnedStyle {
  summary: string
  sentenceLength: 'short' | 'medium' | 'long'
  greeting: string | null
  signOff: string | null
  commonPhrases: string[]
  builtAt: string
  sampleSize: number
}

export interface Recipient {
  email: string
  name: string | null
  role: 'to' | 'cc' | 'bcc'
  source: 'transcript' | 'crm' | 'inferred'
}

// ── Request / Response shapes ─────────────────────────────────────────────────

export interface AnalyzeRequest {
  transcript: string
  participantNames: string[]
  knownEmails: string[]
  userEmail: string
  userTimezone: string
  stylePreset: WritingStylePreset
  learnedStyle?: LearnedStyle
  crmRecordId: string | null
  requestId: string
}

export interface AnalyzeResponse {
  requestId: string
  email: {
    subject: string
    bodyHtml: string
    bodyPlaintext: string
    confidence: number
  }
  recipients: {
    to: Recipient[]
    cc: Recipient[]
    bcc: Recipient[]
  }
  schedule: {
    suggestedStart: string
    suggestedEnd: string
    title: string
    description: string
    durationMinutes: number
    reasoning: string
    confidence: number
  }
  metadata: {
    modelVersion: string
    processingMs: number
  }
}

export interface StyleProfileRequest {
  emailSamples: string[]
  userEmail: string
}

export interface StyleProfileResponse {
  learnedStyle: LearnedStyle
}

export interface ApiError {
  code: string
  message: string
  retryAfterMs?: number
}
