import { createRoot } from 'react-dom/client'
import { useEffect, useState } from 'react'
import { STORAGE_KEYS, DEFAULT_BACKEND_URL } from '../shared/constants'

function Popup() {
  const [backendUrl, setBackendUrl] = useState(DEFAULT_BACKEND_URL)
  const [apiKey,     setApiKey]     = useState('')
  const [saved,      setSaved]      = useState(false)
  const [userEmail,  setUserEmail]  = useState<string | null>(null)

  useEffect(() => {
    chrome.storage.local.get([STORAGE_KEYS.BACKEND_URL, STORAGE_KEYS.API_KEY]).then((r) => {
      if (r[STORAGE_KEYS.BACKEND_URL]) setBackendUrl(r[STORAGE_KEYS.BACKEND_URL] as string)
      if (r[STORAGE_KEYS.API_KEY])     setApiKey(r[STORAGE_KEYS.API_KEY] as string)
    })
    chrome.storage.session.get([STORAGE_KEYS.USER_EMAIL]).then((r) => {
      if (r[STORAGE_KEYS.USER_EMAIL]) setUserEmail(r[STORAGE_KEYS.USER_EMAIL] as string)
    })
  }, [])

  async function save() {
    await chrome.storage.local.set({
      [STORAGE_KEYS.BACKEND_URL]: backendUrl.trim().replace(/\/$/, ''),
      [STORAGE_KEYS.API_KEY]:     apiKey.trim(),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const s = {
    wrap:    { padding: '16px', minWidth: '300px', fontFamily: 'system-ui, sans-serif' },
    header:  { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' },
    logo:    { width: '28px', height: '28px', borderRadius: '8px', background: '#4f6ef7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    title:   { margin: 0, fontWeight: 700, fontSize: '14px', color: '#111' },
    email:   { margin: 0, fontSize: '11px', color: '#6b7280' },
    status:  { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '8px 12px', marginBottom: '12px', fontSize: '12px', color: '#166534' },
    label:   { display: 'block', fontSize: '11px', fontWeight: 600 as const, color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
    input:   { width: '100%', boxSizing: 'border-box' as const, padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '12px', outline: 'none', marginBottom: '10px' },
    btn:     (ok: boolean) => ({ width: '100%', padding: '7px', background: ok ? '#10b981' : '#4f6ef7', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600 as const, cursor: 'pointer' }),
  }

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div style={s.logo}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M20 4H4a2 2 0 00-2 2v10a2 2 0 002 2h4l4 4 4-4h4a2 2 0 002-2V6a2 2 0 00-2-2z"
              stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 10h6M9 14h4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <p style={s.title}>Post-Call Assistant</p>
          {userEmail && <p style={s.email}>{userEmail}</p>}
        </div>
      </div>

      <div style={s.status}>
        Active on Gmail, Salesforce, and HubSpot. Open an email in Gmail — the blue button will pulse when content is ready.
      </div>

      <label style={s.label}>Backend URL</label>
      <input
        style={s.input}
        value={backendUrl}
        onChange={(e) => setBackendUrl(e.target.value)}
        placeholder="http://localhost:3000"
        spellCheck={false}
      />

      <label style={s.label}>API Key</label>
      <input
        type="password"
        style={s.input}
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="Your X-Extension-Key"
      />

      <button onClick={save} style={s.btn(saved)}>
        {saved ? 'Saved ✓' : 'Save'}
      </button>
    </div>
  )
}

const root = createRoot(document.getElementById('root')!)
root.render(<Popup />)
