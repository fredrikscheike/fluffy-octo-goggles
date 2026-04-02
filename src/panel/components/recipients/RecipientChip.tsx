import type { Recipient } from '../../../shared/types/domain.types'
import { StatusBadge } from '../shared/StatusBadge'

interface Props {
  recipient: Recipient
  onRemove: (email: string) => void
}

export function RecipientChip({ recipient, onRemove }: Props) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 border border-brand-100 pl-2.5 pr-1 py-0.5 text-xs text-brand-700">
      {recipient.name ? (
        <span title={recipient.email}>{recipient.name}</span>
      ) : (
        <span>{recipient.email}</span>
      )}
      {recipient.source !== 'inferred' && (
        <StatusBadge status={recipient.source} />
      )}
      <button
        onClick={() => onRemove(recipient.email)}
        aria-label={`Remove ${recipient.email}`}
        className="ml-0.5 rounded-full p-0.5 hover:bg-brand-100 transition-colors"
      >
        <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" clipRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
        </svg>
      </button>
    </span>
  )
}
