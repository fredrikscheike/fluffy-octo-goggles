import { useScheduleStore } from '../../store/schedule.store'
import { isoToDatetimeLocal, datetimeLocalToIso } from '../../../shared/utils/date'

export function DateTimePicker() {
  const { suggestion, editedStart, editedEnd, updateEditedStart, updateEditedEnd } = useScheduleStore()
  if (!suggestion) return null

  return (
    <div className="space-y-2">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500 uppercase tracking-wide">
          Start
        </label>
        <input
          type="datetime-local"
          value={isoToDatetimeLocal(editedStart || suggestion.suggestedStart)}
          onChange={(e) => updateEditedStart(datetimeLocalToIso(e.target.value))}
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500 uppercase tracking-wide">
          End
        </label>
        <input
          type="datetime-local"
          value={isoToDatetimeLocal(editedEnd || suggestion.suggestedEnd)}
          onChange={(e) => updateEditedEnd(datetimeLocalToIso(e.target.value))}
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none"
        />
      </div>
    </div>
  )
}
