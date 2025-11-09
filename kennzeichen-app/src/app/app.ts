import { Component, OnInit, OnDestroy, ViewChild, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, BehaviorSubject } from 'rxjs';

import { LicensePlate } from './models/license-plate.interface';
import { LicensePlateService, LicensePlateGroup } from './services/license-plate';
import { LocalStorageService } from './services/local-storage';
import { MapStateService } from './services/map-state.service';

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
  activeSection = '';
  availableStates: Set<string> = new Set();
  isSettingsOpen = false;
  private savedScrollPosition = 0;
  private savedSearchTerm = '';
  private savedStateFilter = '';
  private isScrollingProgrammatically = false;
  private scrollTimeout?: number;
  private tocClickedSection: string = '';

  get isMapButtonVisible(): boolean {
    return this.mapComponent?.shouldShowMapButton || false;
  }

  get isLicensePlateSelected(): boolean {
    return this.selectedCode !== '';
  }

  constructor(
    public licensePlateService: LicensePlateService,
    private localStorageService: LocalStorageService,
    private mapStateService: MapStateService,
    private ngZone: NgZone,
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
    // Simulate loading state - in reality, this would be based on the service loading state
    setTimeout(() => {
      this.isLoading = false;
      this.setupScrollObserver();
      this.setupScrollListener();
    }, 1000);

    // Re-observe when grouped list changes
    this.groupedLicensePlates$.subscribe((groups) => {
      // Immediately set the accent color to the first group's state color
      if (groups && groups.length > 0) {
        const firstStateName = groups[0].state;
        this.activeSection = firstStateName;
        this.updateAccentColor(firstStateName);
      }

      setTimeout(() => {
        if (this.observer) {
          this.observer.disconnect();
          const headings = document.querySelectorAll('.group-heading');
          headings.forEach((heading) => this.observer?.observe(heading));
        }
      }, 100);
    });
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
  }

  private observer?: IntersectionObserver;

  private setupScrollListener(): void {
    // Listen for any scroll events and block IntersectionObserver updates
    window.addEventListener(
      'scroll',
      () => {
        // Only set flag if we're not in a TOC click
        // TOC clicks manage their own timing
        if (!this.tocClickedSection) {
          this.isScrollingProgrammatically = true;

          // Clear existing timeout
          if (this.scrollTimeout) {
            clearTimeout(this.scrollTimeout);
          }

          // Reset flag after scrolling stops (300ms of no scroll events)
          this.scrollTimeout = window.setTimeout(() => {
            this.isScrollingProgrammatically = false;
          }, 300);
        }
      },
      { passive: true }
    );
  }

  private setupScrollObserver(): void {
    const options = {
      root: null,
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0,
    };

    this.observer = new IntersectionObserver((entries) => {
      // Don't update active section during programmatic scrolls or TOC clicks
      if (this.isScrollingProgrammatically || this.tocClickedSection) {
        console.log(
          'Blocked: isScrolling=' +
            this.isScrollingProgrammatically +
            ', tocClicked=' +
            this.tocClickedSection
        );
        return;
      }

      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const headingText = entry.target.querySelector('.heading-text')?.textContent?.trim();
          if (headingText) {
            // Extract just the state name (before the count)
            const stateName = headingText.split('(')[0].trim();

            // Run inside Angular zone to ensure change detection
            this.ngZone.run(() => {
              console.log('Observer updating to:', stateName);
              this.activeSection = stateName;
              this.updateAccentColor(stateName);
              this.cdr.detectChanges();
            });
          }
        }
      });
    }, options);

    // Observe all group headings
    setTimeout(() => {
      const headings = document.querySelectorAll('.group-heading');
      headings.forEach((heading) => this.observer?.observe(heading));
    }, 100);
  }

  private updateAccentColor(stateName: string): void {
    // Get the state color directly from the MapStateService
    const color = this.mapStateService.getStateColor(stateName);
    if (color) {
      // Set the accent-tertiary color to match the state
      document.documentElement.style.setProperty('--accent-tertiary', color);
    } else {
      // Reset to default color when not viewing states (e.g., alphabetical view)
      // Remove the inline style to let CSS variables handle light/dark mode
      document.documentElement.style.removeProperty('--accent-tertiary');
    }
  }

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

  onBackClick(): void {
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

    if (currentFilter) {
      // Turning off - restore previous state
      this.targetScrollPosition = this.savedScrollPosition;
      this.currentSearchTerm = this.savedSearchTerm;
      this.focusedGroup = this.savedStateFilter;
      this.licensePlateService.setSeenFilter(false);
      this.licensePlateService.setSearchTerm(this.savedSearchTerm);
      this.licensePlateService.setStateFilter(this.savedStateFilter);

      setTimeout(() => {
        this.targetScrollPosition = -1;
      }, 100);
    } else {
      // Turning on - save current state and clear search term only (preserve state filter)
      this.savedScrollPosition = window.scrollY || document.documentElement.scrollTop;
      this.savedSearchTerm = this.currentSearchTerm;
      this.savedStateFilter = this.licensePlateService.getCurrentStateFilter();
      this.currentSearchTerm = '';
      this.selectedCode = '';
      this.licensePlateService.setSeenFilter(true);
      this.licensePlateService.setSearchTerm('');
      // Keep the state filter active - don't clear it
    }
  }

  get isSeenFilterActive(): boolean {
    return this.licensePlateService.getCurrentSeenFilter();
  }

  onTocSectionClick(section: string): void {
    console.log('TOC clicked:', section);

    // Lock the section so IntersectionObserver can't change it
    this.tocClickedSection = section;
    this.isScrollingProgrammatically = true;

    console.log(
      'Flags set - tocClickedSection:',
      this.tocClickedSection,
      'isScrolling:',
      this.isScrollingProgrammatically
    );

    // Immediately update the active section and color
    this.activeSection = section;
    this.updateAccentColor(section);

    // Find the group container element and scroll to it
    const groups = document.querySelectorAll('.group');
    let found = false;

    for (const group of Array.from(groups)) {
      const headingText = group.querySelector('.heading-text')?.textContent?.trim();
      if (headingText?.startsWith(section)) {
        // Get the header height to offset scroll position
        const header = document.querySelector('.sticky-header');
        const headerHeight = header ? header.clientHeight : 0;

        // Get the absolute position of the group container in the document
        const rect = group.getBoundingClientRect();
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const absoluteTop = rect.top + scrollTop;

        // Calculate target scroll position accounting for header and padding
        const offsetPosition = absoluteTop - headerHeight;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });

        found = true;
        break;
      }
    }

    // Keep the section locked for 1.5 seconds to allow smooth scroll to complete
    setTimeout(() => {
      console.log('Unlocking after 1.5s');
      this.tocClickedSection = '';
      this.isScrollingProgrammatically = false;
    }, 1500);
  }

  onClearAllFilters(): void {
    // Clear all active filters and return to full list
    this.selectedCode = '';
    this.currentSearchTerm = '';
    this.focusedGroup = '';
    this.licensePlateService.setSearchTerm('');
    this.licensePlateService.setStateFilter('');
    this.licensePlateService.setSeenFilter(false);
  }

  onSettingsMenuChange(isOpen: boolean): void {
    this.isSettingsOpen = isOpen;
  }
}
