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
  focusedGroup = '';
  private savedScrollPosition = 0;
  private savedSearchTerm = '';

  get isMapButtonVisible(): boolean {
    return this.mapComponent?.shouldShowMapButton || false;
  }

  constructor(
    public licensePlateService: LicensePlateService,
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
    const currentStateFilter = this.licensePlateService.getCurrentStateFilter();

    if (state === '') {
      // Clearing filter - restore previous search
      this.targetScrollPosition = this.savedScrollPosition;
      this.currentSearchTerm = this.savedSearchTerm;
      this.focusedGroup = '';
      this.licensePlateService.setStateFilter('');
      this.licensePlateService.setSearchTerm(this.savedSearchTerm);

      setTimeout(() => {
        this.targetScrollPosition = -1;
      }, 100);
    } else if (currentStateFilter !== state) {
      // Setting new filter - save current state
      this.savedScrollPosition = window.scrollY || document.documentElement.scrollTop;
      this.savedSearchTerm = this.currentSearchTerm;
      this.focusedGroup = state;
      if (this.currentSearchTerm !== '') {
        this.licensePlateService.setSearchTerm('');
      }
      this.currentSearchTerm = '';
      this.licensePlateService.setStateFilter(state);
    }
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
      // Selecting - save current state only if we're not already filtered to this plate
      const currentTerm = this.currentSearchTerm.toLowerCase();
      const clickedCode = licensePlate.code.toLowerCase();

      // Only save scroll position if we're changing the filter (not if already showing just this plate)
      if (currentTerm !== clickedCode) {
        this.savedScrollPosition = window.scrollY || document.documentElement.scrollTop;
        this.savedSearchTerm = this.currentSearchTerm;
      }

      this.selectedCode = licensePlate.code;
      this.currentSearchTerm = licensePlate.code;
      this.licensePlateService.setSearchTerm(licensePlate.code);
    }
  }

  onViewChange(view: 'alphabetical' | 'grouped'): void {
    this.licensePlateService.setViewMode(view);
  }

  onGroupHeadingClicked(group: LicensePlateGroup): void {
    // Determine if we're in grouped or alphabetical mode based on whether group.state is a full state name or a single letter
    const isGroupedByState = group.state.length > 1;

    if (isGroupedByState) {
      // In region view - check if we're already filtered to this state
      const currentStateFilter = this.licensePlateService.getCurrentStateFilter();

      if (currentStateFilter === group.state) {
        // Already filtered to this state - untoggle by restoring previous search
        this.targetScrollPosition = this.savedScrollPosition;
        this.currentSearchTerm = this.savedSearchTerm;
        this.focusedGroup = '';
        this.licensePlateService.setStateFilter('');
        this.licensePlateService.setSearchTerm(this.savedSearchTerm);

        setTimeout(() => {
          this.targetScrollPosition = -1;
        }, 100);
      } else {
        // Filter to this state
        this.savedScrollPosition = window.scrollY || document.documentElement.scrollTop;
        this.savedSearchTerm = this.currentSearchTerm;
        this.focusedGroup = group.state;
        // Clear search term first if needed, then set state filter
        if (this.currentSearchTerm !== '') {
          this.licensePlateService.setSearchTerm('');
        }
        this.currentSearchTerm = '';
        this.licensePlateService.setStateFilter(group.state);
      }
    } else {
      // In alphabetical view - check if already filtered to this letter
      if (this.currentSearchTerm === group.state) {
        // Already filtered - untoggle by restoring previous search
        this.targetScrollPosition = this.savedScrollPosition;
        this.currentSearchTerm = this.savedSearchTerm;
        this.licensePlateService.setSearchTerm(this.savedSearchTerm);
        this.focusedGroup = '';

        setTimeout(() => {
          this.targetScrollPosition = -1;
        }, 100);
      } else {
        // Filter by first letter
        this.savedScrollPosition = window.scrollY || document.documentElement.scrollTop;
        this.savedSearchTerm = this.currentSearchTerm;
        this.currentSearchTerm = group.state;
        this.licensePlateService.setSearchTerm(group.state);
        this.focusedGroup = group.state;
      }
    }
  }

  getSeenCount(): number {
    return this.localStorageService.getSeenCount();
  }
}
