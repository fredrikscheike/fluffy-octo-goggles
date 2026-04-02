import { getAccessToken } from './auth'
import type { Result } from '../shared/types/api.types'

const CAL_BASE = 'https://www.googleapis.com/calendar/v3'

interface FreeBusySlot {
  start: string
  end: string
}

async function isSlotFree(start: string, end: string): Promise<boolean> {
  const token = await getAccessToken()

  const resp = await fetch(`${CAL_BASE}/freeBusy`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      timeMin: start,
      timeMax: end,
      items: [{ id: 'primary' }],
    }),
  })

  if (!resp.ok) return true  // assume free if check fails — non-blocking
  const data = await resp.json() as { calendars: { primary: { busy: FreeBusySlot[] } } }
  return (data.calendars?.primary?.busy ?? []).length === 0
}

export async function createCalendarEvent(params: {
  title: string
  description: string
  start: string
  end: string
  attendeeEmails: string[]
}): Promise<Result<{ eventId: string; htmlLink: string }>> {
  const token = await getAccessToken()

  const free = await isSlotFree(params.start, params.end)
  if (!free) {
    // Still create — ISR already approved — but we could surface a warning here
    console.warn('[PostCallAssistant] Suggested time slot is busy; creating anyway per ISR approval')
  }

  let resp: Response
  try {
    resp = await fetch(`${CAL_BASE}/calendars/primary/events`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: params.title,
        description: params.description,
        start: { dateTime: params.start },
        end:   { dateTime: params.end },
        attendees: params.attendeeEmails.map((email) => ({ email })),
        sendUpdates: 'all',
      }),
    })
  } catch (e) {
    return { ok: false, error: { code: 'INTERNAL_ERROR', message: String(e) } }
  }

  if (!resp.ok) {
    return { ok: false, error: { code: 'INTERNAL_ERROR', message: `Calendar API ${resp.status}` } }
  }

  const data = await resp.json() as { id: string; htmlLink: string }
  return { ok: true, data: { eventId: data.id, htmlLink: data.htmlLink } }
}
