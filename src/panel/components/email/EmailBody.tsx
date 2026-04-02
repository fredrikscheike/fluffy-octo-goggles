import { useEmailStore } from '../../store/email.store'

export function EmailBody() {
  const { draft, editedSubject } = useEmailStore()
  if (!draft) return null

  return (
    <div className="space-y-2">
      <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">Subject</p>
        <p className="text-sm text-gray-900">{editedSubject || draft.subject}</p>
      </div>

      <div className="rounded-lg border border-gray-100 bg-white px-3 py-2 max-h-64 overflow-y-auto">
        <div
          className="prose prose-sm max-w-none text-gray-800 text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: draft.bodyHtml }}
        />
      </div>

      {draft.confidence < 0.7 && (
        <p className="text-xs text-amber-600 flex items-center gap-1">
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" clipRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" />
          </svg>
          Low confidence — review carefully before sending
        </p>
      )}
    </div>
  )
}
