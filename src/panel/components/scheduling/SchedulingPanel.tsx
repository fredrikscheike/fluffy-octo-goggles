import { useState } from 'react'
import { useScheduleStore } from '../../store/schedule.store'
import { SectionAccordion } from '../layout/SectionAccordion'
import { SuggestedTime } from './SuggestedTime'
import { DateTimePicker } from './DateTimePicker'
import { ScheduleActions } from './ScheduleActions'
import { LoadingSpinner } from '../shared/LoadingSpinner'

export function SchedulingPanel() {
  const store = useScheduleStore()
  const [expanded, setExpanded] = useState(true)

  const badge = store.eventStatus === 'created'
    ? <span className="text-xs text-emerald-600 font-medium">Booked</span>
    : store.eventStatus === 'declined'
    ? <span className="text-xs text-gray-400">Declined</span>
    : null

  if (store.loadStatus === 'idle') return null

  return (
    <SectionAccordion
      title="Schedule Follow-Up"
      isExpanded={expanded}
      onToggle={() => setExpanded((v) => !v)}
      badge={badge}
    >
      {store.loadStatus === 'loading' && (
        <LoadingSpinner label="Finding best time…" />
      )}

      {store.loadStatus === 'ready' && store.suggestion && (
        <div className="space-y-3">
          {store.mode === 'view' ? <SuggestedTime /> : <DateTimePicker />}
          <ScheduleActions />
        </div>
      )}
    </SectionAccordion>
  )
}
