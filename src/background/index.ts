import { registerMessageRouter } from './message-router'
import { KEEPALIVE_ALARM } from '../shared/constants'

// Register all message handlers
registerMessageRouter()

// MV3 service workers terminate after ~30s of inactivity.
// Use an alarm to keep it alive during active user sessions.
chrome.alarms.create(KEEPALIVE_ALARM, { periodInMinutes: 0.4 })
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === KEEPALIVE_ALARM) {
    // no-op — the alarm firing is enough to wake the service worker
  }
})

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    chrome.tabs.create({ url: 'src/popup/popup.html?onboarding=true' })
  }
})
