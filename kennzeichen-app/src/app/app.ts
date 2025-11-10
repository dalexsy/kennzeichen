import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';

import { LicensePlate } from './models/license-plate.interface';
import { LicensePlateService, LicensePlateGroup } from './services/license-plate';
import { LocalStorageService } from './services/local-storage';
import { ScrollStateService } from './services/scroll-state.service';
import { FilterStateService } from './services/filter-state.service';
import { FirebaseSyncService } from './services/firebase-sync.service';

import { LicensePlateDisplay } from './components/license-plate-display/license-plate-display';
import { SearchInput } from './components/search-input/search-input';
import { LicensePlateList } from './components/license-plate-list/license-plate-list';
import { MapComponent } from './components/map/map';
import { TableOfContentsComponent } from './components/table-of-contents/table-of-contents';
import { SettingsComponent } from './components/settings/settings';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    LicensePlateDisplay,
    SearchInput,
    LicensePlateList,
    MapComponent,
    TableOfContentsComponent,
    SettingsComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit, OnDestroy {
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
  availableStates: Set<string> = new Set();
  isSettingsOpen = false;

  get activeSection(): string {
    return this.scrollStateService.activeSection;
  }

  get isMapButtonVisible(): boolean {
    return this.mapComponent?.shouldShowMapButton || false;
  }

  get isLicensePlateSelected(): boolean {
    return this.selectedCode !== '';
  }

  constructor(
    public licensePlateService: LicensePlateService,
    private localStorageService: LocalStorageService,
    private scrollStateService: ScrollStateService,
    private filterStateService: FilterStateService,
    private firebaseSyncService: FirebaseSyncService,
    private cdr: ChangeDetectorRef
  ) {
    this.filteredLicensePlates$ = this.licensePlateService.filteredLicensePlates$;
    this.groupedLicensePlates$ = this.licensePlateService.groupedLicensePlates$;
    this.seenCodes$ = this.localStorageService.seenLicensePlates$;

    // Subscribe to filtered plates to update available states
    this.filteredLicensePlates$.subscribe((plates) => {
      const states = new Set<string>();
      plates.forEach((plate) => {
        if (plate.federal_state) {
          states.add(plate.federal_state);
        }
      });
      this.availableStates = states;
    });
  }

  ngOnInit(): void {
    // Simulate loading state
    setTimeout(() => {
      this.isLoading = false;
      this.scrollStateService.setupScrollObserver(this.cdr);
      this.scrollStateService.setupScrollListener();
    }, 1000);

    // Re-observe when grouped list changes
    this.groupedLicensePlates$.subscribe((groups) => {
      // Set the accent color to the first group's state color
      if (groups && groups.length > 0) {
        const firstStateName = groups[0].state;
        this.scrollStateService.setActiveSection(firstStateName);
      }

      // Re-observe headings after a short delay
      setTimeout(() => {
        this.scrollStateService.reobserveHeadings();
      }, 100);
    });
  }

  ngOnDestroy(): void {
    this.scrollStateService.destroy();
  }

  private observer?: IntersectionObserver;

  onSearchChange(searchTerm: string): void {
    this.currentSearchTerm = searchTerm;
    this.selectedCode = ''; // Clear selection when typing
    this.licensePlateService.setSearchTerm(searchTerm);
  }

  onSeenClick(code: string): void {
    if (code) {
      this.localStorageService.markAsSeen(code.toUpperCase());
    }
  }

  onStateChange(state: string): void {
    const currentStateFilter = this.licensePlateService.getCurrentStateFilter();
    const result = this.filterStateService.handleStateChange(
      state,
      this.currentSearchTerm,
      currentStateFilter
    );

    if (result.action === 'clear') {
      this.targetScrollPosition = result.scrollPosition ?? 0;
      this.currentSearchTerm = result.searchTerm ?? '';
      this.focusedGroup = result.focusedGroup ?? '';
      this.licensePlateService.setStateFilter('');
      this.licensePlateService.setSearchTerm(result.searchTerm ?? '');

      setTimeout(() => {
        this.targetScrollPosition = -1;
      }, 100);
    } else if (result.action === 'set') {
      this.focusedGroup = result.focusedGroup ?? state;
      if (this.currentSearchTerm !== '') {
        this.licensePlateService.setSearchTerm('');
      }
      this.currentSearchTerm = '';
      this.licensePlateService.setStateFilter(state);
    }
  }

  onLicensePlateClicked(licensePlate: LicensePlate): void {
    const currentStateFilter = this.licensePlateService.getCurrentStateFilter();
    const result = this.filterStateService.handlePlateSelection(
      licensePlate.code,
      this.selectedCode,
      this.currentSearchTerm,
      currentStateFilter
    );

    if (result.action === 'deselect') {
      this.targetScrollPosition = result.scrollPosition ?? 0;
      this.selectedCode = '';
      this.currentSearchTerm = result.searchTerm ?? '';
      this.focusedGroup = result.focusedGroup ?? '';

      this.licensePlateService.setSearchTerm(result.searchTerm ?? '');
      this.licensePlateService.setStateFilter(result.stateFilter ?? '');

      setTimeout(() => {
        this.targetScrollPosition = -1;
      }, 100);
    } else if (result.action === 'select') {
      this.selectedCode = result.selectedCode ?? licensePlate.code;
      this.currentSearchTerm = licensePlate.code;
      this.focusedGroup = '';

      this.licensePlateService.setStateFilter('');
      this.licensePlateService.setSearchTerm('==' + licensePlate.code);
    }
  }

  onViewChange(view: 'alphabetical' | 'grouped'): void {
    this.licensePlateService.setViewMode(view);
  }

  onBackClick(): void {
    const restored = this.filterStateService.restoreState();

    this.targetScrollPosition = restored.scrollPosition;
    this.selectedCode = '';
    this.currentSearchTerm = restored.searchTerm;
    this.focusedGroup = restored.stateFilter;

    this.licensePlateService.setSearchTerm(restored.searchTerm);
    this.licensePlateService.setStateFilter(restored.stateFilter);

    setTimeout(() => {
      this.targetScrollPosition = -1;
    }, 100);
  }

  onGroupHeadingClicked(group: LicensePlateGroup): void {
    const currentStateFilter = this.licensePlateService.getCurrentStateFilter();
    const result = this.filterStateService.handleGroupHeadingClick(
      group,
      this.focusedGroup,
      this.currentSearchTerm,
      currentStateFilter
    );

    if (result.action === 'toggle-off') {
      this.targetScrollPosition = result.scrollPosition ?? 0;
      this.currentSearchTerm = result.searchTerm ?? '';
      this.focusedGroup = result.focusedGroup ?? '';

      this.licensePlateService.setStateFilter(result.stateFilter ?? '');
      this.licensePlateService.setSearchTerm(result.searchTerm ?? '');

      setTimeout(() => {
        this.targetScrollPosition = -1;
      }, 100);
    } else if (result.action === 'filter-state') {
      this.focusedGroup = result.focusedGroup ?? group.state;
      if (this.currentSearchTerm !== '') {
        this.licensePlateService.setSearchTerm('');
      }
      this.currentSearchTerm = '';
      this.licensePlateService.setStateFilter(group.state);
    } else if (result.action === 'filter-letter') {
      this.currentSearchTerm = group.state;
      this.focusedGroup = group.state;

      this.licensePlateService.setSearchTerm(group.state);
      this.licensePlateService.setStateFilter('');
    }
  }

  getSeenCount(): number {
    // Count how many of the currently filtered plates have been seen
    let count = 0;
    const seenCodesArray = this.localStorageService.getSeenCodes();
    const seenCodes = new Set(seenCodesArray);

    this.filteredLicensePlates$
      .subscribe((plates) => {
        count = plates.filter((plate) => seenCodes.has(plate.code)).length;
      })
      .unsubscribe();

    return count;
  }

  onSeenFilterToggle(): void {
    const currentFilter = this.licensePlateService.getCurrentSeenFilter();
    const currentStateFilter = this.licensePlateService.getCurrentStateFilter();
    const result = this.filterStateService.handleSeenFilterToggle(
      currentFilter,
      this.currentSearchTerm,
      currentStateFilter
    );

    if (result.action === 'turn-off') {
      this.targetScrollPosition = result.scrollPosition ?? 0;
      this.currentSearchTerm = result.searchTerm ?? '';
      this.focusedGroup = result.stateFilter ?? '';

      this.licensePlateService.setSeenFilter(false);
      this.licensePlateService.setSearchTerm(result.searchTerm ?? '');
      this.licensePlateService.setStateFilter(result.stateFilter ?? '');

      setTimeout(() => {
        this.targetScrollPosition = -1;
      }, 100);
    } else if (result.action === 'turn-on') {
      this.currentSearchTerm = '';
      this.selectedCode = '';

      this.licensePlateService.setSeenFilter(true);
      this.licensePlateService.setSearchTerm('');
    }
  }

  get isSeenFilterActive(): boolean {
    return this.licensePlateService.getCurrentSeenFilter();
  }

  onTocSectionClick(section: string): void {
    this.scrollStateService.scrollToSection(section);
  }

  onClearAllFilters(): void {
    this.filterStateService.clearAllFilters();
    this.selectedCode = '';
    this.currentSearchTerm = '';
    this.focusedGroup = '';
  }

  onSettingsMenuChange(isOpen: boolean): void {
    this.isSettingsOpen = isOpen;
  }
}
