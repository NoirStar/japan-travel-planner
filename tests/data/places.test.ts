import { describe, it, expect } from "vitest"
import {
  allPlaces,
  getPlaceById,
  getPlacesByCity,
  tokyoPlaces,
  osakaPlaces,
  kyotoPlaces,
  fukuokaPlaces,
} from "@/data/places"
import { PlaceCategory, CATEGORY_LABELS } from "@/types/place"

describe("큐레이션 장소 데이터", () => {
  // ── 데이터 무결성 ─────────────────────────────────────
  describe("데이터 무결성", () => {
    it("4개 도시 모두 장소를 가지고 있다", () => {
      expect(tokyoPlaces.length).toBeGreaterThanOrEqual(10)
      expect(osakaPlaces.length).toBeGreaterThanOrEqual(10)
      expect(kyotoPlaces.length).toBeGreaterThanOrEqual(10)
      expect(fukuokaPlaces.length).toBeGreaterThanOrEqual(10)
    })

    it("모든 장소가 필수 필드를 가지고 있다", () => {
      for (const place of allPlaces) {
        expect(place.id).toBeTruthy()
        expect(place.name).toBeTruthy()
        expect(place.nameEn).toBeTruthy()
        expect(place.category).toBeTruthy()
        expect(place.cityId).toBeTruthy()
        expect(place.location.lat).toBeTypeOf("number")
        expect(place.location.lng).toBeTypeOf("number")
      }
    })

    it("장소 ID가 모두 고유하다", () => {
      const ids = allPlaces.map((p) => p.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it("장소의 cityId가 올바른 값을 가진다", () => {
      const validCities = ["tokyo", "osaka", "kyoto", "fukuoka"]
      for (const place of allPlaces) {
        expect(validCities).toContain(place.cityId)
      }
    })

    it("장소가 유효한 카테고리를 가지고 있다", () => {
      const validCategories = Object.values(PlaceCategory)
      for (const place of allPlaces) {
        expect(validCategories).toContain(place.category)
      }
    })

    it("좌표가 일본 범위 내에 있다", () => {
      for (const place of allPlaces) {
        // 일본 위도: ~24~46, 경도: ~122~154
        expect(place.location.lat).toBeGreaterThan(24)
        expect(place.location.lat).toBeLessThan(46)
        expect(place.location.lng).toBeGreaterThan(122)
        expect(place.location.lng).toBeLessThan(154)
      }
    })
  })

  // ── 유틸 함수 ─────────────────────────────────────────
  describe("유틸 함수", () => {
    it("getPlaceById로 장소를 찾을 수 있다", () => {
      const place = getPlaceById("tokyo-sensoji")
      expect(place).toBeDefined()
      expect(place!.name).toBe("센소지")
    })

    it("존재하지 않는 ID면 undefined를 반환한다", () => {
      expect(getPlaceById("nonexistent")).toBeUndefined()
    })

    it("getPlacesByCity로 도시별 장소를 가져올 수 있다", () => {
      const places = getPlacesByCity("osaka")
      expect(places.length).toBeGreaterThanOrEqual(10)
      expect(places.every((p) => p.cityId === "osaka")).toBe(true)
    })

    it("존재하지 않는 도시면 빈 배열을 반환한다", () => {
      expect(getPlacesByCity("sapporo")).toEqual([])
    })
  })

  // ── 카테고리 라벨 ─────────────────────────────────────
  describe("카테고리 라벨", () => {
    it("모든 카테고리에 한글 라벨이 있다", () => {
      for (const cat of Object.values(PlaceCategory)) {
        expect(CATEGORY_LABELS[cat]).toBeTruthy()
        expect(typeof CATEGORY_LABELS[cat]).toBe("string")
      }
    })
  })
})
