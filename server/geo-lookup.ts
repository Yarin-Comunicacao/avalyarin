/**
 * Geo Lookup Utility
 * Uses GeoSampa district boundaries (cached locally) to determine
 * which district and region a given lat/lng point belongs to.
 * 
 * Data source: GeoSampa - Prefeitura de São Paulo
 * http://wfs.geosampa.prefeitura.sp.gov.br
 */

import { readFileSync } from "fs";
import { resolve } from "path";

// Types
interface DistrictProperties {
  distrito: string;
  sigla: string;
  subprefeitura_id: number;
  regiao: string;
}

interface GeoFeature {
  type: "Feature";
  properties: DistrictProperties;
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
}

interface GeoFeatureCollection {
  type: "FeatureCollection";
  features: GeoFeature[];
}

export interface GeoLookupResult {
  distrito: string;
  regiao: string;
  sigla: string;
}

// Load district data at module init
let districtData: GeoFeatureCollection | null = null;
let districtRegionMap: Record<string, string> | null = null;

function loadDistrictData(): GeoFeatureCollection {
  if (!districtData) {
    const filePath = resolve(import.meta.dirname, "data/distritos-sp.json");
    const raw = readFileSync(filePath, "utf-8");
    districtData = JSON.parse(raw) as GeoFeatureCollection;
  }
  return districtData;
}

function loadDistrictRegionMap(): Record<string, string> {
  if (!districtRegionMap) {
    const filePath = resolve(import.meta.dirname, "data/distrito-regiao-map.json");
    const raw = readFileSync(filePath, "utf-8");
    districtRegionMap = JSON.parse(raw) as Record<string, string>;
  }
  return districtRegionMap;
}

/**
 * Ray-casting algorithm to determine if a point is inside a polygon.
 */
function pointInPolygon(lat: number, lng: number, polygon: number[][]): boolean {
  let inside = false;
  const n = polygon.length;
  
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i][0]; // lng
    const yi = polygon[i][1]; // lat
    const xj = polygon[j][0]; // lng
    const yj = polygon[j][1]; // lat
    
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  
  return inside;
}

/**
 * Check if a point is inside a feature's geometry (Polygon or MultiPolygon).
 */
function pointInFeature(lat: number, lng: number, feature: GeoFeature): boolean {
  const { type, coordinates } = feature.geometry;
  
  if (type === "Polygon") {
    // Check outer ring (index 0), exclude holes
    return pointInPolygon(lat, lng, (coordinates as unknown as number[][][])[0]);
  } else if (type === "MultiPolygon") {
    // Check each polygon
    for (const polygon of coordinates as unknown as number[][][][]) {
      if (pointInPolygon(lat, lng, polygon[0])) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Look up the district and region for a given lat/lng coordinate.
 * Uses point-in-polygon against GeoSampa district boundaries.
 * 
 * @param lat - Latitude (WGS84)
 * @param lng - Longitude (WGS84)
 * @returns District info or null if not found (outside São Paulo)
 */
export function lookupDistrict(lat: number, lng: number): GeoLookupResult | null {
  const data = loadDistrictData();
  
  for (const feature of data.features) {
    if (pointInFeature(lat, lng, feature)) {
      return {
        distrito: feature.properties.distrito,
        regiao: feature.properties.regiao,
        sigla: feature.properties.sigla,
      };
    }
  }
  
  return null;
}

/**
 * Get the region for a known neighborhood/district name.
 * Useful when you already know the district but need the region.
 * 
 * @param districtName - Name of the district (case-insensitive)
 * @returns Region name or null if not found
 */
export function getRegionByDistrict(districtName: string): string | null {
  const map = loadDistrictRegionMap();
  
  // Try exact match first
  if (map[districtName]) return map[districtName];
  
  // Try title case
  const titleCase = districtName.replace(/\b\w/g, c => c.toUpperCase());
  if (map[titleCase]) return map[titleCase];
  
  // Try case-insensitive
  const lower = districtName.toLowerCase();
  for (const [key, value] of Object.entries(map)) {
    if (key.toLowerCase() === lower) return value;
  }
  
  return null;
}

/**
 * Neighborhood-to-district mapping for common neighborhoods that differ from district names.
 * Many "bairros" in São Paulo are actually sub-areas of official districts.
 */
const NEIGHBORHOOD_TO_DISTRICT: Record<string, string> = {
  "Vila Madalena": "Pinheiros",
  "Jardins": "Jardim Paulista",
  "Cerqueira César": "Jardim Paulista",
  "Higienópolis": "Santa Cecília",
  "Pompeia": "Perdizes",
  "Sumaré": "Perdizes",
  "Vila Nova Conceição": "Itaim Bibi",
  "Vila Olímpia": "Itaim Bibi",
  "Brooklin": "Campo Belo",
  "Indianópolis": "Moema",
  "Paraíso": "Vila Mariana",
  "Aclimação": "Liberdade",
  "Vila Progredior": "Butantã",
};

/**
 * Get region from a neighborhood name (handles common aliases).
 */
export function getRegionByNeighborhood(neighborhood: string): string | null {
  // First try direct district lookup
  const direct = getRegionByDistrict(neighborhood);
  if (direct) return direct;
  
  // Try neighborhood-to-district mapping
  const district = NEIGHBORHOOD_TO_DISTRICT[neighborhood];
  if (district) return getRegionByDistrict(district);
  
  return null;
}
