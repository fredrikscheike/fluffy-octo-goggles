/**
 * Intercepts Gmail email row drag events so the panel can fetch the full
 * message when the user drops a row onto the drop zone.
 *
 * Gmail inbox rows are <tr> elements with class "zA". The thread/message ID
 * is embedded in the row's child anchor href as the fragment after the label
 * (e.g. #inbox/18fda3c...).  We also grab the sender and subject from the
 * visible DOM as a fallback for when we only have snippet text.
 */

export interface CapturedEmail {
  messageId: string | null
  subject: string
  sender: string
  snippet: string
}

let _captured: CapturedEmail | null = null

export function initDragInterceptor(): void {
  // Use capture phase so we see the event before Gmail swallows it
  document.addEventListener(
    'dragstart',
    (e: DragEvent) => {
      const target = e.target as HTMLElement
      const row = target.closest('tr.zA') as HTMLElement | null
      if (!row) {
        _captured = null
        return
      }

      // Subject: Gmail renders it inside a span with class "y6" inside the row
      const subjectEl = row.querySelector('.y6 span, .y6') as HTMLElement | null
      // Sender name: inside span.yW or .zF
      const senderEl = row.querySelector('.zF, .yW') as HTMLElement | null
      // Snippet: inside span.y2
      const snippetEl = row.querySelector('.y2') as HTMLElement | null

      // Message/thread ID from the first href fragment in the row
      let messageId: string | null = null
      const link = row.querySelector('a[href]') as HTMLAnchorElement | null
      if (link?.href) {
        // href format: https://mail.google.com/mail/u/0/#inbox/THREAD_ID
        const match = link.href.match(/#[^/]+\/([a-zA-Z0-9]+)/)
        if (match) messageId = match[1]
      }

      _captured = {
        messageId,
        subject: subjectEl?.textContent?.trim() ?? '',
        sender: senderEl?.getAttribute('email') ?? senderEl?.textContent?.trim() ?? '',
        snippet: snippetEl?.textContent?.trim() ?? '',
      }
    },
    true,
  )

  document.addEventListener('dragend', () => {
    // Keep _captured alive briefly so the drop handler can read it,
    // then clear on the next event loop tick
    setTimeout(() => { _captured = null }, 500)
  }, true)
}

export function getCapturedEmail(): CapturedEmail | null {
  return _captured
}
