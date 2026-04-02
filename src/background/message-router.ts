import { getAccessToken, getUserEmail } from './auth'
import { analyzeTranscript, buildStyleProfile } from './api-client'
import { sendEmail, fetchSentEmailSamples } from './gmail'
import { createCalendarEvent } from './calendar'
import { STORAGE_KEYS } from '../shared/constants'
import type { ExtensionMessage } from '../shared/types/messages.types'
import type { LearnedStyle } from '../shared/types/domain.types'

type Sender = chrome.runtime.MessageSender
type SendResponse = (response: ExtensionMessage) => void

export function registerMessageRouter(): void {
  chrome.runtime.onMessage.addListener(
    (message: ExtensionMessage, _sender: Sender, sendResponse: SendResponse) => {
      // Must return true to signal async response
      handleMessage(message, sendResponse)
      return true
    }
  )
}

async function handleMessage(msg: ExtensionMessage, reply: SendResponse): Promise<void> {
  try {
    switch (msg.type) {
      case 'PANEL_OPEN': {
        await getAccessToken()
        const userEmail = await getUserEmail()
        reply({ type: 'SESSION_READY', payload: { userEmail: userEmail ?? '' } })
        break
      }

      case 'GENERATE_ALL': {
        const result = await analyzeTranscript(msg.payload)
        if (result.ok) {
          reply({ type: 'GENERATE_ALL_RESULT', payload: result.data })
        } else {
          reply({ type: 'GENERATE_ALL_ERROR', payload: result.error })
        }
        break
      }

      case 'BUILD_STYLE_PROFILE': {
        const result = await buildStyleProfile(msg.payload)
        if (result.ok) {
          // Persist learned style so it survives service worker restarts
          await chrome.storage.local.set({
            [STORAGE_KEYS.LEARNED_STYLE]: result.data.learnedStyle,
          })
          reply({ type: 'STYLE_PROFILE_RESULT', payload: result.data })
        } else {
          reply({ type: 'STYLE_PROFILE_ERROR', payload: result.error })
        }
        break
      }

      case 'FETCH_SENT_EMAILS': {
        const result = await fetchSentEmailSamples(msg.payload.maxResults)
        if (result.ok) {
          reply({ type: 'SENT_EMAILS_RESULT', payload: result.data })
        } else {
          reply({ type: 'SENT_EMAILS_ERROR', payload: result.error })
        }
        break
      }

      case 'SEND_EMAIL': {
        const result = await sendEmail(msg.payload)
        if (result.ok) {
          reply({ type: 'EMAIL_SENT', payload: result.data })
        } else {
          reply({ type: 'EMAIL_SEND_ERROR', payload: result.error })
        }
        break
      }

      case 'CREATE_CALENDAR_EVENT': {
        const result = await createCalendarEvent(msg.payload)
        if (result.ok) {
          reply({ type: 'EVENT_CREATED', payload: result.data })
        } else {
          reply({ type: 'EVENT_CREATE_ERROR', payload: result.error })
        }
        break
      }

      case 'STORE_LEARNED_STYLE': {
        await chrome.storage.local.set({ [STORAGE_KEYS.LEARNED_STYLE]: msg.payload })
        break
      }

      case 'GET_LEARNED_STYLE': {
        const result = await chrome.storage.local.get(STORAGE_KEYS.LEARNED_STYLE)
        const learnedStyle = (result[STORAGE_KEYS.LEARNED_STYLE] as LearnedStyle | undefined) ?? null
        reply({ type: 'LEARNED_STYLE_RESULT', payload: { learnedStyle } })
        break
      }

      default:
        break
    }
  } catch (err) {
    console.error('[PostCallAssistant] message-router error:', err)
    reply({
      type: 'GENERATE_ALL_ERROR',
      payload: { code: 'INTERNAL_ERROR', message: String(err) },
    })
  }
}
