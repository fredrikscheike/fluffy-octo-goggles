export const BACKEND_BASE_URL = 'https://your-backend.example.com'

export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
]

export const STORAGE_KEYS = {
  ACCESS_TOKEN:    'access_token',
  TOKEN_EXPIRY:    'token_expiry',
  USER_EMAIL:      'user_email',
  LEARNED_STYLE:   'learned_style',
  STYLE_PRESET:    'style_preset',
} as const

/** Number of sent emails to sample for style analysis */
export const STYLE_SAMPLE_SIZE = 30

/** Token expiry buffer in ms — refresh if less than this remains */
export const TOKEN_EXPIRY_BUFFER_MS = 60_000

/** Service worker keepalive alarm name */
export const KEEPALIVE_ALARM = 'sw-keepalive'
