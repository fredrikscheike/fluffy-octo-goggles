import type { LearnedStyle, WritingStylePreset } from '../types.js'

// ── Banned phrases injected into every prompt ─────────────────────────────────
const BANNED_PHRASES = `
NEVER use these phrases or anything semantically similar:
- "I hope this email/message finds you well"
- "I hope you're doing well" / "Hope all is well"
- "Thank you for the great/wonderful/productive conversation/call/discussion"
- "Please don't hesitate to reach out" / "Feel free to reach out"
- "Please feel free to" / "Do not hesitate to"
- "Looking forward to hearing from you" (unless there is a specific pending decision)
- "As per our conversation/discussion/call"
- "As discussed"
- "I wanted to follow up" (open with the substance instead)
- "I am writing to" / "I am reaching out to"
- "Thank you for your time" as a standalone opener
- "Best regards" / "Kind regards" (use a single-word sign-off or nothing unless learned from style)
- Any sentence that starts with "I" as the first word of the email body
`.trim()

// ── Per-style instructions — genuinely different, not just slightly varied ────
const STYLE_INSTRUCTIONS: Record<WritingStylePreset, string> = {

  formal: `
STYLE: Formal professional.
- Three paragraphs maximum: (1) one-sentence context, (2) substance/action items, (3) one-sentence close.
- No contractions. Complete sentences only.
- Salutation: "Dear [First Name],"
- Sign-off: single line with name only, no "regards".
- Zero pleasantries. Open directly with why you're writing.
`.trim(),

  concise: `
STYLE: Brutally concise. Every word must justify its existence.
- Total email body: 80 words maximum.
- No salutation. No sign-off beyond a name.
- Use bullet points for any list of 2+ items.
- One action item per bullet. Who does what by when.
- Delete every word that isn't load-bearing.
`.trim(),

  casual: `
STYLE: Casual and direct — like a message from a trusted colleague.
- Use first name only, no salutation formality.
- Contractions throughout (we're, I'll, you've, let's).
- Short paragraphs — 1-2 sentences each.
- Conversational connectors: "Quick heads up —", "Just wanted to flag —", "One thing to lock in —"
- Sign-off: first name only.
`.trim(),

  detailed: `
STYLE: Comprehensive reference document the recipient can act from without re-reading notes.
- Numbered next steps with explicit ownership and deadlines where stated.
- Include all context discussed: pricing, pain points, objections, timelines.
- Use bold headers for sections: **Background**, **Key Discussion Points**, **Next Steps**.
- Recipients should be able to forward this internally without adding any context.
- Sign off with full name and any relevant contact info mentioned in the transcript.
`.trim(),

  match_my_style: '', // filled dynamically
}

function buildStyleInstruction(
  preset: WritingStylePreset,
  learnedStyle?: LearnedStyle,
): string {
  if (preset !== 'match_my_style') return STYLE_INSTRUCTIONS[preset]

  if (!learnedStyle) {
    return `STYLE: Professional and direct. No filler. Match a senior sales professional's writing voice.`
  }

  const parts: string[] = [
    `STYLE: Match the sender's exact personal writing voice based on analysis of their past emails.`,
    `Style profile: ${learnedStyle.summary}`,
    `Sentence rhythm: ${learnedStyle.sentenceLength} sentences`,
  ]
  if (learnedStyle.greeting)               parts.push(`Opening: always start with "${learnedStyle.greeting}"`)
  if (learnedStyle.signOff)                parts.push(`Sign-off: always end with "${learnedStyle.signOff}"`)
  if (learnedStyle.commonPhrases.length)   parts.push(`Signature phrases to weave in naturally: ${learnedStyle.commonPhrases.join(' · ')}`)
  parts.push(`Replicate their voice precisely — if their style is blunt, be blunt. If they use fragments, use fragments.`)

  return parts.join('\n')
}

export function buildEmailSystemPrompt(): string {
  return `You are a follow-up email generator for a B2B inside sales representative.

Core rules:
- Extract only facts explicitly stated or clearly implied in the source material
- Never invent commitments, dates, names, or pricing not present in the source
- Action items must have ownership (who does what)
- The email must be ready to send with zero editing by the sender
- Return ONLY valid JSON — no markdown fences, no explanation

${BANNED_PHRASES}

Output structure:
{
  "subject": "Specific, factual subject line — not generic",
  "bodyHtml": "Full HTML email using <p> <ul> <li> <strong> — no inline styles",
  "bodyPlaintext": "Plain text version",
  "confidence": 0.0–1.0
}`
}

export function buildEmailUserPrompt(params: {
  transcript: string
  participantNames: string[]
  userEmail: string
  stylePreset: WritingStylePreset
  learnedStyle?: LearnedStyle
}): string {
  const styleInstruction = buildStyleInstruction(params.stylePreset, params.learnedStyle)

  return `Generate a follow-up email from the source material below.

SOURCE:
${params.transcript}

PARTICIPANTS: ${params.participantNames.join(', ') || 'Unknown'}
SENDER: ${params.userEmail}

${styleInstruction}

Return the JSON object now.`
}
