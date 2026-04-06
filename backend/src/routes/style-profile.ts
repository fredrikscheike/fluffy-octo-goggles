import type { Request, Response } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { config } from 'dotenv'
import { buildStyleSystemPrompt, buildStyleUserPrompt } from '../prompts/style.js'
import type { StyleProfileRequest, StyleProfileResponse } from '../types.js'

config({ override: true })

const MODEL = 'claude-opus-4-6'
const client = new Anthropic()

export async function styleProfileHandler(req: Request, res: Response): Promise<void> {
  const body = req.body as StyleProfileRequest

  if (!body.userEmail || typeof body.userEmail !== 'string') {
    res.status(400).json({ code: 'MISSING_USER_EMAIL', message: 'userEmail is required' })
    return
  }

  if (!Array.isArray(body.emailSamples) || body.emailSamples.length === 0) {
    res.status(400).json({ code: 'NO_EMAIL_SAMPLES', message: 'At least one email sample is required' })
    return
  }

  if (body.emailSamples.length > 50) {
    res.status(400).json({ code: 'TOO_MANY_SAMPLES', message: 'Maximum 50 email samples allowed' })
    return
  }

  try {
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: 1024,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      thinking: { type: 'adaptive' } as any,
      system: buildStyleSystemPrompt(),
      messages: [
        {
          role: 'user',
          content: buildStyleUserPrompt({
            emailSamples: body.emailSamples,
            userEmail: body.userEmail,
          }),
        },
      ],
    })

    const message = await stream.finalMessage()
    const textBlock = message.content.find((b) => b.type === 'text')

    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text block in Claude response')
    }

    // Strip markdown fences if present
    const cleaned = textBlock.text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim()

    let learnedStyle: StyleProfileResponse['learnedStyle']
    try {
      learnedStyle = JSON.parse(cleaned)
    } catch {
      throw new Error(`Failed to parse style profile JSON: ${cleaned.slice(0, 200)}`)
    }

    // Validate required fields
    if (
      typeof learnedStyle.summary !== 'string' ||
      !['short', 'medium', 'long'].includes(learnedStyle.sentenceLength) ||
      !Array.isArray(learnedStyle.commonPhrases)
    ) {
      throw new Error('Style profile response missing required fields')
    }

    const response: StyleProfileResponse = {
      learnedStyle: {
        summary: learnedStyle.summary,
        sentenceLength: learnedStyle.sentenceLength,
        greeting: typeof learnedStyle.greeting === 'string' ? learnedStyle.greeting : null,
        signOff: typeof learnedStyle.signOff === 'string' ? learnedStyle.signOff : null,
        commonPhrases: (learnedStyle.commonPhrases as unknown[])
          .filter((p): p is string => typeof p === 'string')
          .slice(0, 5),
        builtAt: new Date().toISOString(),
        sampleSize: body.emailSamples.length,
      },
    }

    res.json(response)
  } catch (err) {
    console.error('[style-profile] Error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'

    if (message.includes('overloaded') || message.includes('529')) {
      res.status(503).json({ code: 'MODEL_UNAVAILABLE', message: 'Claude is temporarily unavailable — please retry' })
      return
    }

    res.status(500).json({ code: 'INTERNAL_ERROR', message })
  }
}
