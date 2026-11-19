import * as L from 'leaflet';
import { rasterProviders } from '@dryl/maps';

export function isDarkMode(): boolean {
  const theme = document.documentElement.getAttribute('data-theme');
  if (theme === 'dark') return true;
  if (theme === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function createTileLayer(isDark: boolean): L.TileLayer {
  const provider = isDark ? rasterProviders.cartoDark : rasterProviders.cartoLight;

  return L.tileLayer(provider.url, {
    minZoom: 0,
    maxZoom: provider.maxZoom,
    attribution: provider.attribution,
    subdomains: 'abcd',
  });
}

export function applyTileLayer(
  map: L.Map,
  currentTileLayer: L.TileLayer | null
): L.TileLayer {
  if (currentTileLayer) {
    map.removeLayer(currentTileLayer);
  }

  const nextLayer = createTileLayer(isDarkMode());
  nextLayer.addTo(map);
  return nextLayer;
}

export function setupThemeObserver(onThemeChange: () => void): MutationObserver {
  const observer = new MutationObserver(onThemeChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
  return observer;
}
