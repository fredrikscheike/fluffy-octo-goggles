import { useEmailStore } from '../store/email.store'
import { useSessionStore } from '../store/session.store'
import { useStyleStore } from '../store/style.store'
import { sendMessage } from './useExtensionMessage'
import { getLocalTimezone } from '../../shared/utils/date'
import type { ExtensionMessage } from '../../shared/types/messages.types'
import type { AnalyzeRequest } from '../../shared/types/api.types'
import { v4 as uuidv4 } from 'uuid'

// uuid is a common dep — if you prefer not to add it, replace with crypto.randomUUID()
// which is available in MV3 extension contexts.

export function useEmailReview() {
  const store   = useEmailStore()
  const session = useSessionStore()
  const style   = useStyleStore()

  async function generate() {
    const ctx = session.transcriptContext
    if (!ctx) return

    store.setLoadStatus('loading')

    const req: AnalyzeRequest = {
      transcript:       ctx.transcript,
      participantNames: ctx.participantNames,
      knownEmails:      ctx.contactEmails,
      userEmail:        session.userEmail ?? '',
      userTimezone:     getLocalTimezone(),
      stylePreset:      style.preset,
      learnedStyle:     style.preset === 'match_my_style' ? (style.learnedStyle ?? undefined) : undefined,
      crmRecordId:      ctx.crmRecordId,
      requestId:        crypto.randomUUID(),
    }

    const resp = await sendMessage<ExtensionMessage>({ type: 'GENERATE_ALL', payload: req })

    if (resp.type === 'GENERATE_ALL_RESULT') {
      store.setDraft(resp.payload.email)
      store.setRecipients(resp.payload.recipients.to, resp.payload.recipients.cc, resp.payload.recipients.bcc)
      store.setLoadStatus('ready')
    } else if (resp.type === 'GENERATE_ALL_ERROR') {
      store.setLoadStatus('error', resp.payload.message)
    }
  }

  async function send() {
    const { draft, editedSubject, editedBodyHtml, to, cc, bcc } = store
    if (!draft) return

    store.setSendStatus('sending')

    const resp = await sendMessage<ExtensionMessage>({
      type: 'SEND_EMAIL',
      payload: {
        to, cc, bcc,
        subject:       editedSubject || draft.subject,
        bodyHtml:      editedBodyHtml || draft.bodyHtml,
        bodyPlaintext: draft.bodyPlaintext,
      },
    })

    if (resp.type === 'EMAIL_SENT') {
      store.setSent(resp.payload.messageId)
    } else if (resp.type === 'EMAIL_SEND_ERROR') {
      store.setSendStatus('error', resp.payload.message)
    }
  }

  return { generate, send }
}
