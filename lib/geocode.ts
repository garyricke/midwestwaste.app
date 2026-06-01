import zipcodes from "zipcodes";

export type GeoPoint = {
  latitude: number;
  longitude: number;
  city: string | null;
  state: string | null;
};

/**
 * Resolve a US zip code to a lat/long centroid using the offline `zipcodes`
 * dataset — no API key, works nationwide. Returns null for unknown zips.
 */
export function geocodeZip(zip: string): GeoPoint | null {
  const clean = (zip || "").trim().slice(0, 5);
  const rec = zipcodes.lookup(clean);
  if (!rec || typeof rec.latitude !== "number") return null;
  return {
    latitude: rec.latitude,
    longitude: rec.longitude,
    city: rec.city ?? null,
    state: rec.state ?? null,
  };
}
