import { create } from "zustand"
import { persist } from "zustand/middleware"

interface UIState {
  isDarkMode: boolean
  toggleDarkMode: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isDarkMode: false,
      toggleDarkMode: () =>
        set((state) => {
          const newMode = !state.isDarkMode
          if (newMode) {
            document.documentElement.classList.add("dark")
          } else {
            document.documentElement.classList.remove("dark")
          }
          return { isDarkMode: newMode }
        }),
    }),
    {
      name: "ui-store",
      onRehydrateStorage: () => (state) => {
        if (state?.isDarkMode) {
          document.documentElement.classList.add("dark")
        }
      },
    },
  ),
)
