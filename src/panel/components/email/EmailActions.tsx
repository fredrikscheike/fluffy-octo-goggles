import { useEmailStore } from '../../store/email.store'
import { useEmailReview } from '../../hooks/useEmailReview'
import { Button } from '../shared/Button'
import { StatusBadge } from '../shared/StatusBadge'

export function EmailActions() {
  const store  = useEmailStore()
  const { send } = useEmailReview()

  if (store.sendStatus === 'sent') {
    return (
      <div className="flex items-center gap-2 pt-1">
        <StatusBadge status="sent" />
        <span className="text-xs text-gray-500">Email sent successfully</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 pt-1">
      {store.mode === 'view' ? (
        <Button variant="ghost" size="sm" onClick={() => store.setMode('edit')}>
          Edit
        </Button>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => store.setMode('view')}>
          Preview
        </Button>
      )}

      <Button
        variant="primary"
        size="sm"
        loading={store.sendStatus === 'sending'}
        disabled={store.loadStatus !== 'ready'}
        onClick={send}
      >
        Send
      </Button>

      {store.sendError && (
        <span className="text-xs text-red-500 truncate max-w-[140px]" title={store.sendError}>
          {store.sendError}
        </span>
      )}
    </div>
  )
}
