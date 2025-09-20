import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, combineLatest, map } from 'rxjs';
import { Kennzeichen, KennzeichenData, KennzeichenWithSeen } from '../models/kennzeichen.interface';

export interface KennzeichenGroup {
  state: string;
  kennzeichen: Kennzeichen[];
}

@Injectable({
  providedIn: 'root'
})
export class KennzeichenService {
  private kennzeichenSubject = new BehaviorSubject<Kennzeichen[]>([]);
  private searchTermSubject = new BehaviorSubject<string>('');
  private stateFilterSubject = new BehaviorSubject<string>('');
  private viewModeSubject = new BehaviorSubject<'alphabetical' | 'grouped'>('alphabetical');

  public kennzeichen$ = this.kennzeichenSubject.asObservable();
  public searchTerm$ = this.searchTermSubject.asObservable();
  public stateFilter$ = this.stateFilterSubject.asObservable();
  public viewMode$ = this.viewModeSubject.asObservable();

  // Filtered kennzeichen based on search term and state filter
  public filteredKennzeichen$ = combineLatest([
    this.kennzeichen$,
    this.searchTerm$,
    this.stateFilter$
  ]).pipe(
    map(([kennzeichen, searchTerm, stateFilter]) => {
      let filtered = kennzeichen;

      // Apply state filter first
      if (stateFilter.trim()) {
        filtered = filtered.filter(k => k.federal_state === stateFilter);
      }

      // Apply search filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();

        // First, check if we have any exact code matches
        const codeMatches = filtered.filter(k => k.code.toLowerCase().startsWith(term));

        if (codeMatches.length > 0) {
          // If we have code matches, ONLY show those for autobahn use case
          filtered = codeMatches;
        } else {
          // Only if no code matches, then search in other fields
          filtered = filtered.filter(k => {
            // Search in city/district name
            const cityMatch = k.city_district.toLowerCase().includes(term);
            // Search in derived from
            const derivedMatch = k.derived_from.toLowerCase().includes(term);
            // Search in federal state
            const stateMatch = k.federal_state.toLowerCase().includes(term);

            return cityMatch || derivedMatch || stateMatch;
          });
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

  // Grouped kennzeichen by state or alphabetically
  public groupedKennzeichen$ = combineLatest([
    this.filteredKennzeichen$,
    this.viewMode$
  ]).pipe(
    map(([kennzeichen, viewMode]) => {
      if (viewMode === 'alphabetical') {
        // Group alphabetically by first letter
        const groups = new Map<string, Kennzeichen[]>();

        kennzeichen.forEach(k => {
          const firstLetter = k.code.charAt(0).toUpperCase();
          if (!groups.has(firstLetter)) {
            groups.set(firstLetter, []);
          }
          groups.get(firstLetter)!.push(k);
        });

        // Convert to array and sort by letter
        return Array.from(groups.entries())
          .map(([state, kennzeichen]) => ({ state, kennzeichen }))
          .sort((a, b) => a.state.localeCompare(b.state));
      } else {
        // Group by federal state
        const groups = new Map<string, Kennzeichen[]>();

        kennzeichen.forEach(k => {
          if (!groups.has(k.federal_state)) {
            groups.set(k.federal_state, []);
          }
          groups.get(k.federal_state)!.push(k);
        });

        // Convert to array and sort by state name
        return Array.from(groups.entries())
          .map(([state, kennzeichen]) => ({ state, kennzeichen }))
          .sort((a, b) => a.state.localeCompare(b.state));
      }
    })
  );

  constructor(private http: HttpClient) {
    this.loadKennzeichen();
  }

  private loadKennzeichen(): void {
    this.http.get<KennzeichenData>('kennzeichen.json')
      .subscribe({
        next: (data) => {
          this.kennzeichenSubject.next(data.license_plates);
        },
        error: (error) => {
          console.error('Error loading kennzeichen data:', error);
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
  }

  getKennzeichenByCode(code: string): Kennzeichen | undefined {
    return this.kennzeichenSubject.value.find(k => k.code === code);
  }

  getAllKennzeichen(): Kennzeichen[] {
    return this.kennzeichenSubject.value;
  }

  getCurrentSearchTerm(): string {
    return this.searchTermSubject.value;
  }

  // Get suggestions based on partial input
  getSuggestions(input: string, limit: number = 10): Kennzeichen[] {
    if (!input.trim()) {
      return [];
    }

    const term = input.toLowerCase();
    return this.kennzeichenSubject.value
      .filter(k => k.code.toLowerCase().startsWith(term))
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
