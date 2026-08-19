import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, combineLatest, map, distinctUntilChanged } from 'rxjs';
import { LicensePlate, LicensePlateData } from '../../models/license-plate.interface';
import { LocalStorageService } from '../local-storage/local-storage.service';
import { LicensePlateGroup, groupLicensePlates } from './license-plate-group';
import {
  filterLicensePlates,
  pickMapLicensePlates,
  suggestLicensePlates,
} from './license-plate-filter';

export type { LicensePlateGroup };

@Injectable({
  providedIn: 'root',
})
export class LicensePlateService {
  private localStorageService = inject(LocalStorageService);
  private licensePlatesSubject = new BehaviorSubject<LicensePlate[]>([]);
  private searchTermSubject = new BehaviorSubject<string>('');
  private stateFilterSubject = new BehaviorSubject<string>('');
  private seenFilterSubject = new BehaviorSubject<boolean>(false);
  private viewModeSubject = new BehaviorSubject<'alphabetical' | 'grouped'>(
    this.localStorageService.getViewMode() || 'alphabetical'
  );

  public licensePlates$ = this.licensePlatesSubject.asObservable();
  public searchTerm$ = this.searchTermSubject.asObservable().pipe(distinctUntilChanged());
  public stateFilter$ = this.stateFilterSubject.asObservable().pipe(distinctUntilChanged());
  public seenFilter$ = this.seenFilterSubject.asObservable().pipe(distinctUntilChanged());
  public viewMode$ = this.viewModeSubject.asObservable().pipe(distinctUntilChanged());

  public filteredLicensePlates$ = combineLatest([
    this.licensePlates$,
    this.searchTerm$,
    this.stateFilter$,
    this.seenFilter$,
    this.localStorageService.seenLicensePlates$,
  ]).pipe(
    map(([plates, searchTerm, stateFilter, seenFilter, seenCodes]) =>
      filterLicensePlates(plates, searchTerm, stateFilter, seenFilter, seenCodes)
    )
  );

  public mapLicensePlates$ = combineLatest([
    this.filteredLicensePlates$,
    this.localStorageService.seenLicensePlates$,
    this.licensePlates$,
  ]).pipe(map(([filtered, seenCodes, allPlates]) => pickMapLicensePlates(filtered, seenCodes, allPlates)));

  public availableStates$ = this.filteredLicensePlates$.pipe(
    map((plates) => {
      const states = new Set<string>();
      plates.forEach((plate) => {
        if (plate.federal_state) states.add(plate.federal_state);
      });
      return states;
    })
  );

  public seenCountInFiltered$ = combineLatest([
    this.filteredLicensePlates$,
    this.localStorageService.seenLicensePlates$,
  ]).pipe(map(([plates, seenCodes]) => plates.filter((p) => seenCodes.has(p.code)).length));

  public groupedLicensePlates$ = combineLatest([
    this.filteredLicensePlates$,
    this.viewMode$,
    this.searchTerm$,
  ]).pipe(
    map(([plates, viewMode, searchTerm]) => groupLicensePlates(plates, viewMode, searchTerm))
  );

  constructor(private http: HttpClient) {
    this.loadLicensePlates();
  }

  private loadLicensePlates(): void {
    this.http.get<LicensePlateData>('license-plates.json').subscribe({
      next: (data) => this.licensePlatesSubject.next(data.license_plates),
      error: (error) => console.error('Error loading license plate data:', error),
    });
  }

  setSearchTerm(term: string): void {
    this.searchTermSubject.next(term);
  }

  setStateFilter(state: string): void {
    this.stateFilterSubject.next(state);
  }

  setSeenFilter(showOnlySeen: boolean): void {
    this.seenFilterSubject.next(showOnlySeen);
  }

  setViewMode(mode: 'alphabetical' | 'grouped'): void {
    this.viewModeSubject.next(mode);
    this.localStorageService.saveViewMode(mode);
  }

  getCurrentSeenFilter(): boolean {
    return this.seenFilterSubject.value;
  }

  getLicensePlateByCode(code: string): LicensePlate | undefined {
    return this.licensePlatesSubject.value.find((plate) => plate.code === code);
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

  getSuggestions(input: string, limit: number = 10): LicensePlate[] {
    return suggestLicensePlates(this.licensePlatesSubject.value, input, limit);
  }
}
