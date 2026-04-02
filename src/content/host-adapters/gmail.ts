import type { TranscriptContext } from '../../shared/types/domain.types'

/**
 * Gmail adapter — does not extract transcripts.
 * Returns a minimal context so the panel can be triggered manually
 * when the ISR is composing a follow-up directly in Gmail.
 */
export function extractFromGmail(): TranscriptContext | null {
  // Only activate when a compose window is open
  const composeWindow = document.querySelector('[role="dialog"][aria-label*="New Message"], [role="dialog"][aria-label*="New message"]')
  if (!composeWindow) return null

  return {
    transcript:       '',  // User must paste or it comes from a stored session
    participantNames: [],
    contactEmails:    extractRecipientsFromCompose(composeWindow),
    crmRecordId:      null,
    hostType:         'gmail',
  }
}

function extractRecipientsFromCompose(composeWindow: Element): string[] {
  const emails = new Set<string>()

  // Gmail recipient chips have a data-hovercard-id attribute with the email
  composeWindow.querySelectorAll('[data-hovercard-id]').forEach((chip) => {
    const email = (chip as HTMLElement).dataset['hovercardId']
    if (email?.includes('@')) emails.add(email.toLowerCase())
  })

  return Array.from(emails)
}

/**
 * Observe for compose windows opening (Gmail is a SPA — compose dialogs
 * are created dynamically).
 */
export function watchForComposeWindow(onOpen: () => void): MutationObserver {
  const observer = new MutationObserver(() => {
    const compose = document.querySelector(
      '[role="dialog"][aria-label*="New Message"], [role="dialog"][aria-label*="New message"]'
    )
    if (compose) onOpen()
  })

  observer.observe(document.body, { childList: true, subtree: true })
  return observer
}
