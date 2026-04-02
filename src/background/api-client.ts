import { BACKEND_BASE_URL } from '../shared/constants'
import type { AnalyzeRequest, AnalyzeResponse, ApiError, Result, StyleProfileRequest, StyleProfileResponse } from '../shared/types/api.types'

async function post<TReq, TRes>(path: string, body: TReq): Promise<Result<TRes>> {
  const apiKey = await getApiKey()

  let resp: Response
  try {
    resp = await fetch(`${BACKEND_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Extension-Key': apiKey,
      },
      body: JSON.stringify(body),
    })
  } catch (e) {
    return {
      ok: false,
      error: { code: 'INTERNAL_ERROR', message: String(e) },
    }
  }

  if (resp.status === 429) {
    const retryAfterMs = Number(resp.headers.get('Retry-After') ?? 5) * 1000
    return {
      ok: false,
      error: { code: 'RATE_LIMITED', message: 'Rate limited', retryAfterMs },
    }
  }

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({})) as Partial<ApiError>
    return {
      ok: false,
      error: {
        code: err.code ?? 'INTERNAL_ERROR',
        message: err.message ?? `HTTP ${resp.status}`,
      },
    }
  }

  const data = await resp.json() as TRes
  return { ok: true, data }
}

async function getApiKey(): Promise<string> {
  const result = await chrome.storage.local.get('api_key')
  return (result['api_key'] as string | undefined) ?? ''
}

export async function analyzeTranscript(req: AnalyzeRequest): Promise<Result<AnalyzeResponse>> {
  return post<AnalyzeRequest, AnalyzeResponse>('/api/analyze', req)
}

export async function buildStyleProfile(req: StyleProfileRequest): Promise<Result<StyleProfileResponse>> {
  return post<StyleProfileRequest, StyleProfileResponse>('/api/style-profile', req)
}
