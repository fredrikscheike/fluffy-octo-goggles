let shadowHost: HTMLDivElement | null = null
let shadowRoot: ShadowRoot | null = null

/**
 * Creates a shadow DOM container appended to document.body.
 * Uses closed mode to prevent host-page JS from accessing panel internals.
 * Returns the element React should mount into.
 */
export function mountShadowContainer(panelCss: string): HTMLElement {
  if (shadowHost) {
    return shadowRoot!.getElementById('panel-root')!
  }

  shadowHost = document.createElement('div')
  shadowHost.id = 'post-call-assistant-host'
  // Position fixed so it overlays the page without affecting layout
  shadowHost.style.cssText = [
    'position: fixed',
    'top: 0',
    'right: 0',
    'width: 420px',
    'height: 100vh',
    'z-index: 2147483647',
    'pointer-events: none',
  ].join('; ')

  document.body.appendChild(shadowHost)

  // closed shadow root — host page JS cannot reach inside
  shadowRoot = shadowHost.attachShadow({ mode: 'closed' })

  // Inject Tailwind output into the shadow root for style isolation
  const style = document.createElement('style')
  style.textContent = panelCss
  shadowRoot.appendChild(style)

  // Mount point for React
  const root = document.createElement('div')
  root.id = 'panel-root'
  root.style.cssText = 'height: 100%; pointer-events: auto;'
  shadowRoot.appendChild(root)

  return root
}

export function unmountShadowContainer(): void {
  shadowHost?.remove()
  shadowHost = null
  shadowRoot = null
}

export function isMounted(): boolean {
  return shadowHost !== null
}
