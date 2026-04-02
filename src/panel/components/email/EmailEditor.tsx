import { useEmailStore } from '../../store/email.store'

export function EmailEditor() {
  const { draft, editedSubject, editedBodyHtml, updateEditedSubject, updateEditedBodyHtml } = useEmailStore()
  if (!draft) return null

  return (
    <div className="space-y-2">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500 uppercase tracking-wide">
          Subject
        </label>
        <input
          type="text"
          value={editedSubject}
          onChange={(e) => updateEditedSubject(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:bg-white"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500 uppercase tracking-wide">
          Body
        </label>
        {/* Using textarea (not contenteditable) to prevent XSS */}
        <textarea
          value={editedBodyHtml}
          onChange={(e) => updateEditedBodyHtml(e.target.value)}
          rows={12}
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-900 font-mono focus:border-brand-400 focus:outline-none focus:bg-white resize-y"
        />
        <p className="mt-0.5 text-xs text-gray-400">Editing raw HTML — changes are reflected when sent</p>
      </div>
    </div>
  )
}
