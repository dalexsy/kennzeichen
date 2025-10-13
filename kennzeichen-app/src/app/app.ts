import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, BehaviorSubject } from 'rxjs';

import { LicensePlate } from './models/license-plate.interface';
import { LicensePlateService, LicensePlateGroup } from './services/license-plate';
import { LocalStorageService } from './services/local-storage';

import { LicensePlateDisplay } from './components/license-plate-display/license-plate-display';
import { SearchInput } from './components/search-input/search-input';
import { LicensePlateList } from './components/license-plate-list/license-plate-list';
import { MapComponent } from './components/map/map';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    LicensePlateDisplay,
    SearchInput,
    LicensePlateList,
    MapComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  @ViewChild(MapComponent) mapComponent?: MapComponent;

  title = 'German License Plate Lookup';

  // Observables from services
  filteredLicensePlates$: Observable<LicensePlate[]>;
  groupedLicensePlates$: Observable<LicensePlateGroup[]>;
  seenCodes$: Observable<Set<string>>;

  // Local state
  currentSearchTerm = '';
  selectedCode = '';
  isLoading = true;
  targetScrollPosition = -1;
  private savedScrollPosition = 0;
  private savedSearchTerm = '';

  get isMapButtonVisible(): boolean {
    return this.mapComponent?.shouldShowMapButton || false;
  }

  constructor(
    private licensePlateService: LicensePlateService,
    private localStorageService: LocalStorageService
  ) {
    this.filteredLicensePlates$ = this.licensePlateService.filteredLicensePlates$;
    this.groupedLicensePlates$ = this.licensePlateService.groupedLicensePlates$;
    this.seenCodes$ = this.localStorageService.seenLicensePlates$;
  }

  ngOnInit(): void {
    // Simulate loading state - in reality, this would be based on the service loading state
    setTimeout(() => {
      this.isLoading = false;
    }, 1000);
  }

  onSearchChange(searchTerm: string): void {
    this.currentSearchTerm = searchTerm;
    this.selectedCode = '';  // Clear selection when typing
    this.licensePlateService.setSearchTerm(searchTerm);
  }

  onSeenClick(code: string): void {
    if (code) {
      this.localStorageService.markAsSeen(code.toUpperCase());
    }
  }

  onStateChange(state: string): void {
    this.licensePlateService.setStateFilter(state);
  }

  onLicensePlateClicked(licensePlate: LicensePlate): void {
    // Toggle selection
    if (this.selectedCode === licensePlate.code) {
      // Deselecting - set target scroll position to prevent flicker
      this.targetScrollPosition = this.savedScrollPosition;

      // Restore previous state
      this.selectedCode = '';
      this.currentSearchTerm = this.savedSearchTerm;
      this.licensePlateService.setSearchTerm(this.savedSearchTerm);

      // Reset target scroll position after view has updated
      setTimeout(() => {
        this.targetScrollPosition = -1;
      }, 100);
    } else {
      // Selecting - save current state
      this.savedScrollPosition = window.scrollY || document.documentElement.scrollTop;
      this.savedSearchTerm = this.currentSearchTerm;

      this.selectedCode = licensePlate.code;
      this.currentSearchTerm = licensePlate.code;
      this.licensePlateService.setSearchTerm(licensePlate.code);
    }
  }

  onViewChange(view: 'alphabetical' | 'grouped'): void {
    this.licensePlateService.setViewMode(view);
  }

  getSeenCount(): number {
    return this.localStorageService.getSeenCount();
  }
}
