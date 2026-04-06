/**
 * Drag-and-drop interception for Gmail email rows.
 *
 * Problem: the shadow host has pointer-events:none, and the shadow root is
 * closed, so the browser's hit-testing never delivers dragover/drop events to
 * elements inside the shadow DOM.
 *
 * Solution:
 *  1. Listen for mousedown on Gmail email rows to capture metadata early
 *     (before dragstart fires, and without relying on specific class names).
 *  2. Listen for dragstart on the document in capture phase as a second pass.
 *  3. Intercept dragover/drop at the document capture level; check coordinates
 *     against the shadow host rect ourselves instead of relying on hit-testing.
 *  4. Expose module-level callbacks so the React DragDropZone can register
 *     handlers and receive state updates without crossing the shadow boundary.
 */

import type { TranscriptContext } from '../shared/types/domain.types'
import { getShadowHostRect } from './shadow-root'

export interface CapturedEmail {
  messageId: string | null
  subject: string
  sender: string
  snippet: string
}

// ── Module-level state ────────────────────────────────────────────────────────

let _captured: CapturedEmail | null = null
let _active = false   // true while a drag is in progress over the panel

// Callbacks registered by DragDropZone
export const dragCallbacks: {
  onEnter:  (() => void) | null
  onLeave:  (() => void) | null
  onDrop:   ((ctx: TranscriptContext) => void) | null
  onError:  ((msg: string) => void) | null
  onLoading: (() => void) | null
} = {
  onEnter:   null,
  onLeave:   null,
  onDrop:    null,
  onError:   null,
  onLoading: null,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isOverPanel(e: MouseEvent): boolean {
  const rect = getShadowHostRect()
  if (!rect) return false
  return (
    e.clientX >= rect.left &&
    e.clientX <= rect.right &&
    e.clientY >= rect.top  &&
    e.clientY <= rect.bottom
  )
}

/**
 * Try several Gmail selectors to find an email row from an arbitrary target element.
 * Gmail has changed its class names over the years; we try multiple patterns.
 */
function findEmailRow(el: HTMLElement): HTMLElement | null {
  return (
    el.closest('[data-legacy-message-id]') as HTMLElement ||
    el.closest('tr.zA')                   as HTMLElement ||
    el.closest('tr[jsmodel]')             as HTMLElement ||
    el.closest('li[data-thread-id]')      as HTMLElement ||
    null
  )
}

function extractFromRow(row: HTMLElement): CapturedEmail {
  // Subject — try known Gmail class names, fall back to row text
  const subjectEl =
    row.querySelector('.y6 span, .y6, [data-subject]') as HTMLElement | null

  // Sender — try attribute email or text content
  const senderEl =
    row.querySelector('.zF, .yW, [email]') as HTMLElement | null

  // Snippet
  const snippetEl = row.querySelector('.y2') as HTMLElement | null

  // Message / thread ID from href fragment or data attribute
  let messageId: string | null =
    row.getAttribute('data-legacy-message-id') ||
    row.getAttribute('data-thread-id') ||
    null

  if (!messageId) {
    const link = row.querySelector('a[href*="#"]') as HTMLAnchorElement | null
    const match = link?.href?.match(/#[^/]+\/([a-zA-Z0-9]+)/)
    if (match) messageId = match[1]
  }

  return {
    messageId,
    subject: subjectEl?.textContent?.trim() ?? '',
    sender:
      senderEl?.getAttribute('email') ??
      senderEl?.textContent?.trim()   ??
      '',
    snippet: snippetEl?.textContent?.trim() ?? '',
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────

export function initDragInterceptor(): void {

  // 1. Capture email data on mousedown — fires reliably before Gmail's handlers
  document.addEventListener('mousedown', (e: MouseEvent) => {
    const row = findEmailRow(e.target as HTMLElement)
    if (row) {
      _captured = extractFromRow(row)
    }
  }, { capture: true, passive: true })

  // 2. Also try dragstart as a more precise signal
  document.addEventListener('dragstart', (e: DragEvent) => {
    const row = findEmailRow(e.target as HTMLElement)
    if (row) {
      _captured = extractFromRow(row)
    }
  }, { capture: true, passive: true })

  // 3. dragover — intercept at document level, check coordinates ourselves
  document.addEventListener('dragover', (e: DragEvent) => {
    if (!isOverPanel(e)) {
      if (_active) {
        _active = false
        dragCallbacks.onLeave?.()
      }
      return
    }

    // Prevent default to mark panel as a valid drop target
    e.preventDefault()
    e.stopPropagation()

    if (!_active) {
      _active = true
      dragCallbacks.onEnter?.()
    }
  }, { capture: true })

  // 4. dragleave at document edges
  document.addEventListener('dragleave', (e: DragEvent) => {
    // Only fire leave when leaving the window entirely
    if (e.clientX <= 0 || e.clientY <= 0 ||
        e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
      if (_active) {
        _active = false
        dragCallbacks.onLeave?.()
      }
    }
  }, { capture: true })

  // 5. drop — intercept at document level, handle if over panel
  document.addEventListener('drop', async (e: DragEvent) => {
    if (!isOverPanel(e)) return

    e.preventDefault()
    e.stopPropagation()
    _active = false

    dragCallbacks.onLoading?.()

    const captured = _captured
    _captured = null

    // Prefer fetching the full email by ID via the background service worker
    if (captured?.messageId) {
      const response = await new Promise<chrome.runtime.Message>((resolve) => {
        chrome.runtime.sendMessage(
          { type: 'FETCH_EMAIL_CONTENT', payload: { messageId: captured.messageId } },
          resolve,
        )
      })

      if (response?.type === 'EMAIL_CONTENT_RESULT') {
        const { subject, from, body } = response.payload as {
          subject: string; from: string; body: string; messageId: string
        }
        const transcript = [
          subject ? `Subject: ${subject}` : '',
          from    ? `From: ${from}` : '',
          '',
          body,
        ].filter(Boolean).join('\n').trim()

        dragCallbacks.onDrop?.({
          transcript,
          participantNames: [from.replace(/<.*>/, '').trim()].filter(Boolean),
          contactEmails: [from.match(/<(.+)>/)?.[1] ?? ''].filter(Boolean),
          crmRecordId: null,
          hostType: 'gmail',
        })
        return
      }

      if (response?.type === 'EMAIL_CONTENT_ERROR') {
        dragCallbacks.onError?.((response.payload as { message: string }).message)
        return
      }
    }

    // Fallback: use snippet + dataTransfer text
    const dragText = e.dataTransfer?.getData('text/plain') ?? ''
    const fallback = [
      captured?.subject ? `Subject: ${captured.subject}` : '',
      captured?.sender  ? `From: ${captured.sender}` : '',
      '',
      dragText || captured?.snippet || '',
    ].join('\n').trim()

    if (fallback.replace(/\s/g, '').length > 20) {
      dragCallbacks.onDrop?.({
        transcript: fallback,
        participantNames: captured?.sender ? [captured.sender] : [],
        contactEmails: [],
        crmRecordId: null,
        hostType: 'gmail',
      })
    } else {
      dragCallbacks.onError?.('Could not read email content — try opening the email first')
    }
  }, { capture: true })

  // 6. Clear captured data when drag ends without a drop
  document.addEventListener('dragend', () => {
    setTimeout(() => {
      _captured = null
      if (_active) {
        _active = false
        dragCallbacks.onLeave?.()
      }
    }, 200)
  }, { capture: true, passive: true })
}

export function getCapturedEmail(): CapturedEmail | null {
  return _captured
}
