import { createRoot } from 'react-dom/client'
import { useEffect, useState } from 'react'
import { STORAGE_KEYS } from '../shared/constants'

function Popup() {
  const [apiKey, setApiKey] = useState('')
  const [saved, setSaved] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    chrome.storage.local.get(['api_key']).then((r) => {
      if (r['api_key']) setApiKey(r['api_key'] as string)
    })
    chrome.storage.session.get([STORAGE_KEYS.USER_EMAIL]).then((r) => {
      if (r[STORAGE_KEYS.USER_EMAIL]) setUserEmail(r[STORAGE_KEYS.USER_EMAIL] as string)
    })
  }, [])

  async function saveApiKey() {
    await chrome.storage.local.set({ api_key: apiKey })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ padding: '16px', minWidth: '280px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <div style={{
          width: '28px', height: '28px', borderRadius: '8px',
          background: '#4f6ef7', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M20 4H4a2 2 0 00-2 2v10a2 2 0 002 2h4l4 4 4-4h4a2 2 0 002-2V6a2 2 0 00-2-2z"
              stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 10h6M9 14h4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '14px', color: '#111' }}>Post-Call Assistant</p>
          {userEmail && (
            <p style={{ margin: 0, fontSize: '11px', color: '#6b7280' }}>{userEmail}</p>
          )}
        </div>
      </div>

      {/* Status */}
      <div style={{
        background: '#f0fdf4', border: '1px solid #bbf7d0',
        borderRadius: '8px', padding: '8px 12px', marginBottom: '12px',
      }}>
        <p style={{ margin: 0, fontSize: '12px', color: '#166534' }}>
          Active on Salesforce, HubSpot, and Gmail. Click the blue button on any supported page to open the panel.
        </p>
      </div>

      {/* API Key */}
      <div style={{ marginBottom: '8px' }}>
        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Backend API Key
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your API key"
          style={{
            width: '100%', boxSizing: 'border-box', padding: '6px 10px',
            border: '1px solid #e5e7eb', borderRadius: '6px',
            fontSize: '12px', outline: 'none',
          }}
        />
      </div>

      <button
        onClick={saveApiKey}
        style={{
          width: '100%', padding: '7px', background: saved ? '#10b981' : '#4f6ef7',
          color: 'white', border: 'none', borderRadius: '6px',
          fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          transition: 'background 0.2s',
        }}
      >
        {saved ? 'Saved!' : 'Save'}
      </button>
    </div>
  )
}

const root = createRoot(document.getElementById('root')!)
root.render(<Popup />)
