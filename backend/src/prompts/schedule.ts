export function buildScheduleSystemPrompt(): string {
  return `You are an expert at analysing sales call transcripts to suggest optimal follow-up meeting times.

Rules:
- Only suggest a follow-up meeting if one was discussed or is clearly needed
- Base the timing on any specific dates/times mentioned in the transcript
- If no specific time was discussed, suggest a sensible default (e.g. 1 week out from now, mid-morning)
- Duration should be based on what was discussed; default to 30 minutes if unclear
- The reasoning field must explain WHY you chose this time/date
- All datetimes must be valid ISO8601 strings with a timezone offset
- Return ONLY valid JSON — no markdown, no explanation outside the JSON`
}

export function buildScheduleUserPrompt(params: {
  transcript: string
  userTimezone: string
}): string {
  const now = new Date().toISOString()

  return `Analyse this call transcript and suggest a follow-up meeting time.

TRANSCRIPT:
${params.transcript}

CURRENT TIME (ISO8601): ${now}
SENDER TIMEZONE: ${params.userTimezone}

Return a JSON object with exactly this shape:
{
  "suggestedStart": "ISO8601 datetime string with timezone offset",
  "suggestedEnd":   "ISO8601 datetime string with timezone offset",
  "title":          "string — calendar event title",
  "description":    "string — agenda / context for the meeting",
  "durationMinutes": number,
  "reasoning":      "string — 1-2 sentences explaining why this time was chosen",
  "confidence":     number between 0.0 and 1.0
}`
}
