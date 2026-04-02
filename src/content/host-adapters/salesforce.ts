import type { TranscriptContext } from '../../shared/types/domain.types'

/**
 * Attempts to extract call transcript context from a Salesforce Lightning page.
 *
 * Salesforce hash-suffixes its generated CSS classes, so we rely on:
 *  - stable aria roles and data attributes first
 *  - text-content heuristics as fallback
 */
export function extractFromSalesforce(): TranscriptContext | null {
  // Try to find an open call log / activity record
  const transcript = extractTranscript()
  if (!transcript) return null

  return {
    transcript,
    participantNames: extractParticipants(),
    contactEmails:    extractContactEmails(),
    crmRecordId:      extractRecordId(),
    hostType:         'salesforce',
  }
}

function extractTranscript(): string | null {
  // Salesforce Calls / Einstein Conversation Insights transcript container
  const selectors = [
    '[data-component-id="forceChatterFeed"] [data-aura-class*="transcript"]',
    'article[data-aura-class*="callSummary"]',
    '[role="main"] textarea[name*="Description"]',
    // Voice Call record transcript field
    'records-record-layout-item[field-label*="Transcript"] .slds-form-element__static',
  ]

  for (const sel of selectors) {
    const el = document.querySelector(sel)
    if (el?.textContent?.trim()) return el.textContent.trim()
  }

  // Fallback: look for a <section> or <div> that contains large blocks of
  // alternating speaker-tagged text (e.g. "John: ...\nJane: ...")
  const candidates = Array.from(document.querySelectorAll('div, section, article'))
  for (const el of candidates) {
    const text = (el as HTMLElement).innerText ?? ''
    if (text.length > 500 && /\w+:\s.{20,}/m.test(text)) {
      return text.trim()
    }
  }

  return null
}

function extractParticipants(): string[] {
  const names = new Set<string>()

  // Einstein Conversation Insights adds participant chips
  document.querySelectorAll('[data-aura-class*="participant"] .participant-name').forEach((el) => {
    const name = el.textContent?.trim()
    if (name) names.add(name)
  })

  // Fallback: pull speaker labels from transcript-style "Name: text" lines
  const mainText = document.body.innerText
  const speakerMatches = mainText.matchAll(/^([A-Z][a-z]+(?: [A-Z][a-z]+)?):\s/gm)
  for (const m of speakerMatches) {
    names.add(m[1])
  }

  return Array.from(names)
}

function extractContactEmails(): string[] {
  const emails = new Set<string>()
  const links = document.querySelectorAll('a[href^="mailto:"]')
  links.forEach((a) => {
    const email = (a as HTMLAnchorElement).href.replace('mailto:', '').split('?')[0]
    if (email) emails.add(email.toLowerCase())
  })
  return Array.from(emails)
}

function extractRecordId(): string | null {
  // Salesforce record IDs are 15 or 18 char alphanumeric, present in the URL
  const match = window.location.pathname.match(/\/([a-zA-Z0-9]{15,18})(?:\/|$)/)
  return match?.[1] ?? null
}
