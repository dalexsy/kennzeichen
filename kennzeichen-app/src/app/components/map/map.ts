import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ElementRef, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { GeocodingService, CityCoordinates } from '../../services/geocoding';
import { LicensePlate } from '../../models/license-plate.interface';
import { MapStateService, StateInfo } from '../../services/map-state.service';
import { MapMarkerService } from '../../services/map-marker.service';

/**
 * Main map component that displays license plates on a Leaflet map.
 * Handles marker display, state filtering, and user interactions.
 */
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
  @Input() stateFilter: string = '';
  @Input() seenFilterActive: boolean = false;
  @Input() seenCount: number = 0;
  @Output() codeSelected = new EventEmitter<LicensePlate>();
  @Output() stateFilterChange = new EventEmitter<string>();
  @Output() seenFilterToggle = new EventEmitter<void>();

  private map: L.Map | null = null;
  private markers: Map<string, L.Marker> = new Map();
  private selectedMarker: L.Marker | null = null;
  private currentTileLayer: L.TileLayer | null = null;
  private darkModeMediaQuery: MediaQueryList | null = null;
  private handleThemeChange = () => this.updateTileLayer();

  isMapVisible = false;
  hasMarkers = false;

  get states(): StateInfo[] {
    return this.mapStateService.states;
  }

  get shouldShowMapButton(): boolean {
    if (this.hasMarkers || this.isMapVisible) {
      return true;
    }

    // Only show map button if we have plates with valid locations
    if (this.licensePlates.length > 0 && this.licensePlates.length <= 200) {
      const hasValidLocations = this.licensePlates.some(
        plate => plate.derived_from && plate.derived_from !== 'willkürlich gewählt'
      );
      return hasValidLocations;
    }

    return false;
  }

  get shouldShowSeenButton(): boolean {
    // Always show the button to make the feature discoverable
    return true;
  }

  onSeenFilterToggle(): void {
    this.seenFilterToggle.emit();
    // On mobile (< 768px), open the map when activating the seen filter
    if (window.innerWidth < 768 && !this.seenFilterActive && !this.isMapVisible) {
      this.toggleMap();
    }
  }

  constructor(
    private geocodingService: GeocodingService,
    private mapStateService: MapStateService,
    private mapMarkerService: MapMarkerService
  ) {}

  // ============================================
  // State Highlighting Logic
  // ============================================

  /**
   * Centralized method to determine if a state should be highlighted.
   * Returns the state name that should be highlighted, or empty string if none.
   */
  private getHighlightedState(): string {
    // Priority 1: If stateFilter is set (user clicked a state tile), highlight that state
    if (this.stateFilter) {
      return this.stateFilter;
    }

    // Priority 2: If a single marker is selected, highlight its state
    if (this.selectedCode) {
      const selectedPlate = this.licensePlates.find(p => p.code === this.selectedCode);
      if (selectedPlate && selectedPlate.federal_state) {
        return selectedPlate.federal_state;
      }
    }

    return '';
  }

  onStateTileClick(state: StateInfo): void {
    if (this.stateFilter === state.name) {
      this.stateFilterChange.emit('');
    } else {
      this.stateFilterChange.emit(state.name);
    }
  }

  isStateActive(state: StateInfo): boolean {
    const highlightedState = this.getHighlightedState();
    return highlightedState === state.name;
  }

  isStateDimmed(state: StateInfo): boolean {
    const highlightedState = this.getHighlightedState();
    return highlightedState !== '' && highlightedState !== state.name;
  }

  // ============================================
  // Map Visibility and User Interactions
  // ============================================

  toggleMap() {
    this.isMapVisible = !this.isMapVisible;
    if (this.isMapVisible && this.map) {
      // Load markers if not already loaded
      if (this.markers.size === 0 && this.licensePlates.length > 0 && this.licensePlates.length <= 200) {
        this.refreshMap();
      }

      // Force map to redraw when shown - need longer delay for overlay transition
      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
          // Fit map to show all markers
          this.mapMarkerService.fitMapToMarkers(this.map, this.markers);
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

  // ============================================
  // Lifecycle Hooks
  // ============================================

  ngOnInit() {
    this.initializeMap();
    this.setupThemeListener();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['licensePlates'] && this.map) {
      const shouldShowMarkers = this.licensePlates.length > 0 && this.licensePlates.length <= 200;

      if (!changes['licensePlates'].firstChange) {
        if (shouldShowMarkers) {
          this.refreshMap();
          this.mapMarkerService.fitMapToMarkers(this.map, this.markers);
        } else {
          this.clearMarkers();
        }
      }
    }

    if (changes['selectedCode'] && this.map && !changes['selectedCode'].firstChange) {
      this.handleSelectedCodeChange();
    }

    if (changes['stateFilter'] && this.map && !changes['stateFilter'].firstChange) {
      setTimeout(() => {
        if (this.map) {
          this.mapMarkerService.fitMapToMarkers(this.map, this.markers);
        }
      }, 50);
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

  // ============================================
  // Map Initialization
  // ============================================

  private initializeMap() {
    this.map = L.map(this.mapContainer.nativeElement, {
      preferCanvas: false,
      attributionControl: false,
      zoomControl: true
    }).setView([51.1657, 10.4515], 6);

    this.updateTileLayer();

    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    }, 100);
  }

  private setupThemeListener() {
    this.darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.darkModeMediaQuery.addEventListener('change', this.handleThemeChange);
  }

  private updateTileLayer() {
    if (!this.map) return;

    if (this.currentTileLayer) {
      this.map.removeLayer(this.currentTileLayer);
    }

    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (isDarkMode) {
      this.currentTileLayer = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
        minZoom: 0,
        maxZoom: 20,
        attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      });
    } else {
      this.currentTileLayer = L.tileLayer('https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png', {
        minZoom: 0,
        maxZoom: 20,
        attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      });
    }

    this.currentTileLayer.addTo(this.map);
  }

  // ============================================
  // Marker Management
  // ============================================

  private handleSelectedCodeChange() {
    if (this.selectedCode) {
      const hasFilteredMarkers = this.licensePlates.length <= 200;

      if (hasFilteredMarkers && this.markers.size > 1) {
        this.highlightSelectedMarker();
      } else {
        this.clearMarkers();
        const selectedPlate = this.licensePlates.find(p => p.code === this.selectedCode);
        if (selectedPlate) {
          this.loadSingleMarker(selectedPlate);
        }
      }
    } else {
      const hasFilteredMarkers = this.licensePlates.length <= 200;
      if (!hasFilteredMarkers || this.markers.size <= 1) {
        this.clearMarkers();
        // Return to default Germany view when unselecting
        if (this.map) {
          this.mapMarkerService.fitMapToMarkers(this.map, this.markers);
        }
      } else {
        this.highlightSelectedMarker();
      }
    }
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

    cities.forEach(city => {
      const coordinates = this.geocodingService.getCoordinatesSync(city.name, city.state);
      if (coordinates && this.map) {
        this.addMarker(coordinates, city.plate);
      } else {
        console.log(`Missing coordinates for:\n  {\n    "name": "${city.name || ''}",\n    "lat": ,\n    "lng": ,\n    "state": "${city.state || ''}"\n  }`);
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
      this.map.panTo([coordinates.lat, coordinates.lng]);
      this.hasMarkers = true;
    } else {
      console.log(`Missing coordinates for:\n  {\n    "name": "${plate.derived_from || ''}",\n    "lat": ,\n    "lng": ,\n    "state": "${plate.federal_state || ''}"\n  }`);
    }
  }

  private addMarker(coordinates: CityCoordinates, licensePlate: LicensePlate) {
    if (!this.map) return;

    const isSelected = this.selectedCode === licensePlate.code;
    const marker = this.mapMarkerService.createMarker(
      coordinates,
      licensePlate,
      isSelected,
      (plate: LicensePlate) => {
        this.codeSelected.emit(plate);
        this.isMapVisible = false;
      }
    );

    marker.addTo(this.map);

    if (isSelected) {
      marker.openPopup();
      this.selectedMarker = marker;
      this.map.panTo([coordinates.lat, coordinates.lng]);
    }

    this.markers.set(licensePlate.code, marker);
  }

  private highlightSelectedMarker() {
    this.markers.forEach((marker, code) => {
      const isSelected = code === this.selectedCode;
      const plate = this.licensePlates.find(p => p.code === code);
      const stateClass = plate ? this.mapStateService.getStateClass(plate.federal_state) : '';
      
      this.mapMarkerService.updateMarkerIcon(marker, code, isSelected, stateClass);

      if (isSelected) {
        marker.openPopup();
        this.selectedMarker = marker;
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
}