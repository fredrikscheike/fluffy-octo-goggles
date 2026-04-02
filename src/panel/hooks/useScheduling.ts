import { useScheduleStore } from '../store/schedule.store'
import { useEmailStore } from '../store/email.store'
import { sendMessage } from './useExtensionMessage'
import type { ExtensionMessage } from '../../shared/types/messages.types'

export function useScheduling() {
  const store = useScheduleStore()
  const email = useEmailStore()

  async function approveSchedule() {
    const { suggestion, editedStart, editedEnd } = store
    if (!suggestion) return

    store.setEventStatus('creating')

    const attendees = [...email.to, ...email.cc].map((r) => r.email)

    const resp = await sendMessage<ExtensionMessage>({
      type: 'CREATE_CALENDAR_EVENT',
      payload: {
        title:          suggestion.title,
        description:    suggestion.description,
        start:          editedStart || suggestion.suggestedStart,
        end:            editedEnd   || suggestion.suggestedEnd,
        attendeeEmails: attendees,
      },
    })

    if (resp.type === 'EVENT_CREATED') {
      store.setEventStatus('created', resp.payload.htmlLink)
    } else if (resp.type === 'EVENT_CREATE_ERROR') {
      store.setEventStatus('error', undefined, resp.payload.message)
    }
  }

  function declineSchedule() {
    store.decline()
  }

  return { approveSchedule, declineSchedule }
}
