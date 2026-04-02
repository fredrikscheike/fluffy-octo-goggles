import { useEmailStore } from '../store/email.store'
import { isValidEmail, normalizeEmail } from '../../shared/utils/email-validator'
import type { Recipient } from '../../shared/types/domain.types'

export function useRecipients() {
  const store = useEmailStore()

  function addRecipient(email: string, role: Recipient['role']) {
    const normalized = normalizeEmail(email)
    if (!isValidEmail(normalized)) return false
    store.addRecipient({ email: normalized, name: null, role, source: 'inferred' })
    return true
  }

  function removeRecipient(email: string, role: Recipient['role']) {
    store.removeRecipient(email, role)
  }

  return {
    to:  store.to,
    cc:  store.cc,
    bcc: store.bcc,
    addRecipient,
    removeRecipient,
  }
}
