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
  private savedStateFilter = '';

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
      // Setting new filter - save current state BEFORE filtering
      // When clicking a state tile from the full list, we want to save empty string
      // so we can return to the full list when deselecting
      this.savedScrollPosition = window.scrollY || document.documentElement.scrollTop;
      this.savedSearchTerm = this.currentSearchTerm;
      this.savedStateFilter = ''; // Always save empty - we want to return to full list
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
      // Deselecting - restore previous state completely
      this.targetScrollPosition = this.savedScrollPosition;
      this.selectedCode = '';
      this.currentSearchTerm = this.savedSearchTerm;
      
      // IMPORTANT: Restore both search term AND state filter
      this.licensePlateService.setSearchTerm(this.savedSearchTerm);
      this.licensePlateService.setStateFilter(this.savedStateFilter);
      
      // If returning to a filtered state, restore focusedGroup
      // If returning to full list, clear focusedGroup
      this.focusedGroup = this.savedStateFilter;

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
        // Save the current state filter so we can restore it when deselecting
        this.savedStateFilter = this.licensePlateService.getCurrentStateFilter();
      }

      this.selectedCode = licensePlate.code;
      this.currentSearchTerm = licensePlate.code;
      
      // When clicking a plate, use exact match by wrapping in special delimiter
      // This tells the service to match exactly, not as a prefix
      this.licensePlateService.setStateFilter('');
      this.licensePlateService.setSearchTerm('==' + licensePlate.code);
      
      // Clear focusedGroup when selecting a specific plate
      this.focusedGroup = '';
    }
  }

  onViewChange(view: 'alphabetical' | 'grouped'): void {
    this.licensePlateService.setViewMode(view);
  }

  onGroupHeadingClicked(group: LicensePlateGroup): void {
    // Determine if we're in grouped or alphabetical mode based on whether group.state is a full state name or a single letter
    const isGroupedByState = group.state.length > 1;

    if (isGroupedByState) {
      // In region view - check if we're already focused on this state
      // Check focusedGroup first since it persists even when filters are cleared
      if (this.focusedGroup === group.state) {
        // Already focused on this state - clear everything and return to full list
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
        this.savedStateFilter = this.licensePlateService.getCurrentStateFilter();
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
        this.licensePlateService.setStateFilter(this.savedStateFilter);
        this.focusedGroup = '';

        setTimeout(() => {
          this.targetScrollPosition = -1;
        }, 100);
      } else {
        // Filter by first letter
        this.savedScrollPosition = window.scrollY || document.documentElement.scrollTop;
        this.savedSearchTerm = this.currentSearchTerm;
        this.savedStateFilter = this.licensePlateService.getCurrentStateFilter();
        this.currentSearchTerm = group.state;
        this.licensePlateService.setSearchTerm(group.state);
        this.licensePlateService.setStateFilter('');
        this.focusedGroup = group.state;
      }
    }
  }

  getSeenCount(): number {
    return this.localStorageService.getSeenCount();
  }
}