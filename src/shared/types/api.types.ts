import type { EmailDraft, LearnedStyle, Recipient, ScheduleSuggestion, WritingStylePreset } from './domain.types'

// ---------------------------------------------------------------------------
// POST /api/style-profile
// ---------------------------------------------------------------------------

export interface StyleProfileRequest {
  /** Raw text of sent emails, newest first */
  emailSamples: string[]
  userEmail: string
}

export interface StyleProfileResponse {
  learnedStyle: LearnedStyle
}

// ---------------------------------------------------------------------------
// POST /api/analyze
// ---------------------------------------------------------------------------

export interface AnalyzeRequest {
  transcript: string
  participantNames: string[]
  knownEmails: string[]
  userEmail: string
  userTimezone: string
  stylePreset: WritingStylePreset
  /** Included when preset === 'match_my_style' */
  learnedStyle?: LearnedStyle
  crmRecordId: string | null
  requestId: string
}

export interface AnalyzeResponse {
  requestId: string
  email: EmailDraft
  recipients: {
    to: Recipient[]
    cc: Recipient[]
    bcc: Recipient[]
  }
  schedule: ScheduleSuggestion
  metadata: {
    modelVersion: string
    processingMs: number
  }
}

// ---------------------------------------------------------------------------
// Error shape
// ---------------------------------------------------------------------------

export type ApiErrorCode =
  | 'TRANSCRIPT_TOO_SHORT'
  | 'TRANSCRIPT_TOO_LONG'
  | 'AUTH_FAILED'
  | 'RATE_LIMITED'
  | 'MODEL_UNAVAILABLE'
  | 'INTERNAL_ERROR'

export interface ApiError {
  code: ApiErrorCode
  message: string
  retryAfterMs?: number
}

export type Result<T> = { ok: true; data: T } | { ok: false; error: ApiError }
