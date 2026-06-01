declare module "zipcodes" {
  export interface ZipRecord {
    zip: string;
    latitude: number;
    longitude: number;
    city: string;
    state: string;
    country: string;
  }
  export function lookup(zip: string | number): ZipRecord | undefined;
  export function distance(zipA: string | number, zipB: string | number): number;
  const _default: { lookup: typeof lookup; distance: typeof distance };
  export default _default;
}
