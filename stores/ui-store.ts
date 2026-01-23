import { create } from 'zustand'

interface UIState {
  // Sidebar state
  sidebarOpen: boolean
  sidebarCollapsed: boolean

  // Create mode - hides parent sidebar for child sidebar
  createModeActive: boolean

  // Analytics mode - hides parent sidebar for analytics sidebar
  analyticsModeActive: boolean

  // Modals
  activeModal: string | null
  modalData: Record<string, unknown> | null

  // Loading states
  globalLoading: boolean
  loadingMessage: string | null

  // Actions
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  enterCreateMode: () => void
  exitCreateMode: () => void
  enterAnalyticsMode: () => void
  exitAnalyticsMode: () => void
  openModal: (modalId: string, data?: Record<string, unknown>) => void
  closeModal: () => void
  setGlobalLoading: (loading: boolean, message?: string) => void
}

export const useUIStore = create<UIState>()((set) => ({
  // Initial state
  sidebarOpen: true,
  sidebarCollapsed: false,
  createModeActive: false,
  analyticsModeActive: false,
  activeModal: null,
  modalData: null,
  globalLoading: false,
  loadingMessage: null,

  // Actions
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),

  enterCreateMode: () => set({ createModeActive: true }),

  exitCreateMode: () => set({ createModeActive: false }),

  enterAnalyticsMode: () => set({ analyticsModeActive: true }),

  exitAnalyticsMode: () => set({ analyticsModeActive: false }),

  openModal: (activeModal, modalData) => set({ activeModal, modalData: modalData ?? null }),

  closeModal: () => set({ activeModal: null, modalData: null }),

  setGlobalLoading: (globalLoading, loadingMessage) => set({ globalLoading, loadingMessage: loadingMessage ?? null }),
}))
