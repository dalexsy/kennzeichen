import { Injectable } from '@angular/core';
import * as L from 'leaflet';
import { LicensePlate } from '../models/license-plate.interface';
import { CityCoordinates } from './geocoding';
import { MapStateService } from './map-state.service';

/**
 * Service to handle marker creation and management for the map.
 */
@Injectable({
  providedIn: 'root'
})
export class MapMarkerService {
  constructor(private mapStateService: MapStateService) {}

  /**
   * Creates a custom DivIcon marker for a license plate.
   */
  createMarkerIcon(isSelected: boolean, code: string, stateClass: string): L.DivIcon {
    const remInPixels = 16; // 1rem = 16px
    const markerSizeRem = 2.5;
    const size = markerSizeRem * remInPixels; // 2.5rem = 40px
    const tailOffsetRem = 1.25; // Extra offset for the teardrop tail
    const tailOffset = tailOffsetRem * remInPixels;

    const selectedClass = isSelected ? 'selected' : '';
    const pinClass = `marker-pin ${stateClass} ${selectedClass}`.trim();
    const html = `
      <div class="${pinClass}">
        <span class="marker-code">${code}</span>
      </div>
    `;

    return L.divIcon({
      className: 'custom-marker-wrapper',
      html: html,
      iconSize: [size, size],
      iconAnchor: [size / 2, size + tailOffset],
      popupAnchor: [0, -size - tailOffset]
    });
  }

  /**
   * Creates a marker with popup and returns it (doesn't add to map).
   */
  createMarker(
    coordinates: CityCoordinates,
    licensePlate: LicensePlate,
    isSelected: boolean,
    onCodeClick: (plate: LicensePlate) => void
  ): L.Marker {
    const stateClass = this.mapStateService.getStateClass(licensePlate.federal_state);
    const icon = this.createMarkerIcon(isSelected, licensePlate.code, stateClass);

    const marker = L.marker([coordinates.lat, coordinates.lng], { icon })
      .bindPopup(`
        <div class="marker-popup">
          <a href="#" class="popup-code">${licensePlate.code}</a>
          <div class="popup-city">${licensePlate.city_district}</div>
          <div class="popup-state">${licensePlate.federal_state}</div>
        </div>
      `);

    // Add click handler for popup code link
    marker.on('popupopen', () => {
      const popup = marker.getPopup();
      if (popup) {
        const popupElement = popup.getElement();
        const codeLink = popupElement?.querySelector('.popup-code') as HTMLAnchorElement;
        if (codeLink) {
          codeLink.addEventListener('click', (e) => {
            e.preventDefault();
            onCodeClick(licensePlate);
          });
        }
      }
    });

    return marker;
  }

  /**
   * Updates a marker's icon based on selection state.
   */
  updateMarkerIcon(marker: L.Marker, code: string, isSelected: boolean, stateClass: string): void {
    const icon = this.createMarkerIcon(isSelected, code, stateClass);
    marker.setIcon(icon);
  }

  /**
   * Fits the map view to show all markers.
   * If there are no markers, shows all of Germany.
   * If there's only one marker, centers on it with appropriate zoom.
   * If there are multiple markers, fits bounds to show all of them.
   */
  fitMapToMarkers(map: L.Map, markers: Map<string, L.Marker>): void {
    if (!map) return;

    if (markers.size === 0) {
      // No markers - show all of Germany
      map.setView([51.1657, 10.4515], 6);
      return;
    }

    if (markers.size === 1) {
      // Single marker - center on it with a good zoom level for city-states
      const marker = Array.from(markers.values())[0];
      const latLng = marker.getLatLng();
      map.setView(latLng, 10); // Zoom level 10 is good for seeing a city and surroundings
    } else {
      // Multiple markers - fit bounds to show all
      const group = L.featureGroup(Array.from(markers.values()));
      map.fitBounds(group.getBounds(), {
        padding: [50, 50], // Add padding so markers aren't at the edge
        maxZoom: 12 // Don't zoom in too close even if markers are clustered
      });
    }
  }
}