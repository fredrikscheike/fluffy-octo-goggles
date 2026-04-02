import type { ExtensionMessage } from '../../shared/types/messages.types'

/**
 * Typed wrapper around chrome.runtime.sendMessage.
 * Returns a promise that resolves with the response message.
 */
export function sendMessage<T extends ExtensionMessage>(msg: ExtensionMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(msg, (response: T) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
      } else {
        resolve(response)
      }
    })
  })
}

/**
 * Add a listener for messages broadcast from the service worker.
 * Returns a cleanup function.
 */
export function onMessage(
  handler: (msg: ExtensionMessage) => void
): () => void {
  const listener = (msg: ExtensionMessage) => handler(msg)
  chrome.runtime.onMessage.addListener(listener)
  return () => chrome.runtime.onMessage.removeListener(listener)
}
