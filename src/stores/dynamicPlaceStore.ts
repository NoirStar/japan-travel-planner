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
  /** 장소 추가/업데이트 */
  addPlace: (place: Place) => void
  /** ID로 장소 조회 (큐레이션 데이터 우선, 없으면 동적 장소) */
  getPlace: (id: string) => Place | undefined
}

export const useDynamicPlaceStore = create<DynamicPlaceState>()(
  persist(
    (set, get) => ({
      places: {},

      addPlace: (place) =>
        set((state) => ({
          places: { ...state.places, [place.id]: place },
        })),

      getPlace: (id) => {
        return get().places[id]
      },
    }),
    {
      name: "dynamic-places",
    },
  ),
)

/**
 * 동적 장소 조회 (모든 장소는 dinamicPlaceStore에서 관리).
 * PlaceCard, PlaceMarker 등에서 사용.
 */
export function getAnyPlaceById(id: string): Place | undefined {
  return useDynamicPlaceStore.getState().places[id]
}
