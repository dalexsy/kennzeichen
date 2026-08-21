import { HttpClient } from '@angular/common/http';
import { CityCoordinates, cacheKey } from './geocoding.types';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function buildOverpassQuery(cityName: string, stateName?: string): string {
  const cleanCityName = cityName.replace(/\s+/g, ' ').trim();
  let query = `[out:json][timeout:25];
(
  relation["place"~"^(city|town)$"]["name"="${cleanCityName}"]["admin_level"~"^[678]$"]["ISO3166-1"="DE"];
  way["place"~"^(city|town)$"]["name"="${cleanCityName}"]["admin_level"~"^[678]$"];
  node["place"~"^(city|town)$"]["name"="${cleanCityName}"];
`;
  if (stateName) {
    query += `  relation["place"~"^(city|town)$"]["name"="${cleanCityName}"]["addr:state"="${stateName}"];
`;
  }
  query += `);
out center geom;`;
  return query;
}

export async function requestCityCoordinates(
  http: HttpClient,
  cache: Map<string, CityCoordinates>,
  cityName: string,
  stateName?: string
): Promise<CityCoordinates | null> {
  const key = cacheKey(cityName, stateName);
  if (cache.has(key)) return cache.get(key)!;

  const response: {
    elements?: Array<{ lat?: number; lon?: number; center?: { lat: number; lon: number } }>;
  } = (await http
    .post(OVERPASS_URL, buildOverpassQuery(cityName, stateName), {
      headers: { 'Content-Type': 'text/plain' },
      responseType: 'json',
    })
    .toPromise()) ?? { elements: [] };

  if (response.elements && response.elements.length > 0) {
    const element = response.elements[0];
    const coordinates: CityCoordinates = {
      name: cityName,
      lat: element.lat || element.center?.lat || 0,
      lng: element.lon || element.center?.lon || 0,
      state: stateName,
    };
    cache.set(key, coordinates);
    return coordinates;
  }
  return null;
}
