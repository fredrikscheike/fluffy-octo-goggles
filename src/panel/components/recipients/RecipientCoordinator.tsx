import { useRecipients } from '../../hooks/useRecipients'
import { RecipientField } from './RecipientField'
import type { Recipient } from '../../../shared/types/domain.types'

export function RecipientCoordinator() {
  const { to, cc, bcc, addRecipient, removeRecipient } = useRecipients()

  return (
    <div className="space-y-1">
      <RecipientField
        label="To"
        recipients={to}
        onAdd={(email) => addRecipient(email, 'to')}
        onRemove={(email) => removeRecipient(email, 'to')}
      />
      <RecipientField
        label="CC"
        recipients={cc}
        onAdd={(email) => addRecipient(email, 'cc')}
        onRemove={(email) => removeRecipient(email, 'cc')}
      />
      <RecipientField
        label="BCC"
        recipients={bcc}
        onAdd={(email) => addRecipient(email, 'bcc')}
        onRemove={(email) => removeRecipient(email, 'bcc')}
      />
    </div>
  )
}
