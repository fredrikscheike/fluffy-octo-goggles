const BTN_ID = 'pca-trigger-btn'

export function injectTriggerButton(): HTMLButtonElement {
  const existing = document.getElementById(BTN_ID)
  if (existing) return existing as HTMLButtonElement

  const btn = document.createElement('button')
  btn.id = BTN_ID
  btn.title = 'Open Post-Call Assistant'
  btn.setAttribute('aria-label', 'Open Post-Call Assistant')

  btn.innerHTML = `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 4H4a2 2 0 00-2 2v10a2 2 0 002 2h4l4 4 4-4h4a2 2 0 002-2V6a2 2 0 00-2-2z"
            stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M9 10h6M9 14h4" stroke="white" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `

  btn.style.cssText = [
    'position: fixed',
    'bottom: 24px',
    'right: 24px',
    'width: 52px',
    'height: 52px',
    'border-radius: 50%',
    'background: #4f6ef7',
    'border: none',
    'cursor: pointer',
    'display: flex',
    'align-items: center',
    'justify-content: center',
    'box-shadow: 0 4px 12px rgba(79,110,247,0.4)',
    'z-index: 2147483646',
    'transition: transform 0.15s ease, box-shadow 0.15s ease',
  ].join('; ')

  btn.addEventListener('mouseenter', () => {
    btn.style.transform = 'scale(1.1)'
    btn.style.boxShadow = '0 6px 18px rgba(79,110,247,0.5)'
  })
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = 'scale(1)'
    btn.style.boxShadow = btn.dataset['ready']
      ? '0 0 0 4px rgba(79,110,247,0.3), 0 4px 12px rgba(79,110,247,0.4)'
      : '0 4px 12px rgba(79,110,247,0.4)'
  })

  document.body.appendChild(btn)
  return btn
}

/**
 * Signals that email content is ready — adds a pulsing ring to the button
 * and a small badge so the user knows clicking will open a pre-loaded panel.
 */
export function markButtonReady(btn: HTMLButtonElement): void {
  btn.dataset['ready'] = '1'
  btn.title = 'Open Post-Call Assistant — email loaded'
  btn.style.boxShadow = '0 0 0 4px rgba(79,110,247,0.3), 0 4px 12px rgba(79,110,247,0.4)'

  // Inject pulse keyframe once
  if (!document.getElementById('pca-pulse-style')) {
    const style = document.createElement('style')
    style.id = 'pca-pulse-style'
    style.textContent = `
      @keyframes pca-pulse {
        0%   { box-shadow: 0 0 0 0   rgba(79,110,247,0.5), 0 4px 12px rgba(79,110,247,0.4); }
        70%  { box-shadow: 0 0 0 10px rgba(79,110,247,0),   0 4px 12px rgba(79,110,247,0.4); }
        100% { box-shadow: 0 0 0 0   rgba(79,110,247,0),   0 4px 12px rgba(79,110,247,0.4); }
      }
      #${BTN_ID}[data-ready] { animation: pca-pulse 1.8s ease-out infinite; }
    `
    document.head.appendChild(style)
  }
}

export function markButtonIdle(btn: HTMLButtonElement): void {
  delete btn.dataset['ready']
  btn.title = 'Open Post-Call Assistant'
  btn.style.animation = ''
  btn.style.boxShadow = '0 4px 12px rgba(79,110,247,0.4)'
}

export function removeTriggerButton(): void {
  document.getElementById(BTN_ID)?.remove()
}
