import { estimateTravel, type TravelEstimate, type TransportMode } from "@/lib/utils"

export interface TravelTimeResult extends TravelEstimate {
  source: "estimated" | "live"
}

const cache = new Map<string, TravelTimeResult>()

function cacheKey(fromLat: number, fromLng: number, toLat: number, toLng: number): string {
  return [fromLat, fromLng, toLat, toLng].map((value) => value.toFixed(5)).join(":")
}

function getTransitMode(route: google.maps.DirectionsRoute | undefined): TransportMode {
  const steps = route?.legs?.[0]?.steps ?? []
  for (const step of steps) {
    if (step.travel_mode === google.maps.TravelMode.WALKING) {
      continue
    }
    const vehicleType = step.transit?.line?.vehicle?.type
    if (vehicleType === google.maps.VehicleType.BUS) {
      return "bus"
    }
    if (vehicleType === google.maps.VehicleType.SUBWAY || vehicleType === google.maps.VehicleType.METRO_RAIL) {
      return "metro"
    }
    if (vehicleType) {
      return "train"
    }
  }
  return steps.every((step) => step.travel_mode === google.maps.TravelMode.WALKING)
    ? "walk"
    : "train"
}

export async function getTravelTime(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): Promise<TravelTimeResult> {
  const key = cacheKey(fromLat, fromLng, toLat, toLng)
  const cached = cache.get(key)
  if (cached) return cached

  const fallback = estimateTravel(fromLat, fromLng, toLat, toLng)

  if (typeof window === "undefined" || !window.google?.maps?.DirectionsService) {
    const estimate = { ...fallback, source: "estimated" as const }
    cache.set(key, estimate)
    return estimate
  }

  try {
    const service = new google.maps.DirectionsService()
    const response = await service.route({
      origin: { lat: fromLat, lng: fromLng },
      destination: { lat: toLat, lng: toLng },
      travelMode: google.maps.TravelMode.TRANSIT,
      provideRouteAlternatives: false,
    })

    const leg = response.routes[0]?.legs[0]
    if (!leg?.duration || !leg?.distance) {
      throw new Error("No route leg")
    }

    const liveResult: TravelTimeResult = {
      minutes: Math.max(1, Math.round(leg.duration.value / 60)),
      distanceKm: leg.distance.value / 1000,
      mode: getTransitMode(response.routes[0]),
      source: "live",
    }
    cache.set(key, liveResult)
    return liveResult
  } catch {
    const estimate = { ...fallback, source: "estimated" as const }
    cache.set(key, estimate)
    return estimate
  }
}
