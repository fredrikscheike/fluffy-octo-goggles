import { extractFromSalesforce } from './host-adapters/salesforce'
import { extractFromHubSpot } from './host-adapters/hubspot'
import { extractFromGmail } from './host-adapters/gmail'
import type { TranscriptContext } from '../shared/types/domain.types'

export type HostType = 'salesforce' | 'hubspot' | 'gmail' | 'unknown'

export function detectHost(): HostType {
  const host = window.location.hostname
  if (host.includes('salesforce.com')) return 'salesforce'
  if (host.includes('hubspot.com'))    return 'hubspot'
  if (host.includes('mail.google.com')) return 'gmail'
  return 'unknown'
}

export function extractTranscriptContext(): TranscriptContext | null {
  switch (detectHost()) {
    case 'salesforce': return extractFromSalesforce()
    case 'hubspot':    return extractFromHubSpot()
    case 'gmail':      return extractFromGmail()
    default:           return null
  }
}
