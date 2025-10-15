import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, combineLatest, map, distinctUntilChanged } from 'rxjs';
import { LicensePlate, LicensePlateData, LicensePlateWithSeen } from '../models/license-plate.interface';
import { LocalStorageService } from './local-storage';

export interface LicensePlateGroup {
  state: string;
  licensePlates: LicensePlate[];
}

@Injectable({
  providedIn: 'root'
})
export class LicensePlateService {
  private localStorageService = inject(LocalStorageService);
  private licensePlatesSubject = new BehaviorSubject<LicensePlate[]>([]);
  private searchTermSubject = new BehaviorSubject<string>('');
  private stateFilterSubject = new BehaviorSubject<string>('');
  private viewModeSubject = new BehaviorSubject<'alphabetical' | 'grouped'>(
    this.localStorageService.getViewMode() || 'alphabetical'
  );

  public licensePlates$ = this.licensePlatesSubject.asObservable();
  public searchTerm$ = this.searchTermSubject.asObservable().pipe(distinctUntilChanged());
  public stateFilter$ = this.stateFilterSubject.asObservable().pipe(distinctUntilChanged());
  public viewMode$ = this.viewModeSubject.asObservable().pipe(distinctUntilChanged());

  // Filtered license plates based on search term and state filter
  public filteredLicensePlates$ = combineLatest([
    this.licensePlates$,
    this.searchTerm$,
    this.stateFilter$
  ]).pipe(
    map(([licensePlates, searchTerm, stateFilter]) => {
      let filtered = licensePlates;

      // Apply state filter first
      if (stateFilter.trim()) {
        filtered = filtered.filter(plate => plate.federal_state === stateFilter);
      }

      // Apply search filter
      if (searchTerm.trim()) {
        let term = searchTerm.toLowerCase();
        let isExactMatch = false;

        // Check if this is an exact match request (starts with ==)
        if (term.startsWith('==')) {
          isExactMatch = true;
          term = term.substring(2); // Remove the == prefix
        }

        if (isExactMatch) {
          // Exact match - only show the plate with this exact code
          filtered = filtered.filter(plate => plate.code.toLowerCase() === term);
        } else {
          // First, check if we have any exact code matches
          const codeMatches = filtered.filter(plate => plate.code.toLowerCase().startsWith(term));

          if (codeMatches.length > 0) {
            // If we have code matches, ONLY show those for autobahn use case
            filtered = codeMatches;
          } else {
            // Only if no code matches, then search in other fields
            filtered = filtered.filter(plate => {
              // Search in city/district name
              const cityMatch = plate.city_district.toLowerCase().includes(term);
              // Search in derived from
              const derivedMatch = plate.derived_from.toLowerCase().includes(term);
              // Search in federal state
              const stateMatch = plate.federal_state.toLowerCase().includes(term);

              return cityMatch || derivedMatch || stateMatch;
            });
          }
        }
      }

      // Sort results
      return filtered.sort((a, b) => {
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const aCodeMatch = a.code.toLowerCase().startsWith(term);
          const bCodeMatch = b.code.toLowerCase().startsWith(term);

          // Code matches always come first
          if (aCodeMatch && !bCodeMatch) return -1;
          if (!aCodeMatch && bCodeMatch) return 1;

          // Among code matches, sort by length then alphabetically
          if (aCodeMatch && bCodeMatch) {
            if (a.code.length !== b.code.length) {
              return a.code.length - b.code.length;
            }
            return a.code.localeCompare(b.code);
          }
        }

        // For non-code matches or no search, sort alphabetically by code
        return a.code.localeCompare(b.code);
      });
    })
  );

  // Grouped license plates by state or alphabetically
  public groupedLicensePlates$ = combineLatest([
    this.filteredLicensePlates$,
    this.viewMode$,
    this.searchTerm$
  ]).pipe(
    map(([licensePlates, viewMode, searchTerm]) => {
      if (viewMode === 'alphabetical') {
        // Group alphabetically by first letter
        const groups = new Map<string, LicensePlate[]>();

        licensePlates.forEach(plate => {
          const firstLetter = plate.code.charAt(0).toUpperCase();
          if (!groups.has(firstLetter)) {
            groups.set(firstLetter, []);
          }
          groups.get(firstLetter)!.push(plate);
        });

        // Convert to array and sort by letter
        return Array.from(groups.entries())
          .map(([state, licensePlates]) => ({ state, licensePlates }))
          .sort((a, b) => a.state.localeCompare(b.state));
      } else {
        // Group by federal state
        const groups = new Map<string, LicensePlate[]>();

        licensePlates.forEach(plate => {
          if (!groups.has(plate.federal_state)) {
            groups.set(plate.federal_state, []);
          }
          groups.get(plate.federal_state)!.push(plate);
        });

        // Convert to array and sort by state name
        let sortedGroups = Array.from(groups.entries())
          .map(([state, licensePlates]) => ({ state, licensePlates }));

        // If searching, sort groups by relevance (groups with top matches first)
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();

          sortedGroups.sort((a, b) => {
            // Check if groups contain exact code matches
            const aHasCodeMatch = a.licensePlates.some(plate => plate.code.toLowerCase().startsWith(term));
            const bHasCodeMatch = b.licensePlates.some(plate => plate.code.toLowerCase().startsWith(term));

            if (aHasCodeMatch && !bHasCodeMatch) return -1;
            if (!aHasCodeMatch && bHasCodeMatch) return 1;

            // Among groups with code matches, prioritize by shortest match
            if (aHasCodeMatch && bHasCodeMatch) {
              const aShortestMatch = Math.min(...a.licensePlates
                .filter(plate => plate.code.toLowerCase().startsWith(term))
                .map(plate => plate.code.length));
              const bShortestMatch = Math.min(...b.licensePlates
                .filter(plate => plate.code.toLowerCase().startsWith(term))
                .map(plate => plate.code.length));

              if (aShortestMatch !== bShortestMatch) {
                return aShortestMatch - bShortestMatch;
              }
            }

            // Default to alphabetical
            return a.state.localeCompare(b.state);
          });
        } else {
          // No search term, sort alphabetically
          sortedGroups.sort((a, b) => a.state.localeCompare(b.state));
        }

        return sortedGroups;
      }
    })
  );

  constructor(private http: HttpClient) {
    this.loadLicensePlates();
  }

  private loadLicensePlates(): void {
    this.http.get<LicensePlateData>('license-plates.json')
      .subscribe({
        next: (data) => {
          this.licensePlatesSubject.next(data.license_plates);
        },
        error: (error) => {
          console.error('Error loading license plate data:', error);
        }
      });
  }

  setSearchTerm(term: string): void {
    this.searchTermSubject.next(term);
  }

  setStateFilter(state: string): void {
    this.stateFilterSubject.next(state);
  }

  setViewMode(mode: 'alphabetical' | 'grouped'): void {
    this.viewModeSubject.next(mode);
    this.localStorageService.saveViewMode(mode);
  }

  getLicensePlateByCode(code: string): LicensePlate | undefined {
    return this.licensePlatesSubject.value.find(plate => plate.code === code);
  }

  getAllLicensePlates(): LicensePlate[] {
    return this.licensePlatesSubject.value;
  }

  getCurrentSearchTerm(): string {
    return this.searchTermSubject.value;
  }

  getCurrentStateFilter(): string {
    return this.stateFilterSubject.value;
  }

  // Get suggestions based on partial input
  getSuggestions(input: string, limit: number = 10): LicensePlate[] {
    if (!input.trim()) {
      return [];
    }

    const term = input.toLowerCase();
    return this.licensePlatesSubject.value
      .filter(plate => plate.code.toLowerCase().startsWith(term))
      .sort((a, b) => {
        // Sort by code length first, then alphabetically
        if (a.code.length !== b.code.length) {
          return a.code.length - b.code.length;
        }
        return a.code.localeCompare(b.code);
      })
      .slice(0, limit);
  }
}