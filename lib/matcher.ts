import type { Hauler } from "./types";

export type MatchInput = {
  latitude: number;
  longitude: number;
};

export type MatchResult = {
  hauler: Hauler;
  distanceMiles: number;
  /** true when the nearest hauler is within their service radius. */
  inRange: boolean;
};

/**
 * Swappable matching strategy. The haversine implementation below uses only
 * our own DB data (no per-order API call → no rate-limit/cost ceiling at
 * scale). Later this can be replaced with a Google Distance Matrix
 * implementation for true driving distance without touching callers.
 */
export interface HaulerMatcher {
  findNearest(point: MatchInput, haulers: Hauler[]): MatchResult | null;
}

const EARTH_RADIUS_MILES = 3958.8;

export function haversineMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_MILES * 2 * Math.asin(Math.sqrt(a));
}

export class HaversineMatcher implements HaulerMatcher {
  findNearest(point: MatchInput, haulers: Hauler[]): MatchResult | null {
    let best: MatchResult | null = null;
    for (const hauler of haulers) {
      if (!hauler.active) continue;
      const distanceMiles = haversineMiles(
        point.latitude,
        point.longitude,
        hauler.latitude,
        hauler.longitude
      );
      if (!best || distanceMiles < best.distanceMiles) {
        best = {
          hauler,
          distanceMiles,
          inRange: distanceMiles <= hauler.service_radius_miles,
        };
      }
    }
    return best;
  }
}

// Default matcher used by the app today.
export const matcher: HaulerMatcher = new HaversineMatcher();
