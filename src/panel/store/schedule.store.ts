import { create } from 'zustand'
import type { EventStatus, LoadStatus, ScheduleMode, ScheduleSuggestion } from '../../shared/types/domain.types'

interface ScheduleState {
  suggestion: ScheduleSuggestion | null
  editedStart: string   // ISO8601
  editedEnd: string
  mode: ScheduleMode
  loadStatus: LoadStatus
  eventStatus: EventStatus
  eventLink: string | null
  error: string | null

  setSuggestion: (s: ScheduleSuggestion) => void
  setMode: (mode: ScheduleMode) => void
  updateEditedStart: (iso: string) => void
  updateEditedEnd: (iso: string) => void
  setLoadStatus: (status: LoadStatus) => void
  setEventStatus: (status: EventStatus, link?: string, error?: string) => void
  decline: () => void
  reset: () => void
}

export const useScheduleStore = create<ScheduleState>((set) => ({
  suggestion:   null,
  editedStart:  '',
  editedEnd:    '',
  mode:         'view',
  loadStatus:   'idle',
  eventStatus:  'idle',
  eventLink:    null,
  error:        null,

  setSuggestion: (suggestion) =>
    set({ suggestion, editedStart: suggestion.suggestedStart, editedEnd: suggestion.suggestedEnd }),

  setMode: (mode) => set({ mode }),

  updateEditedStart: (editedStart) => set({ editedStart }),
  updateEditedEnd:   (editedEnd)   => set({ editedEnd }),

  setLoadStatus: (loadStatus) => set({ loadStatus }),

  setEventStatus: (eventStatus, link, error) =>
    set({ eventStatus, eventLink: link ?? null, error: error ?? null }),

  decline: () => set({ eventStatus: 'declined' }),

  reset: () =>
    set({
      suggestion: null, editedStart: '', editedEnd: '', mode: 'view',
      loadStatus: 'idle', eventStatus: 'idle', eventLink: null, error: null,
    }),
}))
