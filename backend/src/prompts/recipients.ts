export function buildRecipientsSystemPrompt(): string {
  return `You are an expert at analysing sales call transcripts to identify who should receive a follow-up email.

Rules:
- TO: The primary contact(s) you spoke with directly
- CC: Stakeholders mentioned who should be kept informed but were not primary speakers
- BCC: Internal team members (same company as the sender) who need visibility
- Only include people who were explicitly mentioned by name AND have an inferable or known email
- If an email is not known, set it to null and mark source as "inferred"
- Return ONLY valid JSON — no markdown, no explanation outside the JSON`
}

export function buildRecipientsUserPrompt(params: {
  transcript: string
  participantNames: string[]
  knownEmails: string[]
  userEmail: string
}): string {
  return `Analyse this call transcript and determine the correct To, CC, and BCC recipients for the follow-up email.

TRANSCRIPT:
${params.transcript}

KNOWN PARTICIPANTS: ${params.participantNames.join(', ') || 'None identified'}
KNOWN EMAIL ADDRESSES: ${params.knownEmails.join(', ') || 'None'}
SENDER (do NOT include as recipient): ${params.userEmail}

Return a JSON object with exactly this shape:
{
  "to": [
    {
      "email": "string or null if unknown",
      "name": "string or null",
      "role": "to",
      "source": "transcript" | "crm" | "inferred"
    }
  ],
  "cc": [ /* same shape */ ],
  "bcc": [ /* same shape */ ]
}`
}
