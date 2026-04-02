import { create } from 'zustand'
import type { EmailDraft, EmailMode, LoadStatus, SendStatus } from '../../shared/types/domain.types'
import type { Recipient } from '../../shared/types/domain.types'

interface EmailState {
  draft: EmailDraft | null
  editedSubject: string
  editedBodyHtml: string
  mode: EmailMode
  loadStatus: LoadStatus
  sendStatus: SendStatus
  sendError: string | null
  sentMessageId: string | null

  // Recipients live here so EmailReviewPanel and RecipientCoordinator share state
  to: Recipient[]
  cc: Recipient[]
  bcc: Recipient[]

  setDraft: (draft: EmailDraft) => void
  setRecipients: (to: Recipient[], cc: Recipient[], bcc: Recipient[]) => void
  setMode: (mode: EmailMode) => void
  updateEditedSubject: (subject: string) => void
  updateEditedBodyHtml: (body: string) => void
  setLoadStatus: (status: LoadStatus, error?: string) => void
  setSendStatus: (status: SendStatus, error?: string) => void
  setSent: (messageId: string) => void
  addRecipient: (r: Recipient) => void
  removeRecipient: (email: string, role: Recipient['role']) => void
  reset: () => void
}

export const useEmailStore = create<EmailState>((set, get) => ({
  draft:           null,
  editedSubject:   '',
  editedBodyHtml:  '',
  mode:            'view',
  loadStatus:      'idle',
  sendStatus:      'idle',
  sendError:       null,
  sentMessageId:   null,
  to:  [],
  cc:  [],
  bcc: [],

  setDraft: (draft) =>
    set({ draft, editedSubject: draft.subject, editedBodyHtml: draft.bodyHtml }),

  setRecipients: (to, cc, bcc) => set({ to, cc, bcc }),

  setMode: (mode) => set({ mode }),

  updateEditedSubject:  (editedSubject)  => set({ editedSubject }),
  updateEditedBodyHtml: (editedBodyHtml) => set({ editedBodyHtml }),

  setLoadStatus: (loadStatus, error) =>
    set({ loadStatus, sendError: error ?? null }),

  setSendStatus: (sendStatus, error) =>
    set({ sendStatus, sendError: error ?? null }),

  setSent: (sentMessageId) =>
    set({ sendStatus: 'sent', sentMessageId }),

  addRecipient: (r) => {
    const field = r.role === 'to' ? 'to' : r.role === 'cc' ? 'cc' : 'bcc'
    const existing = get()[field]
    if (existing.some((x) => x.email === r.email)) return
    set({ [field]: [...existing, r] })
  },

  removeRecipient: (email, role) => {
    const field = role === 'to' ? 'to' : role === 'cc' ? 'cc' : 'bcc'
    set({ [field]: get()[field].filter((r) => r.email !== email) })
  },

  reset: () =>
    set({
      draft: null, editedSubject: '', editedBodyHtml: '', mode: 'view',
      loadStatus: 'idle', sendStatus: 'idle', sendError: null,
      sentMessageId: null, to: [], cc: [], bcc: [],
    }),
}))
