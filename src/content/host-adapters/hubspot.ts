import type { TranscriptContext } from '../../shared/types/domain.types'

/**
 * Extracts call transcript context from a HubSpot CRM page.
 * HubSpot uses stable data-test-id and data-selenium-test attributes.
 */
export function extractFromHubSpot(): TranscriptContext | null {
  const transcript = extractTranscript()
  if (!transcript) return null

  return {
    transcript,
    participantNames: extractParticipants(),
    contactEmails:    extractContactEmails(),
    crmRecordId:      extractRecordId(),
    hostType:         'hubspot',
  }
}

function extractTranscript(): string | null {
  const selectors = [
    '[data-test-id="call-transcript-body"]',
    '[data-selenium-test="call-transcript"]',
    '.call-transcript__content',
    // HubSpot Conversations inbox transcript
    '[data-test-id="conversation-transcript"]',
  ]

  for (const sel of selectors) {
    const el = document.querySelector(sel)
    if (el?.textContent?.trim()) return el.textContent.trim()
  }

  return null
}

function extractParticipants(): string[] {
  const names = new Set<string>()

  document.querySelectorAll('[data-test-id="speaker-label"]').forEach((el) => {
    const name = el.textContent?.trim()
    if (name) names.add(name)
  })

  return Array.from(names)
}

function extractContactEmails(): string[] {
  const emails = new Set<string>()

  // HubSpot contact sidebar shows email in a property card
  document.querySelectorAll('[data-property-name="email"] .private-truncated-string__inner').forEach((el) => {
    const text = el.textContent?.trim().toLowerCase()
    if (text?.includes('@')) emails.add(text)
  })

  // Generic mailto fallback
  document.querySelectorAll('a[href^="mailto:"]').forEach((a) => {
    const email = (a as HTMLAnchorElement).href.replace('mailto:', '').split('?')[0]
    if (email) emails.add(email.toLowerCase())
  })

  return Array.from(emails)
}

function extractRecordId(): string | null {
  // HubSpot record IDs are numeric in the URL: /contacts/12345678/contact/...
  const match = window.location.pathname.match(/\/(contacts|companies|deals)\/(\d+)/)
  return match?.[2] ?? null
}
