import type { AnalyzeRequest, AnalyzeResponse, ApiError, StyleProfileRequest, StyleProfileResponse } from './api.types'
import type { LearnedStyle, Recipient, TranscriptContext } from './domain.types'

export interface SendEmailPayload {
  to: Recipient[]
  cc: Recipient[]
  bcc: Recipient[]
  subject: string
  bodyHtml: string
  bodyPlaintext: string
}

export interface CreateEventPayload {
  title: string
  description: string
  start: string  // ISO8601
  end: string    // ISO8601
  attendeeEmails: string[]
}

export type ExtensionMessage =
  | { type: 'PANEL_OPEN';               payload: TranscriptContext }
  | { type: 'SESSION_READY';            payload: { userEmail: string } }
  | { type: 'AUTH_ERROR';               payload: { message: string } }
  | { type: 'GENERATE_ALL';             payload: AnalyzeRequest }
  | { type: 'GENERATE_ALL_RESULT';      payload: AnalyzeResponse }
  | { type: 'GENERATE_ALL_ERROR';       payload: ApiError }
  | { type: 'BUILD_STYLE_PROFILE';      payload: StyleProfileRequest }
  | { type: 'STYLE_PROFILE_RESULT';     payload: StyleProfileResponse }
  | { type: 'STYLE_PROFILE_ERROR';      payload: ApiError }
  | { type: 'FETCH_SENT_EMAILS';        payload: { maxResults: number } }
  | { type: 'SENT_EMAILS_RESULT';       payload: { samples: string[] } }
  | { type: 'SENT_EMAILS_ERROR';        payload: ApiError }
  | { type: 'SEND_EMAIL';               payload: SendEmailPayload }
  | { type: 'EMAIL_SENT';               payload: { messageId: string; threadId: string } }
  | { type: 'EMAIL_SEND_ERROR';         payload: ApiError }
  | { type: 'CREATE_CALENDAR_EVENT';    payload: CreateEventPayload }
  | { type: 'EVENT_CREATED';            payload: { eventId: string; htmlLink: string } }
  | { type: 'EVENT_CREATE_ERROR';       payload: ApiError }
  | { type: 'STORE_LEARNED_STYLE';      payload: LearnedStyle }
  | { type: 'GET_LEARNED_STYLE' }
  | { type: 'LEARNED_STYLE_RESULT';     payload: { learnedStyle: LearnedStyle | null } }

export type MessageType = ExtensionMessage['type']
