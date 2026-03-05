import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface UIStore {
  theme: 'light' | 'dark'
  sidebarCollapsed: boolean
  setTheme: (theme: 'light' | 'dark') => void
  toggleSidebar: () => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      theme: 'light',
      sidebarCollapsed: false,
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }))
    }),
    {
      name: 'fnw-ui-storage',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
