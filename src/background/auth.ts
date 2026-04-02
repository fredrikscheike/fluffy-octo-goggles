import { GOOGLE_SCOPES, STORAGE_KEYS, TOKEN_EXPIRY_BUFFER_MS } from '../shared/constants'

interface StoredToken {
  accessToken: string
  expiresAt: number  // epoch ms
  userEmail: string
}

async function getStored(): Promise<StoredToken | null> {
  const result = await chrome.storage.session.get([
    STORAGE_KEYS.ACCESS_TOKEN,
    STORAGE_KEYS.TOKEN_EXPIRY,
    STORAGE_KEYS.USER_EMAIL,
  ])
  if (!result[STORAGE_KEYS.ACCESS_TOKEN]) return null
  return {
    accessToken: result[STORAGE_KEYS.ACCESS_TOKEN] as string,
    expiresAt:   result[STORAGE_KEYS.TOKEN_EXPIRY] as number,
    userEmail:   result[STORAGE_KEYS.USER_EMAIL] as string,
  }
}

async function storeToken(token: StoredToken): Promise<void> {
  await chrome.storage.session.set({
    [STORAGE_KEYS.ACCESS_TOKEN]: token.accessToken,
    [STORAGE_KEYS.TOKEN_EXPIRY]: token.expiresAt,
    [STORAGE_KEYS.USER_EMAIL]:   token.userEmail,
  })
}

async function fetchUserEmail(accessToken: string): Promise<string> {
  const resp = await fetch(
    'https://www.googleapis.com/oauth2/v2/userinfo',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  const data = await resp.json() as { email: string }
  return data.email
}

/**
 * Returns a valid access token, launching the OAuth flow if needed.
 * Throws if the user cancels or auth fails.
 */
export async function getAccessToken(): Promise<string> {
  const stored = await getStored()
  if (stored && stored.expiresAt - Date.now() > TOKEN_EXPIRY_BUFFER_MS) {
    return stored.accessToken
  }

  // Use chrome.identity to get an interactive token
  const token = await new Promise<string>((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true, scopes: GOOGLE_SCOPES }, (token) => {
      if (chrome.runtime.lastError || !token) {
        reject(new Error(chrome.runtime.lastError?.message ?? 'Auth failed'))
      } else {
        resolve(token)
      }
    })
  })

  const userEmail = await fetchUserEmail(token)

  await storeToken({
    accessToken: token,
    expiresAt:   Date.now() + 55 * 60 * 1000,  // Google tokens live ~60 min
    userEmail,
  })

  return token
}

export async function getUserEmail(): Promise<string | null> {
  const stored = await getStored()
  return stored?.userEmail ?? null
}

export async function clearToken(): Promise<void> {
  await chrome.storage.session.remove([
    STORAGE_KEYS.ACCESS_TOKEN,
    STORAGE_KEYS.TOKEN_EXPIRY,
    STORAGE_KEYS.USER_EMAIL,
  ])
}
