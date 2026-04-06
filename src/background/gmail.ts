import { getAccessToken, getUserEmail } from './auth'
import type { ApiError, Result } from '../shared/types/api.types'
import type { Recipient } from '../shared/types/domain.types'

const GMAIL_BASE = 'https://gmail.googleapis.com/gmail/v1'

function buildMimeMessage(params: {
  from: string
  to: Recipient[]
  cc: Recipient[]
  bcc: Recipient[]
  subject: string
  bodyHtml: string
  bodyPlaintext: string
}): string {
  const formatAddresses = (rs: Recipient[]) =>
    rs.map((r) => (r.name ? `${r.name} <${r.email}>` : r.email)).join(', ')

  const boundary = `boundary_${Date.now()}`
  const lines: string[] = [
    `From: ${params.from}`,
    `To: ${formatAddresses(params.to)}`,
  ]
  if (params.cc.length)  lines.push(`Cc: ${formatAddresses(params.cc)}`)
  if (params.bcc.length) lines.push(`Bcc: ${formatAddresses(params.bcc)}`)
  lines.push(
    `Subject: ${params.subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    '',
    params.bodyPlaintext,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    '',
    params.bodyHtml,
    '',
    `--${boundary}--`,
  )

  const raw = lines.join('\r\n')
  return btoa(unescape(encodeURIComponent(raw)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export async function sendEmail(params: {
  to: Recipient[]
  cc: Recipient[]
  bcc: Recipient[]
  subject: string
  bodyHtml: string
  bodyPlaintext: string
}): Promise<Result<{ messageId: string; threadId: string }>> {
  const token = await getAccessToken()
  const userEmail = await getUserEmail() ?? 'me'

  const raw = buildMimeMessage({ from: userEmail, ...params })

  let resp: Response
  try {
    resp = await fetch(`${GMAIL_BASE}/users/me/messages/send`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw }),
    })
  } catch (e) {
    return { ok: false, error: { code: 'INTERNAL_ERROR', message: String(e) } }
  }

  if (!resp.ok) {
    return { ok: false, error: { code: 'INTERNAL_ERROR', message: `Gmail API ${resp.status}` } }
  }

  const data = await resp.json() as { id: string; threadId: string }
  return { ok: true, data: { messageId: data.id, threadId: data.threadId } }
}

/**
 * Fetch plaintext bodies of the most recent N sent emails.
 * Used for style profile analysis.
 */
export async function fetchSentEmailSamples(maxResults: number): Promise<Result<{ samples: string[] }>> {
  const token = await getAccessToken()

  // Step 1: list message IDs from SENT
  let listResp: Response
  try {
    listResp = await fetch(
      `${GMAIL_BASE}/users/me/messages?labelIds=SENT&maxResults=${maxResults}&fields=messages(id)`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
  } catch (e) {
    return { ok: false, error: { code: 'INTERNAL_ERROR', message: String(e) } }
  }

  if (!listResp.ok) {
    return { ok: false, error: { code: 'INTERNAL_ERROR', message: `Gmail list ${listResp.status}` } }
  }

  const listData = await listResp.json() as { messages?: { id: string }[] }
  const ids = listData.messages?.map((m) => m.id) ?? []

  // Step 2: fetch each message body (snippet only to keep payload small)
  const samples: string[] = []
  await Promise.all(
    ids.map(async (id) => {
      try {
        const msgResp = await fetch(
          `${GMAIL_BASE}/users/me/messages/${id}?format=full&fields=payload`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        if (!msgResp.ok) return
        const msg = await msgResp.json() as { payload?: GmailPayload }
        const text = extractPlaintextFromPayload(msg.payload)
        if (text) samples.push(text)
      } catch {
        // skip failed individual fetches
      }
    })
  )

  return { ok: true, data: { samples } }
}

/**
 * Fetch a single email by message ID and return subject, sender, and plain-text body.
 */
export async function fetchEmailById(
  messageId: string,
): Promise<Result<{ subject: string; from: string; body: string; messageId: string }>> {
  const token = await getAccessToken()

  let resp: Response
  try {
    resp = await fetch(
      `${GMAIL_BASE}/users/me/messages/${messageId}?format=full&fields=payload`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
  } catch (e) {
    return { ok: false, error: { code: 'INTERNAL_ERROR', message: String(e) } }
  }

  if (!resp.ok) {
    return { ok: false, error: { code: 'INTERNAL_ERROR', message: `Gmail API ${resp.status}` } }
  }

  const msg = await resp.json() as { payload?: GmailPayload }
  const payload = msg.payload

  const getHeader = (name: string): string =>
    payload?.headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? ''

  const subject = getHeader('subject')
  const from = getHeader('from')
  const body = extractPlaintextFromPayload(payload) ?? ''

  return { ok: true, data: { subject, from, body, messageId } }
}

interface GmailPayload {
  mimeType?: string
  body?: { data?: string; size?: number }
  parts?: GmailPayload[]
  headers?: { name: string; value: string }[]
}

function extractPlaintextFromPayload(payload?: GmailPayload): string | null {
  if (!payload) return null

  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    try {
      return decodeURIComponent(escape(atob(payload.body.data.replace(/-/g, '+').replace(/_/g, '/'))))
    } catch {
      return null
    }
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      const result = extractPlaintextFromPayload(part)
      if (result) return result
    }
  }

  return null
}
