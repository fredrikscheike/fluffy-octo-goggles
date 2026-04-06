import { useEffect } from 'react'
import { PanelShell } from './components/layout/PanelShell'
import { EmailReviewPanel } from './components/email/EmailReviewPanel'
import { SchedulingPanel } from './components/scheduling/SchedulingPanel'
import { WritingStylePanel } from './components/style/WritingStylePanel'
import { DragDropZone } from './components/DragDropZone'
import { useSessionStore } from './store/session.store'
import { useEmailStore } from './store/email.store'
import { useScheduleStore } from './store/schedule.store'
import { useWritingStyle } from './hooks/useWritingStyle'
import { onMessage } from './hooks/useExtensionMessage'
import type { TranscriptContext } from '../shared/types/domain.types'
import type { ExtensionMessage } from '../shared/types/messages.types'

interface AppProps {
  initialContext: TranscriptContext | null
  onClose: () => void
}

export default function App({ initialContext, onClose }: AppProps) {
  const session    = useSessionStore()
  const emailStore = useEmailStore()
  const schedStore = useScheduleStore()
  const { loadStoredProfile } = useWritingStyle()

  useEffect(() => {
    if (initialContext) {
      session.setTranscriptContext(initialContext)
    }

    // Load any previously persisted style profile
    loadStoredProfile()

    // Listen for service worker broadcasts (SESSION_READY, GENERATE_ALL_RESULT, etc.)
    const cleanup = onMessage((msg: ExtensionMessage) => {
      switch (msg.type) {
        case 'SESSION_READY':
          session.setAuthenticated(msg.payload.userEmail)
          break

        case 'GENERATE_ALL_RESULT': {
          emailStore.setDraft(msg.payload.email)
          emailStore.setRecipients(
            msg.payload.recipients.to,
            msg.payload.recipients.cc,
            msg.payload.recipients.bcc,
          )
          emailStore.setLoadStatus('ready')
          schedStore.setSuggestion(msg.payload.schedule)
          schedStore.setLoadStatus('ready')
          break
        }

        case 'GENERATE_ALL_ERROR':
          emailStore.setLoadStatus('error', msg.payload.message)
          break

        default:
          break
      }
    })

    return () => {
      cleanup()
      session.reset()
      emailStore.reset()
      schedStore.reset()
    }
  }, [])

  return (
    <PanelShell onClose={onClose}>
      {!session.transcriptContext?.transcript && (
        <DragDropZone onTranscriptLoaded={(ctx) => session.setTranscriptContext(ctx)} />
      )}
      <WritingStylePanel />
      <EmailReviewPanel />
      <SchedulingPanel />
    </PanelShell>
  )
}
