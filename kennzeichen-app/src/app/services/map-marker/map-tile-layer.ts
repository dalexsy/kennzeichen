import * as L from 'leaflet';

export function isDarkMode(): boolean {
  const theme = document.documentElement.getAttribute('data-theme');
  if (theme === 'dark') return true;
  if (theme === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function createTileLayer(isDark: boolean): L.TileLayer {
  const url = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  return L.tileLayer(url, {
    minZoom: 0,
    maxZoom: 20,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
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