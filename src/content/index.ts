import { createRoot } from 'react-dom/client'
import { createElement } from 'react'
import { detectHost } from './transcript-extractor'
import { watchForComposeWindow, watchForEmailOpen } from './host-adapters/gmail'
import { mountShadowContainer, unmountShadowContainer, isMounted } from './shadow-root'
import { injectTriggerButton, markButtonReady, markButtonIdle } from './panel-trigger'
import type { ExtensionMessage } from '../shared/types/messages.types'
import type { TranscriptContext } from '../shared/types/domain.types'

let panelOpen = false
let pendingContext: TranscriptContext | null = null  // email content captured before panel opens

// ── Panel lifecycle ────────────────────────────────────────────────────────────

async function openPanel(context?: TranscriptContext | null): Promise<void> {
  if (panelOpen) {
    // Panel already open — if we have fresh context, dispatch it in
    if (context?.transcript) {
      window.dispatchEvent(new CustomEvent('pca:context-update', { detail: context }))
    }
    return
  }

  const ctx = context ?? pendingContext ?? null

  chrome.runtime.sendMessage(
    {
      type: 'PANEL_OPEN',
      payload: ctx ?? { transcript: '', participantNames: [], contactEmails: [], crmRecordId: null, hostType: 'unknown' },
    },
    (_resp: ExtensionMessage) => {},
  )

  const { default: panelCss } = await import('../panel/styles/panel.css?inline')
  const mountPoint = mountShadowContainer(panelCss)
  const { default: App } = await import('../panel/App')

  const reactRoot = createRoot(mountPoint)
  reactRoot.render(
    createElement(App, {
      initialContext: ctx,
      onClose: () => {
        reactRoot.unmount()
        unmountShadowContainer()
        panelOpen = false
      },
    }),
  )

  panelOpen = true
  pendingContext = null
}

// ── Bootstrap ──────────────────────────────────────────────────────────────────

const host = detectHost()

if (host !== 'unknown') {
  const btn = injectTriggerButton()
  btn.addEventListener('click', () => openPanel(pendingContext))

  if (host === 'gmail') {
    // Watch for compose window (existing flow)
    watchForComposeWindow(() => openPanel(null))

    // Watch for emails being opened — auto-populate context and pulse the button
    watchForEmailOpen((ctx) => {
      pendingContext = ctx
      markButtonReady(btn)

      // If the panel is already open, push the new context straight in
      if (panelOpen) {
        window.dispatchEvent(new CustomEvent('pca:context-update', { detail: ctx }))
      }
    })
  }

  // SPA navigation — close stale panel, reset button state
  let lastHref = window.location.href
  new MutationObserver(() => {
    if (window.location.href !== lastHref) {
      lastHref = window.location.href
      if (isMounted()) {
        unmountShadowContainer()
        panelOpen = false
      }
      // Clear pending context when navigating away from a thread
      if (!window.location.hash.match(/#(inbox|sent|starred|all|trash|spam|label|search)\/[a-zA-Z0-9]+/)) {
        pendingContext = null
        markButtonIdle(btn)
      }
    }
  }).observe(document.body, { childList: true, subtree: true })
}
