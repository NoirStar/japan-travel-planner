import { describe, it, expect } from "vitest"
import {
  allPlaces,
  getPlaceById,
  getPlacesByCity,
} from "@/data/places"
import { PlaceCategory, CATEGORY_LABELS } from "@/types/place"

describe("장소 데이터 (큐레이션 제거 후)", () => {
  // ── 데이터 구조 ─────────────────────────────────────
  describe("빈 큐레이션 데이터", () => {
    it("allPlaces는 빈 배열이다", () => {
      expect(allPlaces).toEqual([])
    })

    it("getPlaceById는 항상 undefined를 반환한다", () => {
      expect(getPlaceById("tokyo-sensoji")).toBeUndefined()
      expect(getPlaceById("nonexistent")).toBeUndefined()
    })

    it("getPlacesByCity는 빈 배열을 반환한다", () => {
      expect(getPlacesByCity("tokyo")).toEqual([])
      expect(getPlacesByCity("osaka")).toEqual([])
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
