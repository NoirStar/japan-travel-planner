import {
  UtensilsCrossed,
  Landmark,
  ShoppingBag,
  Hotel,
  Coffee,
  Train,
  MapPin,
  Leaf,
  TreePine,
  type LucideIcon,
} from "lucide-react"

/** 장소 카테고리 → lucide 아이콘 */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  restaurant: UtensilsCrossed,
  attraction: Landmark,
  shopping: ShoppingBag,
  accommodation: Hotel,
  cafe: Coffee,
  transport: Train,
  other: MapPin,
}

/** 여행 스타일 ID → lucide 아이콘 */
export const STYLE_ICONS: Record<string, LucideIcon> = {
  foodie: UtensilsCrossed,
  sightseeing: Landmark,
  shopping: ShoppingBag,
  cafe: Coffee,
  nature: Leaf,
}

/** Day 테마 ID → lucide 아이콘 */
export const THEME_ICONS: Record<string, LucideIcon> = {
  landmark: Landmark,
  "local-food": UtensilsCrossed,
  shopping: ShoppingBag,
  "temple-park": TreePine,
}
