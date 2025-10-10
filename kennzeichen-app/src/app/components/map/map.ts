import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ElementRef, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { GeocodingService, CityCoordinates } from '../../services/geocoding';
import { LicensePlate } from '../../models/license-plate.interface';

@Component({
  selector: 'app-map',
  imports: [CommonModule],
  templateUrl: './map.html',
  styleUrl: './map.scss'
})
export class MapComponent implements OnInit, OnDestroy, OnChanges {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  @Input() licensePlates: LicensePlate[] = [];
  @Input() selectedCode: string = '';
  @Output() codeSelected = new EventEmitter<LicensePlate>();

  private map: L.Map | null = null;
  private markers: Map<string, L.Marker> = new Map();
  private selectedMarker: L.Marker | null = null;
  private currentTileLayer: L.TileLayer | null = null;
  private darkModeMediaQuery: MediaQueryList | null = null;
  private handleThemeChange = () => this.updateTileLayer();

  isMapVisible = false;
  hasMarkers = false;

  get shouldShowMapButton(): boolean {
    return this.hasMarkers || this.isMapVisible || (this.licensePlates.length > 0 && this.licensePlates.length <= 100);
  }

  constructor(private geocodingService: GeocodingService) {}

  toggleMap() {
    this.isMapVisible = !this.isMapVisible;
    if (this.isMapVisible && this.map) {
      // Load markers if not already loaded
      if (this.markers.size === 0 && this.licensePlates.length > 0 && this.licensePlates.length <= 100) {
        this.refreshMap();
      }

      // Force map to redraw when shown - need longer delay for overlay transition
      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
          // Close and reopen any open popups to fix positioning
          this.markers.forEach(marker => {
            if (marker.isPopupOpen()) {
              const popup = marker.getPopup();
              marker.closePopup();
              setTimeout(() => {
                marker.openPopup();
              }, 10);
            }
          });
        }
      }, 200);
    }
  }

  onOverlayClick(event: MouseEvent) {
    // Close when clicking the backdrop
    this.isMapVisible = false;
  }

  onMapClick(event: MouseEvent) {
    // Prevent closing when clicking the map itself
    event.stopPropagation();
  }

  ngOnInit() {
    this.initializeMap();
    this.setupThemeListener();
    // Don't load all markers on init - wait for user to filter
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['licensePlates'] && this.map) {
      // Only show markers if user has filtered (less than all plates)
      // or if there are 100 or fewer results
      const shouldShowMarkers = this.licensePlates.length > 0 && this.licensePlates.length <= 100;

      if (!changes['licensePlates'].firstChange) {
        if (shouldShowMarkers) {
          this.refreshMap();
        } else {
          this.clearMarkers();
        }
      }
    }
    if (changes['selectedCode'] && this.map && !changes['selectedCode'].firstChange) {
      if (this.selectedCode) {
        // Check if we're showing filtered markers (many) or single marker mode
        const hasFilteredMarkers = this.licensePlates.length <= 100;

        if (hasFilteredMarkers && this.markers.size > 1) {
          // Already showing filtered markers - just highlight
          this.highlightSelectedMarker();
        } else {
          // Show single marker for selected plate
          this.clearMarkers();
          const selectedPlate = this.licensePlates.find(p => p.code === this.selectedCode);
          if (selectedPlate) {
            this.loadSingleMarker(selectedPlate);
          }
        }
      } else {
        // Deselected - clear single marker or unhighlight
        const hasFilteredMarkers = this.licensePlates.length <= 100;
        if (!hasFilteredMarkers || this.markers.size <= 1) {
          this.clearMarkers();
        } else {
          // Just unhighlight all markers
          this.highlightSelectedMarker();
        }
      }
    }
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
    if (this.darkModeMediaQuery) {
      this.darkModeMediaQuery.removeEventListener('change', this.handleThemeChange);
    }
  }

  private initializeMap() {
    // Initialize map centered on Germany
    this.map = L.map(this.mapContainer.nativeElement, {
      preferCanvas: false,
      attributionControl: false,
      zoomControl: true
    }).setView([51.1657, 10.4515], 6);

    // Add appropriate tile layer based on theme
    this.updateTileLayer();

    // Fix for default markers not showing
    this.fixLeafletIcons();

    // Force invalidate size after initialization and on window resize
    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    }, 100);
  }

  private fixLeafletIcons() {
    // Using custom DivIcon markers instead of default icons
  }

  private loadLicensePlateLocations() {
    if (!this.licensePlates.length || !this.map) return;

    // Extract unique cities from license plates
    const cities = this.licensePlates
      .filter(plate => plate.derived_from && plate.derived_from !== 'willkürlich gewählt')
      .map(plate => ({
        name: plate.derived_from,
        state: plate.federal_state,
        plate: plate
      }))
      .filter((city, index, array) =>
        array.findIndex(c => c.name === city.name && c.state === city.state) === index
      );

    // All cities are cached - add markers synchronously for better performance
    cities.forEach(city => {
      const coordinates = this.geocodingService.getCoordinatesSync(city.name, city.state);
      if (coordinates && this.map) {
        this.addMarker(coordinates, city.plate);
      }
    });
  }

  private loadSingleMarker(plate: LicensePlate) {
    if (!plate.derived_from || plate.derived_from === 'willkürlich gewählt' || !this.map) {
      return;
    }

    const coordinates = this.geocodingService.getCoordinatesSync(plate.derived_from, plate.federal_state);
    if (coordinates && this.map) {
      this.addMarker(coordinates, plate);
      // Center map on the marker without zooming
      this.map.panTo([coordinates.lat, coordinates.lng]);
      this.hasMarkers = true;
    }
  }

  private addMarker(coordinates: CityCoordinates, licensePlate: LicensePlate) {
    if (!this.map) return;

    // Create custom icon for selected state
    const isSelected = this.selectedCode === licensePlate.code;
    const icon = this.createMarkerIcon(isSelected, licensePlate.code);

    const marker = L.marker([coordinates.lat, coordinates.lng], { icon })
      .addTo(this.map)
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
            this.codeSelected.emit(licensePlate);
            this.isMapVisible = false;
          });
        }
      }
    });

    // Open popup if this is the selected license plate
    if (isSelected) {
      marker.openPopup();
      this.selectedMarker = marker;
      // Center map on selected marker without zooming
      this.map.panTo([coordinates.lat, coordinates.lng]);
    }

    this.markers.set(licensePlate.code, marker);
  }

  public clearMarkers() {
    this.markers.forEach(marker => {
      if (this.map) {
        this.map.removeLayer(marker);
      }
    });
    this.markers.clear();
    this.selectedMarker = null;
    this.hasMarkers = false;
  }

  public refreshMap() {
    this.clearMarkers();
    this.loadLicensePlateLocations();
    this.hasMarkers = this.markers.size > 0;
  }

  private createMarkerIcon(isSelected: boolean, code: string): L.DivIcon {
    const remInPixels = 16; // 1rem = 16px
    const markerSizeRem = 2;
    const size = markerSizeRem * remInPixels; // 2rem = 32px
    const tailOffsetRem = 1; // Extra offset for the teardrop tail
    const tailOffset = tailOffsetRem * remInPixels;

    const pinClass = isSelected ? 'marker-pin selected' : 'marker-pin';
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

  private highlightSelectedMarker() {
    // Reset all markers to normal
    this.markers.forEach((marker, code) => {
      const isSelected = code === this.selectedCode;
      const icon = this.createMarkerIcon(isSelected, code);
      marker.setIcon(icon);

      if (isSelected) {
        marker.openPopup();
        this.selectedMarker = marker;
        // Center map on selected marker without zooming
        if (this.map) {
          const latLng = marker.getLatLng();
          this.map.panTo(latLng);
        }
      } else {
        marker.closePopup();
      }
    });

    if (!this.selectedCode) {
      this.selectedMarker = null;
    }
  }

  private setupThemeListener() {
    this.darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.darkModeMediaQuery.addEventListener('change', this.handleThemeChange);
  }

  private updateTileLayer() {
    if (!this.map) return;

    // Remove existing tile layer
    if (this.currentTileLayer) {
      this.map.removeLayer(this.currentTileLayer);
    }

    // Check if dark mode is active
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

    const thunderforestApiKey = 'd45b5f13492c4c4ab99727aee1164ac7';

    // Add appropriate tile layer
    if (isDarkMode) {
      this.currentTileLayer = L.tileLayer(`https://{s}.tile.thunderforest.com/transport-dark/{z}/{x}/{y}.png?apikey=${thunderforestApiKey}`, {
        attribution: 'Maps © <a href="https://www.thunderforest.com">Thunderforest</a>, Data © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 22
      });
    } else {
      this.currentTileLayer = L.tileLayer(`https://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=${thunderforestApiKey}`, {
        attribution: 'Maps © <a href="https://www.thunderforest.com">Thunderforest</a>, Data © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 22
      });
    }

    this.currentTileLayer.addTo(this.map);
  }
}
