import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, BehaviorSubject } from 'rxjs';

import { Kennzeichen } from './models/kennzeichen.interface';
import { KennzeichenService, KennzeichenGroup } from './services/kennzeichen';
import { LocalStorageService } from './services/local-storage';

import { LicensePlateDisplay } from './components/license-plate-display/license-plate-display';
import { SearchInput } from './components/search-input/search-input';
import { KennzeichenList } from './components/kennzeichen-list/kennzeichen-list';
import { ViewToggle } from './components/view-toggle/view-toggle';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    LicensePlateDisplay,
    SearchInput,
    KennzeichenList,
    ViewToggle
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  title = 'German License Plate Lookup';

  // Observables from services
  filteredKennzeichen$: Observable<Kennzeichen[]>;
  groupedKennzeichen$: Observable<KennzeichenGroup[]>;
  seenCodes$: Observable<Set<string>>;

  // Local state
  currentSearchTerm = '';
  isLoading = true;

  constructor(
    private kennzeichenService: KennzeichenService,
    private localStorageService: LocalStorageService
  ) {
    this.filteredKennzeichen$ = this.kennzeichenService.filteredKennzeichen$;
    this.groupedKennzeichen$ = this.kennzeichenService.groupedKennzeichen$;
    this.seenCodes$ = this.localStorageService.seenKennzeichen$;
  }

  ngOnInit(): void {
    // Simulate loading state - in reality, this would be based on the service loading state
    setTimeout(() => {
      this.isLoading = false;
    }, 1000);
  }

  onSearchChange(searchTerm: string): void {
    this.currentSearchTerm = searchTerm;
    this.kennzeichenService.setSearchTerm(searchTerm);
  }

  onStateChange(state: string): void {
    this.kennzeichenService.setStateFilter(state);
  }

  onKennzeichenClicked(kennzeichen: Kennzeichen): void {
    this.localStorageService.toggleSeen(kennzeichen.code);
  }

  onViewChange(view: 'alphabetical' | 'grouped'): void {
    this.kennzeichenService.setViewMode(view);
  }

  getSeenCount(): number {
    return this.localStorageService.getSeenCount();
  }
}
