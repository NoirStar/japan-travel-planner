import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Place } from "@/types/place"

/**
 * Google Places API에서 검색한 장소를 로컬에 저장하는 스토어.
 * 모든 장소 데이터는 Google Places API를 통해 동적으로 로드됩니다.
 */
interface DynamicPlaceState {
  /** Google 등에서 추가된 동적 장소 */
  places: Record<string, Place>
  /** 추가 순서 (최신이 마지막) */
  addOrder: string[]
  /** 장소 추가/업데이트 */
  addPlace: (place: Place) => void
  /** ID로 장소 조회 */
  getPlace: (id: string) => Place | undefined
  /** 캐시 전체 삭제 */
  clearPlaces: () => void
}

export const useDynamicPlaceStore = create<DynamicPlaceState>()(
  persist(
    (set, get) => ({
      places: {},
      addOrder: [],

      addPlace: (place) =>
        set((state) => ({
          places: { ...state.places, [place.id]: place },
          addOrder: [...state.addOrder.filter((id) => id !== place.id), place.id],
        })),

      getPlace: (id) => {
        return get().places[id]
      },

      clearPlaces: () => set({ places: {}, addOrder: [] }),
    }),
    {
      name: "dynamic-places",
    },
  ),
)

/**
 * 동적 장소 조회 (모든 장소는 dynamicPlaceStore에서 관리).
 * PlaceCard, PlaceMarker 등에서 사용.
 */
export function getAnyPlaceById(id: string): Place | undefined {
  return useDynamicPlaceStore.getState().places[id]
}
