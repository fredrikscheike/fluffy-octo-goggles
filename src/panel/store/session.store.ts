import { create } from 'zustand'
import type { TranscriptContext } from '../../shared/types/domain.types'

interface SessionState {
  userEmail: string | null
  isAuthenticated: boolean
  transcriptContext: TranscriptContext | null
  setAuthenticated: (email: string) => void
  setTranscriptContext: (ctx: TranscriptContext) => void
  reset: () => void
}

export const useSessionStore = create<SessionState>((set) => ({
  userEmail:         null,
  isAuthenticated:   false,
  transcriptContext: null,

  setAuthenticated: (email) => set({ isAuthenticated: true, userEmail: email }),

  setTranscriptContext: (ctx) => set({ transcriptContext: ctx }),

  reset: () => set({ userEmail: null, isAuthenticated: false, transcriptContext: null }),
}))
