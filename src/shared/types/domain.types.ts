export interface TranscriptContext {
  transcript: string
  participantNames: string[]
  contactEmails: string[]
  crmRecordId: string | null
  hostType: 'salesforce' | 'hubspot' | 'gmail' | 'unknown'
}

export interface Recipient {
  email: string
  name: string | null
  role: 'to' | 'cc' | 'bcc'
  /** Where this recipient was detected */
  source: 'transcript' | 'crm' | 'inferred'
}

export interface EmailDraft {
  subject: string
  bodyHtml: string
  bodyPlaintext: string
  confidence: number
}

export interface ScheduleSuggestion {
  suggestedStart: string  // ISO8601 with tz offset
  suggestedEnd: string
  title: string
  description: string
  durationMinutes: number
  reasoning: string
  confidence: number
}

export type WritingStylePreset =
  | 'match_my_style'
  | 'formal'
  | 'casual'
  | 'concise'
  | 'detailed'

export interface StyleProfile {
  preset: WritingStylePreset
  /** Only populated when preset === 'match_my_style' */
  learnedStyle?: LearnedStyle
}

export interface LearnedStyle {
  /** Short human-readable summary of detected patterns */
  summary: string
  /** Average sentence length bucket */
  sentenceLength: 'short' | 'medium' | 'long'
  /** Detected greeting/sign-off patterns */
  greeting: string | null
  signOff: string | null
  /** Common filler phrases to include */
  commonPhrases: string[]
  /** ISO8601 timestamp the profile was last built */
  builtAt: string
  /** Number of emails analysed */
  sampleSize: number
}

export type EmailMode = 'view' | 'edit'
export type ScheduleMode = 'view' | 'edit'
export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error'
export type SendStatus = 'idle' | 'sending' | 'sent' | 'error'
export type EventStatus = 'idle' | 'creating' | 'created' | 'declined' | 'error'
