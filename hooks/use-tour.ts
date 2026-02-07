'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface TourState {
  // Active tour tracking
  activeTourId: string | null
  setActiveTour: (tourId: string | null) => void

  // Completed tours tracking
  completedTours: string[]
  markTourComplete: (tourId: string) => void
  isTourCompleted: (tourId: string) => boolean

  // Manual trigger
  requestTour: (tourId: string) => void
  cancelTour: () => void

  // Reset functionality
  resetTour: (tourId: string) => void
  resetAllTours: () => void
}

export const useTour = create<TourState>()(
  persist(
    (set, get) => ({
      activeTourId: null,
      completedTours: [],

      setActiveTour: (tourId) => set({ activeTourId: tourId }),

      markTourComplete: (tourId) =>
        set((state) => ({
          activeTourId: null,
          completedTours: [...new Set([...state.completedTours, tourId])]
        })),

      isTourCompleted: (tourId) =>
        get().completedTours.includes(tourId),

      requestTour: (tourId) =>
        set({ activeTourId: tourId }),

      cancelTour: () =>
        set({ activeTourId: null }),

      resetTour: (tourId) =>
        set((state) => ({
          completedTours: state.completedTours.filter(id => id !== tourId)
        })),

      resetAllTours: () =>
        set({ completedTours: [], activeTourId: null })
    }),
    {
      name: 'yi-tour-state',
      partialize: (state) => ({
        completedTours: state.completedTours
      })
    }
  )
)
