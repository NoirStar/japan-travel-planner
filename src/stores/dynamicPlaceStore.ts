import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Place } from "@/types/place"
import { getPlaceById as getCuratedPlaceById } from "@/data/places"

/**
 * Google Places API에서 검색한 장소를 로컬에 저장하는 스토어.
 * 큐레이션 데이터에 없는 장소(google- prefix)를 관리합니다.
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
        // 큐레이션 데이터 우선
        const curated = getCuratedPlaceById(id)
        if (curated) return curated
        // 동적 장소 조회
        return get().places[id]
      },
    }),
    {
      name: "dynamic-places",
    },
  ),
)

/**
 * 큐레이션 + 동적 장소를 모두 포함한 장소 조회.
 * PlaceCard, PlaceMarker 등에서 사용.
 */
export function getAnyPlaceById(id: string): Place | undefined {
  const curated = getCuratedPlaceById(id)
  if (curated) return curated
  return useDynamicPlaceStore.getState().places[id]
}
