import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { GeocodingService } from '../../services/geocoding/geocoding.service';
import { LicensePlate } from '../../models/license-plate.interface';
import { MapStateService, StateInfo } from '../../services/map-state/map-state.service';
import { MapMarkerService } from '../../services/map-marker/map-marker.service';
import { LocalizationService } from '../../services/localization/localization.service';
import { applyTileLayer, setupThemeObserver } from '../../services/map-marker/map-tile-layer';
import {
  MapMarkerHost,
  handleSelectedCodeChange,
  clearMarkers,
  refreshMap,
} from '../../services/map-marker/map-markers';
import { MapToggles } from './map-toggles/map-toggles';
import { MapStateTiles } from './map-state-tiles/map-state-tiles';
import { shouldShowMapButton, highlightedStateName, activeFilterLabel } from './map-view';

@Component({
  selector: 'app-map',
  imports: [CommonModule, MapToggles, MapStateTiles],
  templateUrl: './map.html',
  styleUrl: './map.scss',
})
export class MapComponent implements OnInit, OnDestroy, OnChanges, MapMarkerHost {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  @Input() licensePlates: LicensePlate[] = [];
  @Input() selectedCode = '';
  @Input() stateFilter = '';
  @Input() seenFilterActive = false;
  @Input() seenCount = 0;
  @Input() availableStates: Set<string> = new Set();
  @Input() isSettingsOpen = false;
  @Output() codeSelected = new EventEmitter<LicensePlate>();
  @Output() stateFilterChange = new EventEmitter<string>();
  @Output() seenFilterToggle = new EventEmitter<void>();
  @Output() clearAllFilters = new EventEmitter<void>();

  map: L.Map | null = null;
  markers: Map<string, L.Marker> = new Map();
  selectedMarker: L.Marker | null = null;
  private currentTileLayer: L.TileLayer | null = null;
  private darkModeMediaQuery: MediaQueryList | null = null;
  private handleThemeChange = () => this.updateTileLayer();

  isMapVisible = false;
  hasMarkers = false;

  get states(): StateInfo[] {
    return this.mapStateService.states;
  }

  get shouldShowMapButton(): boolean {
    return shouldShowMapButton(this.licensePlates, this.hasMarkers, this.isMapVisible);
  }

  get highlightedState(): string {
    return highlightedStateName(this.stateFilter, this.selectedCode, this.licensePlates);
  }

  get activeFilterText(): string {
    return activeFilterLabel(this.localizationService, this.seenFilterActive, this.stateFilter);
  }

  get translations$() {
    return this.localizationService.translations$;
  }

  constructor(
    public geocodingService: GeocodingService,
    public mapStateService: MapStateService,
    public mapMarkerService: MapMarkerService,
    public localizationService: LocalizationService
  ) {}

  onCodeSelected(plate: LicensePlate): void {
    this.codeSelected.emit(plate);
  }

  onMapClose(): void {
    this.isMapVisible = false;
  }

  onStateTileClick(state: StateInfo): void {
    this.stateFilterChange.emit(this.stateFilter === state.name ? '' : state.name);
  }

  onSeenFilterToggle(): void {
    this.seenFilterToggle.emit();
    if (window.innerWidth < 768 && !this.seenFilterActive && !this.isMapVisible) {
      this.toggleMap();
    }
  }

  toggleMap() {
    this.isMapVisible = !this.isMapVisible;
    if (!this.isMapVisible || !this.map) return;
    if (this.markers.size === 0 && this.licensePlates.length > 0 && this.licensePlates.length <= 200) {
      this.refreshMap();
    }
    setTimeout(() => {
      if (!this.map) return;
      this.map.invalidateSize();
      this.mapMarkerService.fitMapToMarkers(this.map, this.markers);
      this.markers.forEach((marker) => {
        if (marker.isPopupOpen()) {
          marker.closePopup();
          setTimeout(() => marker.openPopup(), 10);
        }
      });
    }, 200);
  }

  onOverlayClick() {
    this.isMapVisible = false;
    if (window.innerWidth < 768 && this.licensePlates.length === 0) {
      if (this.stateFilter || this.seenFilterActive || this.selectedCode) {
        this.clearAllFilters.emit();
      }
    }
  }

  ngOnInit() {
    this.map = L.map(this.mapContainer.nativeElement, {
      preferCanvas: false,
      attributionControl: false,
      zoomControl: true,
    }).setView([51.1657, 10.4515], 6);
    this.updateTileLayer();
    setTimeout(() => this.map?.invalidateSize(), 100);
    this.darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.darkModeMediaQuery.addEventListener('change', this.handleThemeChange);
    setupThemeObserver(() => this.updateTileLayer());
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['licensePlates'] && this.map && !changes['licensePlates'].firstChange) {
      if (this.licensePlates.length > 0 && this.licensePlates.length <= 200) {
        this.refreshMap();
        this.mapMarkerService.fitMapToMarkers(this.map, this.markers);
      } else {
        this.clearMarkers();
      }
    }
    if (changes['selectedCode'] && this.map && !changes['selectedCode'].firstChange) {
      handleSelectedCodeChange(this);
    }
    if (changes['stateFilter'] && this.map && !changes['stateFilter'].firstChange) {
      setTimeout(() => this.map && this.mapMarkerService.fitMapToMarkers(this.map, this.markers), 50);
    }
  }

  ngOnDestroy() {
    this.map?.remove();
    this.darkModeMediaQuery?.removeEventListener('change', this.handleThemeChange);
  }

  private updateTileLayer() {
    if (!this.map) return;
    this.currentTileLayer = applyTileLayer(this.map, this.currentTileLayer);
  }

  public clearMarkers() {
    clearMarkers(this);
  }

  public refreshMap() {
    refreshMap(this);
  }
}
