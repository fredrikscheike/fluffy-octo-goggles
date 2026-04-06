import { DEFAULT_BACKEND_URL, STORAGE_KEYS } from '../shared/constants'
import type { AnalyzeRequest, AnalyzeResponse, ApiError, Result, StyleProfileRequest, StyleProfileResponse } from '../shared/types/api.types'

async function getConfig(): Promise<{ url: string; apiKey: string }> {
  const result = await chrome.storage.local.get([STORAGE_KEYS.BACKEND_URL, STORAGE_KEYS.API_KEY])
  return {
    url:    ((result[STORAGE_KEYS.BACKEND_URL] as string | undefined) ?? DEFAULT_BACKEND_URL).replace(/\/$/, ''),
    apiKey: (result[STORAGE_KEYS.API_KEY]     as string | undefined) ?? '',
  }
}

async function post<TReq, TRes>(path: string, body: TReq): Promise<Result<TRes>> {
  const { url, apiKey } = await getConfig()

  let resp: Response
  try {
    resp = await fetch(`${url}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Extension-Key': apiKey,
      },
      body: JSON.stringify(body),
    })
  } catch (e) {
    return { ok: false, error: { code: 'INTERNAL_ERROR', message: String(e) } }
  }

  if (resp.status === 429) {
    const retryAfterMs = Number(resp.headers.get('Retry-After') ?? 5) * 1000
    return { ok: false, error: { code: 'RATE_LIMITED', message: 'Rate limited', retryAfterMs } }
  }

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({})) as Partial<ApiError>
    return { ok: false, error: { code: err.code ?? 'INTERNAL_ERROR', message: err.message ?? `HTTP ${resp.status}` } }
  }

  const data = await resp.json() as TRes
  return { ok: true, data }
}

export async function analyzeTranscript(req: AnalyzeRequest): Promise<Result<AnalyzeResponse>> {
  return post<AnalyzeRequest, AnalyzeResponse>('/api/analyze', req)
}

export async function buildStyleProfile(req: StyleProfileRequest): Promise<Result<StyleProfileResponse>> {
  return post<StyleProfileRequest, StyleProfileResponse>('/api/style-profile', req)
}
