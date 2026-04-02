import type { Request, Response, NextFunction } from 'express'

/**
 * Validates the X-Extension-Key header against EXTENSION_API_KEY env var.
 * Every route is protected — the key is set once in the extension popup
 * and stored in chrome.storage.local.
 */
export function requireExtensionKey(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const expectedKey = process.env['EXTENSION_API_KEY']

  if (!expectedKey) {
    console.error('[auth] EXTENSION_API_KEY env var is not set')
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Server misconfiguration' })
    return
  }

  const providedKey = req.headers['x-extension-key']

  if (!providedKey || providedKey !== expectedKey) {
    res.status(401).json({ code: 'AUTH_FAILED', message: 'Invalid or missing X-Extension-Key' })
    return
  }

  next()
}
