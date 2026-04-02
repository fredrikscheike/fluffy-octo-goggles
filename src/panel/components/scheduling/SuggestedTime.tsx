import { useScheduleStore } from '../../store/schedule.store'
import { formatDisplayDateTime } from '../../../shared/utils/date'

export function SuggestedTime() {
  const { suggestion } = useScheduleStore()
  if (!suggestion) return null

  return (
    <div className="space-y-2">
      <div className="rounded-lg bg-brand-50 border border-brand-100 px-3 py-2.5">
        <div className="flex items-start gap-2">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" clipRule="evenodd"
              d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zM4 8h12v8H4V8z" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-brand-800 truncate">{suggestion.title}</p>
            <p className="text-xs text-brand-600 mt-0.5">
              {formatDisplayDateTime(suggestion.suggestedStart)}
              {' · '}
              {suggestion.durationMinutes} min
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
        <p className="text-xs text-gray-500 leading-relaxed">
          <span className="font-medium text-gray-600">Why this time: </span>
          {suggestion.reasoning}
        </p>
      </div>

      {suggestion.confidence < 0.7 && (
        <p className="text-xs text-amber-600">
          Low confidence suggestion — consider adjusting the date or time
        </p>
      )}
    </div>
  )
}
