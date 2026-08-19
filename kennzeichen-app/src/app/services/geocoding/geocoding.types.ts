export interface CityCoordinates {
  name: string;
  lat: number;
  lng: number;
  state?: string;
}

export interface GeocodeQueueItem {
  cityName: string;
  stateName?: string;
  resolve: (value: CityCoordinates | null) => void;
}

export function cacheKey(cityName: string, stateName?: string): string {
  return `${cityName}-${stateName || 'unknown'}`;
}
