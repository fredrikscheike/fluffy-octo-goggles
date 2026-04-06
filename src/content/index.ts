import { createRoot } from 'react-dom/client'
import { createElement } from 'react'
import { detectHost, extractTranscriptContext } from './transcript-extractor'
import { watchForComposeWindow } from './host-adapters/gmail'
import { mountShadowContainer, unmountShadowContainer, isMounted } from './shadow-root'
import { injectTriggerButton } from './panel-trigger'
import { initDragInterceptor } from './drag-interceptor'
import type { ExtensionMessage } from '../shared/types/messages.types'

// Dynamically imported at runtime so the CSS string can be injected into shadow DOM
// The actual App import happens inside openPanel to keep the content script bundle lean
let panelOpen = false

function sendToBackground(msg: ExtensionMessage): void {
  chrome.runtime.sendMessage(msg)
}

async function openPanel(): Promise<void> {
  if (panelOpen) return

  const context = extractTranscriptContext()

  // Notify service worker — triggers OAuth if needed
  chrome.runtime.sendMessage(
    { type: 'PANEL_OPEN', payload: context ?? { transcript: '', participantNames: [], contactEmails: [], crmRecordId: null, hostType: 'unknown' } },
    (_resp: ExtensionMessage) => {
      // SESSION_READY or AUTH_ERROR arrives here; panel handles it via its own listener
    }
  )

  // Dynamically import the panel CSS (Vite inlines it as a string for shadow DOM injection)
  const { default: panelCss } = await import('../panel/styles/panel.css?inline')
  const mountPoint = mountShadowContainer(panelCss)

  // Dynamically import the React app to avoid loading React on every page load
  const { default: App } = await import('../panel/App')

  const reactRoot = createRoot(mountPoint)
  reactRoot.render(
    createElement(App, {
      initialContext: context,
      onClose: () => {
        reactRoot.unmount()
        unmountShadowContainer()
        panelOpen = false
      },
    })
  )

  panelOpen = true
}

// ---- Bootstrap ----

const host = detectHost()

if (host !== 'unknown') {
  // Inject the floating trigger button
  injectTriggerButton().addEventListener('click', openPanel)

  if (host === 'gmail') {
    watchForComposeWindow(openPanel)
    initDragInterceptor()
  }

  // SPA navigation: re-run extraction when the URL changes
  let lastHref = window.location.href
  const navObserver = new MutationObserver(() => {
    if (window.location.href !== lastHref) {
      lastHref = window.location.href
      if (isMounted()) {
        // Close stale panel on navigation
        unmountShadowContainer()
        panelOpen = false
      }
    }
  })
  navObserver.observe(document.body, { childList: true, subtree: true })
}
