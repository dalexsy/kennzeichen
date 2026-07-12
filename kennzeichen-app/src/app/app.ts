import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';

import { LicensePlate } from './models/license-plate.interface';
import { LicensePlateService, LicensePlateGroup } from './services/license-plate';
import { LocalStorageService } from './services/local-storage';
import { ScrollStateService } from './services/scroll-state.service';
import { FilterStateService } from './services/filter-state.service';

import { LicensePlateDisplay } from './components/license-plate-display/license-plate-display';
import { SearchInput } from './components/search-input/search-input';
import { LicensePlateList } from './components/license-plate-list/license-plate-list';
import { MapComponent } from './components/map/map';
import { TableOfContentsComponent } from './components/table-of-contents/table-of-contents';
import { SettingsComponent } from './components/settings/settings';
import { LocalizationService } from './services/localization.service';
import {
  AppFilterContext,
  handleStateChange,
  handleLicensePlateClicked,
  handleBackClick,
  handleGroupHeadingClicked,
  handleSeenFilterToggle,
} from './app-filter-handlers';

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
export class App implements OnInit, OnDestroy, AppFilterContext {
  @ViewChild(MapComponent) mapComponent?: MapComponent;

  filteredLicensePlates$: Observable<LicensePlate[]>;
  mapLicensePlates$: Observable<LicensePlate[]>;
  groupedLicensePlates$: Observable<LicensePlateGroup[]>;
  seenCodes$: Observable<Set<string>>;

  currentSearchTerm = '';
  selectedCode = '';
  isLoading = true;
  targetScrollPosition = -1;
  focusedGroup = '';
  isSettingsOpen = false;
  readonly emptyStates = new Set<string>();

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
    public localizationService: LocalizationService,
    private localStorageService: LocalStorageService,
    private scrollStateService: ScrollStateService,
    public filterStateService: FilterStateService,
    private cdr: ChangeDetectorRef
  ) {
    this.filteredLicensePlates$ = this.licensePlateService.filteredLicensePlates$;
    this.groupedLicensePlates$ = this.licensePlateService.groupedLicensePlates$;
    this.seenCodes$ = this.localStorageService.seenLicensePlates$;
    this.mapLicensePlates$ = this.licensePlateService.mapLicensePlates$;
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.isLoading = false;
      this.scrollStateService.setupScrollObserver(this.cdr);
      this.scrollStateService.setupScrollListener();
    }, 1000);

    this.groupedLicensePlates$.subscribe((groups) => {
      if (groups?.length) {
        this.scrollStateService.setActiveSection(groups[0].state);
      }
      setTimeout(() => this.scrollStateService.reobserveHeadings(), 100);
    });
  }

  ngOnDestroy(): void {
    this.scrollStateService.destroy();
  }

  onSearchChange(searchTerm: string): void {
    this.currentSearchTerm = searchTerm;
    this.selectedCode = '';
    this.licensePlateService.setSearchTerm(searchTerm);
  }

  onSeenClick(code: string): void {
    if (code) this.localStorageService.markAsSeen(code.toUpperCase());
  }

  onStateChange(state: string): void {
    handleStateChange(this, state);
  }

  onLicensePlateClicked(licensePlate: LicensePlate): void {
    handleLicensePlateClicked(this, licensePlate);
  }

  onViewChange(view: 'alphabetical' | 'grouped'): void {
    this.licensePlateService.setViewMode(view);
  }

  onBackClick(): void {
    handleBackClick(this);
  }

  onGroupHeadingClicked(group: LicensePlateGroup): void {
    handleGroupHeadingClicked(this, group);
  }

  get isSeenFilterActive(): boolean {
    return this.licensePlateService.getCurrentSeenFilter();
  }

  onSeenFilterToggle(): void {
    handleSeenFilterToggle(this);
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

  onContactClick(event: Event): void {
    event.preventDefault();
    window.location.href = 'mailto:daryl@dryl.io';
  }
}
