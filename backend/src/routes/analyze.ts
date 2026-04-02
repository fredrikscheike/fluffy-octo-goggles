import type { Request, Response } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { buildEmailSystemPrompt, buildEmailUserPrompt } from '../prompts/email.js'
import { buildRecipientsSystemPrompt, buildRecipientsUserPrompt } from '../prompts/recipients.js'
import { buildScheduleSystemPrompt, buildScheduleUserPrompt } from '../prompts/schedule.js'
import type { AnalyzeRequest, AnalyzeResponse, Recipient } from '../types.js'

const MODEL = 'claude-opus-4-6'
const client = new Anthropic()

/**
 * Call Claude with streaming internally, return parsed JSON.
 * Using .stream() + .finalMessage() avoids HTTP timeouts on large outputs.
 */
async function callClaude(systemPrompt: string, userPrompt: string): Promise<string> {
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 4096,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    thinking: { type: 'adaptive' } as any,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const message = await stream.finalMessage()
  const textBlock = message.content.find((b) => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text block in Claude response')
  }
  return textBlock.text
}

function parseJson<T>(raw: string, context: string): T {
  // Strip markdown code fences if Claude wrapped the JSON
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
  try {
    return JSON.parse(cleaned) as T
  } catch {
    throw new Error(`Failed to parse ${context} JSON: ${cleaned.slice(0, 200)}`)
  }
}

function validateEmail(email: unknown): boolean {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function sanitiseRecipients(raw: unknown): { to: Recipient[]; cc: Recipient[]; bcc: Recipient[] } {
  const empty = { to: [] as Recipient[], cc: [] as Recipient[], bcc: [] as Recipient[] }
  if (!raw || typeof raw !== 'object') return empty

  const obj = raw as Record<string, unknown>

  function mapList(list: unknown, role: Recipient['role']): Recipient[] {
    if (!Array.isArray(list)) return []
    return list
      .filter((r): r is Record<string, unknown> => r !== null && typeof r === 'object')
      .map((r) => ({
        email:  typeof r['email'] === 'string' ? r['email'] : '',
        name:   typeof r['name']  === 'string' ? r['name']  : null,
        role,
        source: (['transcript', 'crm', 'inferred'].includes(r['source'] as string)
          ? r['source']
          : 'inferred') as Recipient['source'],
      }))
      .filter((r) => validateEmail(r.email))
  }

  return {
    to:  mapList(obj['to'],  'to'),
    cc:  mapList(obj['cc'],  'cc'),
    bcc: mapList(obj['bcc'], 'bcc'),
  }
}

export async function analyzeHandler(req: Request, res: Response): Promise<void> {
  const body = req.body as AnalyzeRequest

  if (!body.transcript || body.transcript.trim().length < 50) {
    res.status(400).json({ code: 'TRANSCRIPT_TOO_SHORT', message: 'Transcript must be at least 50 characters' })
    return
  }

  if (body.transcript.length > 100_000) {
    res.status(400).json({ code: 'TRANSCRIPT_TOO_LONG', message: 'Transcript must be under 100,000 characters' })
    return
  }

  const startMs = Date.now()

  try {
    // Run all three Claude calls in parallel to minimise latency
    const [emailRaw, recipientsRaw, scheduleRaw] = await Promise.all([
      callClaude(
        buildEmailSystemPrompt(),
        buildEmailUserPrompt({
          transcript:      body.transcript,
          participantNames: body.participantNames ?? [],
          userEmail:       body.userEmail,
          stylePreset:     body.stylePreset ?? 'formal',
          learnedStyle:    body.learnedStyle,
        }),
      ),
      callClaude(
        buildRecipientsSystemPrompt(),
        buildRecipientsUserPrompt({
          transcript:      body.transcript,
          participantNames: body.participantNames ?? [],
          knownEmails:     body.knownEmails ?? [],
          userEmail:       body.userEmail,
        }),
      ),
      callClaude(
        buildScheduleSystemPrompt(),
        buildScheduleUserPrompt({
          transcript:   body.transcript,
          userTimezone: body.userTimezone ?? 'UTC',
        }),
      ),
    ])

    const email      = parseJson<AnalyzeResponse['email']>(emailRaw, 'email')
    const recipients = sanitiseRecipients(parseJson<unknown>(recipientsRaw, 'recipients'))
    const schedule   = parseJson<AnalyzeResponse['schedule']>(scheduleRaw, 'schedule')

    const response: AnalyzeResponse = {
      requestId: body.requestId,
      email,
      recipients,
      schedule,
      metadata: {
        modelVersion: MODEL,
        processingMs: Date.now() - startMs,
      },
    }

    res.json(response)
  } catch (err) {
    console.error('[analyze] Error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'

    if (message.includes('overloaded') || message.includes('529')) {
      res.status(503).json({ code: 'MODEL_UNAVAILABLE', message: 'Claude is temporarily unavailable — please retry' })
      return
    }

    res.status(500).json({ code: 'INTERNAL_ERROR', message })
  }
}
