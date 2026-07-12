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
import { GeocodingService } from '../../services/geocoding';
import { LicensePlate } from '../../models/license-plate.interface';
import { MapStateService, StateInfo } from '../../services/map-state.service';
import { MapMarkerService } from '../../services/map-marker.service';
import { LocalizationService } from '../../services/localization.service';
import { applyTileLayer, setupThemeObserver } from './map-tile-layer';
import {
  MapMarkerHost,
  handleSelectedCodeChange,
  clearMarkers,
  refreshMap,
} from './map-markers';

@Component({
  selector: 'app-map',
  imports: [CommonModule],
  templateUrl: './map.html',
  styleUrl: './map.scss',
})
export class MapComponent implements OnInit, OnDestroy, OnChanges, MapMarkerHost {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  @Input() licensePlates: LicensePlate[] = [];
  @Input() selectedCode: string = '';
  @Input() stateFilter: string = '';
  @Input() seenFilterActive: boolean = false;
  @Input() seenCount: number = 0;
  @Input() availableStates: Set<string> = new Set();
  @Input() isSettingsOpen: boolean = false;
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
    if (window.innerWidth < 768) {
      return true;
    }

    if (this.hasMarkers || this.isMapVisible) {
      return true;
    }

    if (this.licensePlates.length > 0 && this.licensePlates.length <= 200) {
      const hasValidLocations = this.licensePlates.some(
        (plate) => plate.derived_from && plate.derived_from !== 'willkürlich gewählt'
      );
      return hasValidLocations;
    }

    return false;
  }

  get shouldShowSeenButton(): boolean {
    return true;
  }

  get activeFilterText(): string {
    const t = this.localizationService.getTranslations();
    const parts: string[] = [];
    if (this.seenFilterActive) {
      parts.push(t.seen);
    }
    if (this.stateFilter) {
      parts.push(this.localizationService.translateStateName(this.stateFilter));
    } else {
      parts.push(this.seenFilterActive ? t.all_states_dative : t.all_states);
    }

    return parts.join(' in ');
  }

  onSeenFilterToggle(): void {
    this.seenFilterToggle.emit();
    if (window.innerWidth < 768 && !this.seenFilterActive && !this.isMapVisible) {
      this.toggleMap();
    }
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

  private getHighlightedState(): string {
    if (this.stateFilter) {
      return this.stateFilter;
    }

    if (this.selectedCode) {
      const selectedPlate = this.licensePlates.find((p) => p.code === this.selectedCode);
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
    return this.getHighlightedState() === state.name;
  }

  isStateDimmed(state: StateInfo): boolean {
    const highlightedState = this.getHighlightedState();
    const isHighlightedButNotThis = highlightedState !== '' && highlightedState !== state.name;
    const isNotAvailable = this.availableStates.size > 0 && !this.availableStates.has(state.name);
    return isHighlightedButNotThis || isNotAvailable;
  }

  isStateAvailable(state: StateInfo): boolean {
    return this.availableStates.size === 0 || this.availableStates.has(state.name);
  }

  toggleMap() {
    this.isMapVisible = !this.isMapVisible;
    if (this.isMapVisible && this.map) {
      if (
        this.markers.size === 0 &&
        this.licensePlates.length > 0 &&
        this.licensePlates.length <= 200
      ) {
        this.refreshMap();
      }

      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
          this.mapMarkerService.fitMapToMarkers(this.map, this.markers);
          this.markers.forEach((marker) => {
            if (marker.isPopupOpen()) {
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
    this.isMapVisible = false;

    if (window.innerWidth < 768 && this.licensePlates.length === 0) {
      const hasActiveFilters = this.stateFilter || this.seenFilterActive || this.selectedCode;
      if (hasActiveFilters) {
        this.clearAllFilters.emit();
      }
    }
  }

  onMapClick(event: MouseEvent) {
    event.stopPropagation();
  }

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

  private initializeMap() {
    this.map = L.map(this.mapContainer.nativeElement, {
      preferCanvas: false,
      attributionControl: false,
      zoomControl: true,
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
    setupThemeObserver(() => this.updateTileLayer());
  }

  private updateTileLayer() {
    if (!this.map) return;
    this.currentTileLayer = applyTileLayer(this.map, this.currentTileLayer);
  }

  private handleSelectedCodeChange() {
    handleSelectedCodeChange(this);
  }

  public clearMarkers() {
    clearMarkers(this);
  }

  public refreshMap() {
    refreshMap(this);
  }
}