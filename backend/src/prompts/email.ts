import type { LearnedStyle, WritingStylePreset } from '../types.js'

const STYLE_INSTRUCTIONS: Record<WritingStylePreset, string> = {
  match_my_style: '', // filled in dynamically from LearnedStyle
  formal:         'Write in a formal, professional tone. Use complete sentences, proper salutations, and structured paragraphs.',
  casual:         'Write in a warm, conversational tone. Use natural language, contractions are fine, keep it friendly.',
  concise:        'Write as concisely as possible. Use bullet points for action items. Every sentence must earn its place — no filler.',
  detailed:       'Write a thorough email that includes full context, rationale, and all relevant next steps with clear ownership.',
}

function buildStyleInstruction(
  preset: WritingStylePreset,
  learnedStyle?: LearnedStyle,
): string {
  if (preset !== 'match_my_style') return STYLE_INSTRUCTIONS[preset]

  if (!learnedStyle) {
    return 'Write in a professional, friendly tone.'
  }

  const parts: string[] = [
    `Match the sender's personal writing style based on this analysis of their past emails:`,
    `- Style summary: ${learnedStyle.summary}`,
    `- Sentence length preference: ${learnedStyle.sentenceLength}`,
  ]

  if (learnedStyle.greeting) {
    parts.push(`- Always open with: "${learnedStyle.greeting}"`)
  }
  if (learnedStyle.signOff) {
    parts.push(`- Always close with: "${learnedStyle.signOff}"`)
  }
  if (learnedStyle.commonPhrases.length > 0) {
    parts.push(`- Naturally incorporate these phrases where appropriate: ${learnedStyle.commonPhrases.join(', ')}`)
  }

  return parts.join('\n')
}

export function buildEmailSystemPrompt(): string {
  return `You are an expert sales communication assistant. Your job is to generate structured, accurate follow-up emails from call transcripts.

Rules:
- Extract only facts that were explicitly stated or clearly implied in the transcript
- Never invent commitments, dates, or details not mentioned
- Action items must have clear ownership (who does what)
- The email should be ready to send with zero editing required
- Return ONLY valid JSON — no markdown, no explanation outside the JSON`
}

export function buildEmailUserPrompt(params: {
  transcript: string
  participantNames: string[]
  userEmail: string
  stylePreset: WritingStylePreset
  learnedStyle?: LearnedStyle
}): string {
  const styleInstruction = buildStyleInstruction(params.stylePreset, params.learnedStyle)

  return `Generate a follow-up email based on this call transcript.

TRANSCRIPT:
${params.transcript}

PARTICIPANTS: ${params.participantNames.join(', ') || 'Unknown'}
SENDER EMAIL: ${params.userEmail}

STYLE INSTRUCTION:
${styleInstruction}

Return a JSON object with exactly this shape:
{
  "subject": "string — concise, specific subject line",
  "bodyHtml": "string — full HTML email body (use <p>, <ul>, <li>, <strong> tags)",
  "bodyPlaintext": "string — plain text version of the same email",
  "confidence": number between 0.0 and 1.0 (how complete/clear was the transcript?)
}`
}
