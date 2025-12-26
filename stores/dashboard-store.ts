/**
 * Dashboard Store - Zustand store for Creative Journey Dashboard
 * Manages card order, monthly goals, and celebration states
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DashboardCardId, CelebrationTrigger } from '@/types/dashboard.types'

// Default values
const DEFAULT_CARD_ORDER: DashboardCardId[] = ['credits', 'creatives', 'monthly', 'speed']
const DEFAULT_MONTHLY_GOAL = 50

interface DashboardState {
  // Card arrangement
  cardOrder: DashboardCardId[]
  isReordering: boolean

  // Monthly goal
  monthlyGoal: number
  isGoalModalOpen: boolean

  // Journey state
  currentProgress: number
  lastCelebratedMilestone: number | null

  // Celebration
  celebration: CelebrationTrigger | null
  showCelebration: boolean

  // Expanded card (hover state)
  expandedCard: DashboardCardId | null

  // Loading states
  isLoading: boolean
  isSaving: boolean
  error: string | null

  // Hydration flag
  _hasHydrated: boolean
}

interface DashboardActions {
  // Card order
  setCardOrder: (order: DashboardCardId[]) => void
  reorderCards: (activeId: DashboardCardId, overId: DashboardCardId) => void
  resetCardOrder: () => void

  // Monthly goal
  setMonthlyGoal: (goal: number) => void
  openGoalModal: () => void
  closeGoalModal: () => void

  // Journey
  setCurrentProgress: (progress: number) => void
  checkMilestone: (progress: number) => void

  // Celebration
  triggerCelebration: (celebration: CelebrationTrigger) => void
  dismissCelebration: () => void

  // Card expansion
  setExpandedCard: (cardId: DashboardCardId | null) => void

  // Loading
  setLoading: (loading: boolean) => void
  setSaving: (saving: boolean) => void
  setError: (error: string | null) => void

  // Hydration
  setHasHydrated: (state: boolean) => void

  // Reset
  reset: () => void
}

type DashboardStore = DashboardState & DashboardActions

const initialState: DashboardState = {
  cardOrder: DEFAULT_CARD_ORDER,
  isReordering: false,
  monthlyGoal: DEFAULT_MONTHLY_GOAL,
  isGoalModalOpen: false,
  currentProgress: 0,
  lastCelebratedMilestone: null,
  celebration: null,
  showCelebration: false,
  expandedCard: null,
  isLoading: false,
  isSaving: false,
  error: null,
  _hasHydrated: false,
}

// Milestone thresholds (percentages of goal)
const MILESTONE_PERCENTAGES = [10, 25, 50, 75, 100]

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Card order management
      setCardOrder: (order) => {
        set({ cardOrder: order, isReordering: false })
      },

      reorderCards: (activeId, overId) => {
        const { cardOrder } = get()
        const oldIndex = cardOrder.indexOf(activeId)
        const newIndex = cardOrder.indexOf(overId)

        if (oldIndex === -1 || newIndex === -1) return

        const newOrder = [...cardOrder]
        newOrder.splice(oldIndex, 1)
        newOrder.splice(newIndex, 0, activeId)

        set({ cardOrder: newOrder, isReordering: true })
      },

      resetCardOrder: () => {
        set({ cardOrder: DEFAULT_CARD_ORDER })
      },

      // Monthly goal
      setMonthlyGoal: (goal) => {
        const clampedGoal = Math.max(10, Math.min(500, goal))
        set({ monthlyGoal: clampedGoal })
      },

      openGoalModal: () => set({ isGoalModalOpen: true }),
      closeGoalModal: () => set({ isGoalModalOpen: false }),

      // Journey progress
      setCurrentProgress: (progress) => {
        const previousProgress = get().currentProgress
        set({ currentProgress: progress })

        // Check for milestone celebration
        if (progress > previousProgress) {
          get().checkMilestone(progress)
        }
      },

      checkMilestone: (progress) => {
        const { monthlyGoal, lastCelebratedMilestone } = get()

        // Calculate milestone values based on goal
        const milestones = MILESTONE_PERCENTAGES.map(pct => Math.round((pct / 100) * monthlyGoal))

        // Check if we crossed a new milestone
        for (const milestone of milestones) {
          if (progress >= milestone && (lastCelebratedMilestone === null || milestone > lastCelebratedMilestone)) {
            // Found a new milestone to celebrate
            const isGoalComplete = milestone === monthlyGoal

            set({
              lastCelebratedMilestone: milestone,
              celebration: {
                event: isGoalComplete ? 'goal_completed' : 'milestone_reached',
                value: milestone,
                message: isGoalComplete
                  ? `Congratulations! You've reached your monthly goal of ${monthlyGoal} creatives!`
                  : `Milestone reached: ${milestone} creatives this month!`
              },
              showCelebration: true
            })

            // Auto-dismiss after 5 seconds
            setTimeout(() => {
              get().dismissCelebration()
            }, 5000)

            return // Only celebrate one milestone at a time
          }
        }
      },

      // Celebration
      triggerCelebration: (celebration) => {
        set({ celebration, showCelebration: true })

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
          get().dismissCelebration()
        }, 5000)
      },

      dismissCelebration: () => {
        set({ showCelebration: false })
        // Clear celebration after animation
        setTimeout(() => {
          set({ celebration: null })
        }, 300)
      },

      // Card expansion
      setExpandedCard: (cardId) => {
        set({ expandedCard: cardId })
      },

      // Loading states
      setLoading: (loading) => set({ isLoading: loading }),
      setSaving: (saving) => set({ isSaving: saving }),
      setError: (error) => set({ error }),

      // Hydration
      setHasHydrated: (state) => set({ _hasHydrated: state }),

      // Reset
      reset: () => set(initialState),
    }),
    {
      name: 'yi-dashboard-store',
      version: 1,
      // Only persist user preferences, not transient state
      partialize: (state) => ({
        cardOrder: state.cardOrder,
        monthlyGoal: state.monthlyGoal,
        lastCelebratedMilestone: state.lastCelebratedMilestone,
      }),
      onRehydrateStorage: () => (state) => {
        // Mark as hydrated after rehydration completes
        state?.setHasHydrated(true)

        // Reset transient state after rehydration
        if (state) {
          state.isReordering = false
          state.isGoalModalOpen = false
          state.celebration = null
          state.showCelebration = false
          state.expandedCard = null
          state.isLoading = false
          state.isSaving = false
          state.error = null
        }
      },
    }
  )
)

// Selector hooks for performance optimization
// Use separate selectors for primitives to avoid reference issues
export const useCardOrder = () => useDashboardStore((state) => state.cardOrder)
export const useMonthlyGoal = () => useDashboardStore((state) => state.monthlyGoal)
export const useCurrentProgress = () => useDashboardStore((state) => state.currentProgress)

// For objects, use individual primitive selectors and combine in component
export const useCelebrationState = () => useDashboardStore((state) => state.celebration)
export const useShowCelebration = () => useDashboardStore((state) => state.showCelebration)
export const useDismissCelebration = () => useDashboardStore((state) => state.dismissCelebration)

// Convenience hook that combines celebration state (use in components that need all)
export function useCelebration() {
  const celebration = useCelebrationState()
  const showCelebration = useShowCelebration()
  const dismiss = useDismissCelebration()
  return { celebration, showCelebration, dismiss }
}

// Expanded card selectors
export const useExpandedCardId = () => useDashboardStore((state) => state.expandedCard)
export const useSetExpandedCard = () => useDashboardStore((state) => state.setExpandedCard)

// Convenience hook for expanded card
export function useExpandedCard() {
  const expandedCard = useExpandedCardId()
  const setExpandedCard = useSetExpandedCard()
  return { expandedCard, setExpandedCard }
}

// Goal modal selectors
export const useGoalModalOpen = () => useDashboardStore((state) => state.isGoalModalOpen)
export const useOpenGoalModal = () => useDashboardStore((state) => state.openGoalModal)
export const useCloseGoalModal = () => useDashboardStore((state) => state.closeGoalModal)

// Convenience hook for goal modal
export function useGoalModal() {
  const isOpen = useGoalModalOpen()
  const open = useOpenGoalModal()
  const close = useCloseGoalModal()
  const goal = useMonthlyGoal()
  const setGoal = useDashboardStore((state) => state.setMonthlyGoal)
  return { isOpen, open, close, goal, setGoal }
}
