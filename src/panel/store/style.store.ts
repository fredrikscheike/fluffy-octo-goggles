import { create } from 'zustand'
import type { LearnedStyle, LoadStatus, WritingStylePreset } from '../../shared/types/domain.types'

interface StyleState {
  preset: WritingStylePreset
  learnedStyle: LearnedStyle | null
  profileLoadStatus: LoadStatus
  profileError: string | null

  setPreset: (preset: WritingStylePreset) => void
  setLearnedStyle: (style: LearnedStyle) => void
  setProfileLoadStatus: (status: LoadStatus, error?: string) => void
  reset: () => void
}

export const useStyleStore = create<StyleState>((set) => ({
  preset:            'match_my_style',
  learnedStyle:      null,
  profileLoadStatus: 'idle',
  profileError:      null,

  setPreset: (preset) => set({ preset }),

  setLearnedStyle: (learnedStyle) =>
    set({ learnedStyle, profileLoadStatus: 'ready', profileError: null }),

  setProfileLoadStatus: (profileLoadStatus, error) =>
    set({ profileLoadStatus, profileError: error ?? null }),

  reset: () =>
    set({ preset: 'match_my_style', learnedStyle: null, profileLoadStatus: 'idle', profileError: null }),
}))
