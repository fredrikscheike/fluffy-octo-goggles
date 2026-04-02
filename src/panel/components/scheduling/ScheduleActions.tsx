import { useScheduleStore } from '../../store/schedule.store'
import { useScheduling } from '../../hooks/useScheduling'
import { Button } from '../shared/Button'

export function ScheduleActions() {
  const store = useScheduleStore()
  const { approveSchedule, declineSchedule } = useScheduling()

  if (store.eventStatus === 'declined') {
    return (
      <p className="text-xs text-gray-400">Meeting declined</p>
    )
  }

  if (store.eventStatus === 'created') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-emerald-600 font-medium">Event created</span>
        {store.eventLink && (
          <a
            href={store.eventLink}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-brand-500 underline hover:no-underline"
          >
            Open in Calendar
          </a>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 pt-1">
      {store.mode === 'view' ? (
        <>
          <Button
            variant="primary"
            size="sm"
            loading={store.eventStatus === 'creating'}
            onClick={approveSchedule}
          >
            Approve
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => store.setMode('edit')}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={declineSchedule}
          >
            Decline
          </Button>
        </>
      ) : (
        <>
          <Button
            variant="primary"
            size="sm"
            loading={store.eventStatus === 'creating'}
            onClick={() => { store.setMode('view'); approveSchedule() }}
          >
            Confirm & Book
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => store.setMode('view')}
          >
            Cancel
          </Button>
        </>
      )}

      {store.error && (
        <span className="text-xs text-red-500 truncate max-w-[140px]" title={store.error}>
          {store.error}
        </span>
      )}
    </div>
  )
}
