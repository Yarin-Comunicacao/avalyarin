export type GoogleMapsCoordinates = {
  lat: number;
  lng: number;
};

function isValidCoordinates(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Extracts latitude and longitude only when a shared Google Maps URL contains
 * explicit coordinates. It never performs network requests or guesses a place.
 */
export function extractNameFromGoogleMapsUrl(value: string): string | null {
  const url = value.trim();
  const placeMatch = url.match(/\/place\/([^/?]+)/i);
  const queryMatch = url.match(/[?&](?:q|query)=([^&]+)/i);
  const rawName = placeMatch?.[1] || queryMatch?.[1];
  if (!rawName) return null;

  try {
    const name = decodeURIComponent(rawName.replace(/\+/g, " ")).replace(/\s+/g, " ").trim();
    return name || null;
  } catch {
    return rawName.replace(/\+/g, " ").trim() || null;
  }
}

export function extractCoordinatesFromGoogleMapsUrl(value: string): GoogleMapsCoordinates | null {
  const url = value.trim();
  if (!url) return null;

  const match = url.match(/@(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/)
    ?? url.match(/!3d(-?\d{1,2}(?:\.\d+)?)!4d(-?\d{1,3}(?:\.\d+)?)/);

  if (!match) return null;
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  return isValidCoordinates(lat, lng) ? { lat, lng } : null;
}
