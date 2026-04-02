import { useStyleStore } from '../store/style.store'
import { useSessionStore } from '../store/session.store'
import { sendMessage } from './useExtensionMessage'
import { STYLE_SAMPLE_SIZE } from '../../shared/constants'
import type { ExtensionMessage } from '../../shared/types/messages.types'
import type { WritingStylePreset } from '../../shared/types/domain.types'

export function useWritingStyle() {
  const store   = useStyleStore()
  const session = useSessionStore()

  function selectPreset(preset: WritingStylePreset) {
    store.setPreset(preset)
  }

  /**
   * Fetches the ISR's sent emails, sends them to the backend for style analysis,
   * and stores the resulting LearnedStyle profile.
   */
  async function buildStyleProfile() {
    store.setProfileLoadStatus('loading')

    // Step 1: fetch sent email samples from Gmail via service worker
    const samplesResp = await sendMessage<ExtensionMessage>({
      type: 'FETCH_SENT_EMAILS',
      payload: { maxResults: STYLE_SAMPLE_SIZE },
    })

    if (samplesResp.type !== 'SENT_EMAILS_RESULT') {
      const errMsg = samplesResp.type === 'SENT_EMAILS_ERROR'
        ? samplesResp.payload.message
        : 'Failed to fetch sent emails'
      store.setProfileLoadStatus('error', errMsg)
      return
    }

    const { samples } = samplesResp.payload
    if (samples.length === 0) {
      store.setProfileLoadStatus('error', 'No sent emails found to analyse')
      return
    }

    // Step 2: send samples to backend for Claude analysis
    const profileResp = await sendMessage<ExtensionMessage>({
      type: 'BUILD_STYLE_PROFILE',
      payload: {
        emailSamples: samples,
        userEmail:    session.userEmail ?? '',
      },
    })

    if (profileResp.type === 'STYLE_PROFILE_RESULT') {
      store.setLearnedStyle(profileResp.payload.learnedStyle)
      // Also switch preset to match_my_style automatically after a successful build
      store.setPreset('match_my_style')
    } else if (profileResp.type === 'STYLE_PROFILE_ERROR') {
      store.setProfileLoadStatus('error', profileResp.payload.message)
    }
  }

  /**
   * Loads a previously persisted LearnedStyle from extension storage (via service worker).
   */
  async function loadStoredProfile() {
    const resp = await sendMessage<ExtensionMessage>({ type: 'GET_LEARNED_STYLE' })
    if (resp.type === 'LEARNED_STYLE_RESULT' && resp.payload.learnedStyle) {
      store.setLearnedStyle(resp.payload.learnedStyle)
    }
  }

  return { selectPreset, buildStyleProfile, loadStoredProfile }
}
