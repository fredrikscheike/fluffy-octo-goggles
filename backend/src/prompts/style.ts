export function buildStyleSystemPrompt(): string {
  return `You are an expert linguist and writing analyst. Your job is to analyse a collection of someone's sent emails and extract their unique writing style patterns.

Focus on:
- Overall tone and voice
- Typical sentence length and structure
- How they open emails (greetings)
- How they close emails (sign-offs)
- Recurring phrases or expressions
- Degree of formality
- Use of bullet points vs prose

Return ONLY valid JSON — no markdown, no explanation outside the JSON`
}

export function buildStyleUserPrompt(params: {
  emailSamples: string[]
  userEmail: string
}): string {
  // Truncate samples to avoid exceeding context window
  const MAX_CHARS_PER_EMAIL = 800
  const MAX_EMAILS = 20

  const truncatedSamples = params.emailSamples
    .slice(0, MAX_EMAILS)
    .map((s, i) => {
      const trimmed = s.trim().slice(0, MAX_CHARS_PER_EMAIL)
      const truncated = s.trim().length > MAX_CHARS_PER_EMAIL ? trimmed + '…' : trimmed
      return `--- Email ${i + 1} ---\n${truncated}`
    })
    .join('\n\n')

  return `Analyse the writing style of the person who sent these emails (${params.userEmail}).

${truncatedSamples}

Return a JSON object with exactly this shape:
{
  "summary":        "string — 2-3 sentence description of their overall writing style",
  "sentenceLength": "short" | "medium" | "long",
  "greeting":       "string (their most common email opening, e.g. 'Hi [Name],' or 'Hope you're well!') or null",
  "signOff":        "string (their most common sign-off, e.g. 'Best,' or 'Thanks,') or null",
  "commonPhrases":  ["array", "of", "up to 5", "recurring phrases or expressions"],
  "builtAt":        "${new Date().toISOString()}",
  "sampleSize":     ${params.emailSamples.length}
}`
}
