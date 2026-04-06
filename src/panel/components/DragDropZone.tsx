import { useState, useCallback } from 'react'
import { getCapturedEmail } from '../../content/drag-interceptor'
import { useSessionStore } from '../store/session.store'
import type { TranscriptContext } from '../../shared/types/domain.types'
import type { ExtensionMessage } from '../../shared/types/messages.types'

interface Props {
  onTranscriptLoaded: (ctx: TranscriptContext) => void
}

type ZoneState = 'idle' | 'hover' | 'loading' | 'done' | 'error'

export function DragDropZone({ onTranscriptLoaded }: Props) {
  const [state, setState] = useState<ZoneState>('idle')
  const [statusText, setStatusText] = useState('')
  const session = useSessionStore()

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setState('hover')
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setState('idle')
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setState('loading')
      setStatusText('Fetching email…')

      const captured = getCapturedEmail()

      // If we have a Gmail message ID, fetch the full body via background
      if (captured?.messageId) {
        const response = await new Promise<ExtensionMessage>((resolve) => {
          chrome.runtime.sendMessage(
            { type: 'FETCH_EMAIL_CONTENT', payload: { messageId: captured.messageId } },
            resolve,
          )
        })

        if (response?.type === 'EMAIL_CONTENT_RESULT') {
          const { subject, from, body } = response.payload
          const transcript = [
            subject ? `Subject: ${subject}` : '',
            from    ? `From: ${from}` : '',
            '',
            body,
          ]
            .filter((l) => l !== undefined)
            .join('\n')
            .trim()

          onTranscriptLoaded({
            transcript,
            participantNames: from ? [from.replace(/<.*>/, '').trim()] : [],
            contactEmails: [from?.match(/<(.+)>/)?.[1] ?? ''].filter(Boolean),
            crmRecordId: null,
            hostType: 'gmail',
          })

          setState('done')
          setStatusText(`Loaded: ${subject || 'email'}`)
          return
        }

        if (response?.type === 'EMAIL_CONTENT_ERROR') {
          setState('error')
          setStatusText(response.payload.message)
          return
        }
      }

      // Fallback: use whatever plain text the drag event carries + snippet from DOM capture
      const dragText = e.dataTransfer.getData('text/plain')
      const fallback = [
        captured?.subject ? `Subject: ${captured.subject}` : '',
        captured?.sender  ? `From: ${captured.sender}` : '',
        '',
        dragText || captured?.snippet || '',
      ]
        .join('\n')
        .trim()

      if (fallback.length > 20) {
        onTranscriptLoaded({
          transcript: fallback,
          participantNames: captured?.sender ? [captured.sender] : [],
          contactEmails: [],
          crmRecordId: null,
          hostType: 'gmail',
        })
        setState('done')
        setStatusText(captured?.subject ? `Loaded: ${captured.subject}` : 'Email loaded')
      } else {
        setState('error')
        setStatusText('Could not read email content')
      }
    },
    [onTranscriptLoaded, session],
  )

  const reset = () => {
    setState('idle')
    setStatusText('')
  }

  const borderColor =
    state === 'hover'   ? 'border-indigo-500' :
    state === 'done'    ? 'border-green-500'  :
    state === 'error'   ? 'border-red-400'    :
                          'border-gray-300 dark:border-gray-600'

  const bgColor =
    state === 'hover'   ? 'bg-indigo-50 dark:bg-indigo-900/20' :
    state === 'done'    ? 'bg-green-50 dark:bg-green-900/20'   :
    state === 'error'   ? 'bg-red-50 dark:bg-red-900/20'       :
                          'bg-gray-50 dark:bg-gray-800/50'

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative flex flex-col items-center justify-center gap-2
        rounded-lg border-2 border-dashed px-4 py-5 text-center
        transition-colors duration-150 select-none
        ${borderColor} ${bgColor}
      `}
    >
      {state === 'idle' && (
        <>
          <svg className="h-7 w-7 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Drag an email here
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            from your Gmail inbox list
          </p>
        </>
      )}

      {state === 'hover' && (
        <>
          <svg className="h-7 w-7 text-indigo-500 animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">Drop to load</p>
        </>
      )}

      {state === 'loading' && (
        <>
          <svg className="h-6 w-6 text-indigo-500 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-xs text-indigo-600 dark:text-indigo-400">{statusText}</p>
        </>
      )}

      {state === 'done' && (
        <div className="flex w-full items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <svg className="h-4 w-4 flex-shrink-0 text-green-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-xs text-green-700 dark:text-green-400 truncate">{statusText}</p>
          </div>
          <button onClick={reset} className="flex-shrink-0 text-xs text-gray-400 hover:text-gray-600 underline">
            Clear
          </button>
        </div>
      )}

      {state === 'error' && (
        <div className="flex w-full items-center justify-between gap-2">
          <p className="text-xs text-red-600 dark:text-red-400 truncate">{statusText}</p>
          <button onClick={reset} className="flex-shrink-0 text-xs text-gray-400 hover:text-gray-600 underline">
            Retry
          </button>
        </div>
      )}
    </div>
  )
}
