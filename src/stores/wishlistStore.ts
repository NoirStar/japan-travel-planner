import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface WishlistItem {
  placeId: string
  addedAt: string // ISO
  memo?: string
}

interface WishlistState {
  items: WishlistItem[]
  addToWishlist: (placeId: string) => void
  removeFromWishlist: (placeId: string) => void
  isInWishlist: (placeId: string) => boolean
  updateMemo: (placeId: string, memo: string) => void
  clear: () => void
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      addToWishlist: (placeId) => {
        if (get().items.some((i) => i.placeId === placeId)) return
        set((s) => ({
          items: [{ placeId, addedAt: new Date().toISOString() }, ...s.items],
        }))
      },

      removeFromWishlist: (placeId) =>
        set((s) => ({ items: s.items.filter((i) => i.placeId !== placeId) })),

      isInWishlist: (placeId) => get().items.some((i) => i.placeId === placeId),

      updateMemo: (placeId, memo) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.placeId === placeId ? { ...i, memo } : i,
          ),
        })),

      clear: () => set({ items: [] }),
    }),
    { name: "wishlist" },
  ),
)
