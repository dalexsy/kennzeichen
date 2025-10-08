import { Component, OnInit } from '@angular/core';
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
  title = 'German License Plate Lookup';

  // Observables from services
  filteredLicensePlates$: Observable<LicensePlate[]>;
  groupedLicensePlates$: Observable<LicensePlateGroup[]>;
  seenCodes$: Observable<Set<string>>;

  // Local state
  currentSearchTerm = '';
  selectedCode = '';
  isLoading = true;

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
      this.selectedCode = '';
      this.currentSearchTerm = '';
      this.licensePlateService.setSearchTerm('');
    } else {
      this.selectedCode = licensePlate.code;
      this.currentSearchTerm = licensePlate.code;
      this.licensePlateService.setSearchTerm('');  // Don't filter the list
    }
  }

  onViewChange(view: 'alphabetical' | 'grouped'): void {
    this.licensePlateService.setViewMode(view);
  }

  getSeenCount(): number {
    return this.localStorageService.getSeenCount();
  }
}
