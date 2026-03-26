import { create } from "zustand"
import { persist } from "zustand/middleware"

interface UIState {
  isMapDarkMode: boolean
  toggleMapDarkMode: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isMapDarkMode: false,
      toggleMapDarkMode: () =>
        set((state) => ({ isMapDarkMode: !state.isMapDarkMode })),
    }),
    {
      name: "ui-store",
      onRehydrateStorage: () => () => {
        // Always dark mode
        document.documentElement.classList.add("dark")
      },
    },
  ),
)
