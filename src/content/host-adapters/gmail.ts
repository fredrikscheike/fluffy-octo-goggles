import type { TranscriptContext } from '../../shared/types/domain.types'

// ── Open email extraction ─────────────────────────────────────────────────────

/**
 * Extracts the currently open email thread from the Gmail DOM.
 * Returns null when no email is open (inbox/list view).
 */
export function extractOpenEmail(): TranscriptContext | null {
  // Subject — present in thread view
  const subjectEl = document.querySelector('h2.hP') as HTMLElement | null
  if (!subjectEl) return null

  const subject = subjectEl.textContent?.trim() ?? ''

  // Sender of the most recent message
  const senderEl  = document.querySelector('.gD') as HTMLElement | null
  const senderEmail = senderEl?.getAttribute('email') ?? senderEl?.getAttribute('data-hovercard-id') ?? ''
  const senderName  = senderEl?.getAttribute('name') ?? senderEl?.textContent?.trim() ?? ''

  // All recipient addresses in the thread header chips
  const contactEmails: string[] = []
  document.querySelectorAll('[data-hovercard-id]').forEach((el) => {
    const addr = (el as HTMLElement).getAttribute('data-hovercard-id') ?? ''
    if (addr.includes('@')) contactEmails.push(addr.toLowerCase())
  })
  if (senderEmail) contactEmails.unshift(senderEmail.toLowerCase())
  const uniqueEmails = [...new Set(contactEmails)]

  // Body — prefer the unquoted latest message (.a3s.aiL), fall back to
  // all visible message bodies (.ii.gt). Strip quoted history to keep
  // the transcript focused on the most recent exchange.
  const bodies: string[] = []

  document.querySelectorAll('.ii.gt').forEach((msgEl) => {
    // Each .ii.gt is one message in the thread
    const clone = msgEl.cloneNode(true) as HTMLElement

    // Remove quoted blocks
    clone.querySelectorAll('.gmail_quote, .gmail_extra, blockquote').forEach((q) => q.remove())

    const text = clone.textContent?.replace(/\s{3,}/g, '\n\n').trim() ?? ''
    if (text) bodies.push(text)
  })

  // Fall back to .a3s.aiL (single-message view)
  if (!bodies.length) {
    const latestBody = document.querySelector('.a3s.aiL') as HTMLElement | null
    if (latestBody) {
      const clone = latestBody.cloneNode(true) as HTMLElement
      clone.querySelectorAll('.gmail_quote, blockquote').forEach((q) => q.remove())
      const text = clone.textContent?.replace(/\s{3,}/g, '\n\n').trim()
      if (text) bodies.push(text)
    }
  }

  if (!bodies.length && !subject) return null

  const transcript = [
    `Subject: ${subject}`,
    senderName || senderEmail ? `From: ${senderName}${senderEmail ? ` <${senderEmail}>` : ''}` : '',
    '',
    ...bodies,
  ]
    .filter((l) => l !== undefined)
    .join('\n')
    .trim()

  return {
    transcript,
    participantNames: senderName ? [senderName] : [],
    contactEmails:    uniqueEmails,
    crmRecordId:      null,
    hostType:         'gmail',
  }
}

/**
 * Minimal context when only a compose window is open (no source email).
 */
export function extractFromGmail(): TranscriptContext | null {
  // Try open email first
  const open = extractOpenEmail()
  if (open) return open

  // Fall back to compose-window recipient extraction
  const composeWindow = document.querySelector(
    '[role="dialog"][aria-label*="New Message"], [role="dialog"][aria-label*="New message"]',
  )
  if (!composeWindow) return null

  return {
    transcript:       '',
    participantNames: [],
    contactEmails:    extractRecipientsFromCompose(composeWindow),
    crmRecordId:      null,
    hostType:         'gmail',
  }
}

function extractRecipientsFromCompose(composeWindow: Element): string[] {
  const emails = new Set<string>()
  composeWindow.querySelectorAll('[data-hovercard-id]').forEach((chip) => {
    const email = (chip as HTMLElement).dataset['hovercardId']
    if (email?.includes('@')) emails.add(email.toLowerCase())
  })
  return Array.from(emails)
}

// ── Email-open watcher ────────────────────────────────────────────────────────

type EmailOpenCallback = (ctx: TranscriptContext) => void

/**
 * Watches for Gmail navigation into a thread (URL hash changes from list view
 * to a specific message). Calls `onOpen` with the extracted context once the
 * DOM has settled (Gmail renders async after the hash change).
 */
export function watchForEmailOpen(onOpen: EmailOpenCallback): () => void {
  const EMAIL_HASH = /^#(inbox|sent|starred|all|trash|spam|search|label)\/[a-zA-Z0-9]+/

  let lastHash = window.location.hash
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  const tryExtract = () => {
    const ctx = extractOpenEmail()
    if (ctx?.transcript) onOpen(ctx)
  }

  const onHashChange = () => {
    const hash = window.location.hash
    if (hash === lastHash) return
    lastHash = hash

    if (EMAIL_HASH.test(hash)) {
      // Gmail renders the email body ~300–600 ms after the hash change
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(tryExtract, 600)
    }
  }

  // Also watch DOM for subject appearing (handles initial page load into a thread)
  let subjectSeen = false
  const domObserver = new MutationObserver(() => {
    const subject = document.querySelector('h2.hP')
    if (subject && !subjectSeen) {
      subjectSeen = true
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(tryExtract, 300)
    }
    if (!subject) subjectSeen = false
  })
  domObserver.observe(document.body, { childList: true, subtree: true })

  window.addEventListener('hashchange', onHashChange)

  return () => {
    window.removeEventListener('hashchange', onHashChange)
    domObserver.disconnect()
    if (debounceTimer) clearTimeout(debounceTimer)
  }
}

/**
 * Observe for compose windows opening.
 */
export function watchForComposeWindow(onOpen: () => void): MutationObserver {
  const observer = new MutationObserver(() => {
    const compose = document.querySelector(
      '[role="dialog"][aria-label*="New Message"], [role="dialog"][aria-label*="New message"]',
    )
    if (compose) onOpen()
  })
  observer.observe(document.body, { childList: true, subtree: true })
  return observer
}
