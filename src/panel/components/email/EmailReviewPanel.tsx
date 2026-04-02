import { useState } from 'react'
import { useEmailStore } from '../../store/email.store'
import { SectionAccordion } from '../layout/SectionAccordion'
import { RecipientCoordinator } from '../recipients/RecipientCoordinator'
import { EmailBody } from './EmailBody'
import { EmailEditor } from './EmailEditor'
import { EmailActions } from './EmailActions'
import { LoadingSpinner } from '../shared/LoadingSpinner'
import { ErrorBanner } from '../shared/ErrorBanner'
import { useEmailReview } from '../../hooks/useEmailReview'
import { StatusBadge } from '../shared/StatusBadge'

export function EmailReviewPanel() {
  const store = useEmailStore()
  const { generate } = useEmailReview()
  const [expanded, setExpanded] = useState(true)

  const badge = store.sendStatus === 'sent'
    ? <StatusBadge status="sent" />
    : store.loadStatus === 'ready'
    ? <span className="text-xs text-emerald-600 font-medium">Ready</span>
    : null

  return (
    <SectionAccordion
      title="Follow-Up Email"
      isExpanded={expanded}
      onToggle={() => setExpanded((v) => !v)}
      badge={badge}
    >
      {store.loadStatus === 'idle' && (
        <button
          onClick={generate}
          className="w-full rounded-lg border-2 border-dashed border-gray-200 py-4 text-sm text-gray-400 hover:border-brand-300 hover:text-brand-500 transition-colors"
        >
          Generate follow-up email
        </button>
      )}

      {store.loadStatus === 'loading' && (
        <LoadingSpinner label="Generating email…" />
      )}

      {store.loadStatus === 'error' && (
        <ErrorBanner
          message={store.sendError ?? 'Failed to generate email'}
          onRetry={generate}
        />
      )}

      {store.loadStatus === 'ready' && (
        <div className="space-y-3">
          <RecipientCoordinator />
          {store.mode === 'view' ? <EmailBody /> : <EmailEditor />}
          <EmailActions />
        </div>
      )}
    </SectionAccordion>
  )
}
