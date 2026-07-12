import { Component, Input, Output, EventEmitter, inject, ElementRef, ViewChild, AfterViewInit, AfterViewChecked, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { LicensePlate } from '../../models/license-plate.interface';
import { LicensePlateGroup, LicensePlateService } from '../../services/license-plate';
import { LocalStorageService } from '../../services/local-storage';
import { LocalizationService } from '../../services/localization.service';
import { LicensePlateItem } from '../license-plate-item/license-plate-item';
import { ViewToggle } from '../view-toggle/view-toggle';
import {
  ListScrollHost,
  updateBackToTopVisibility,
  scrollToTopButton,
  scrollToNextSection,
  scrollToPreviousSection,
  canScrollNext,
  canScrollPrevious,
} from './license-plate-list-scroll';

@Component({
  selector: 'app-license-plate-list',
  imports: [CommonModule, LicensePlateItem, ViewToggle],
  templateUrl: './license-plate-list.html',
  styleUrl: './license-plate-list.scss'
})
export class LicensePlateList implements AfterViewInit, AfterViewChecked, OnDestroy, ListScrollHost {
  @ViewChild('listContainer') listContainer?: ElementRef;
  @Input() groupedLicensePlates$!: Observable<LicensePlateGroup[]>;
  @Input() seenCodes$!: Observable<Set<string>>;
  @Input() searchTerm: string = '';
  @Input() selectedCode: string = '';
  @Input() isLoading: boolean = false;
  @Input() isMapButtonVisible: boolean = false;
  @Input() targetScrollPosition: number = -1;
  @Input() focusedGroup: string = '';
  @Input() isLicensePlateSelected: boolean = false;
  @Output() itemClicked = new EventEmitter<LicensePlate>();
  @Output() viewChange = new EventEmitter<'alphabetical' | 'grouped'>();
  @Output() groupHeadingClicked = new EventEmitter<LicensePlateGroup>();
  @Output() backClicked = new EventEmitter<void>();
  @Output() clearFiltersClicked = new EventEmitter<void>();

  private licensePlateService = inject(LicensePlateService);
  private localStorageService = inject(LocalStorageService);
  public localizationService = inject(LocalizationService);
  private cdr = inject(ChangeDetectorRef);
  viewMode$ = this.licensePlateService.viewMode$;
  translations$ = this.localizationService.translations$;

  showNavButtons = false;
  showBackToTop = false;
  totalSections = 0;
  private lastSectionCount = 0;
  isScrolling = false;
  private scrollListener = () => {
    this.showBackToTop = updateBackToTopVisibility();
    this.cdr.detectChanges();
  };
  lastClickTime = 0;
  clickTimeout: ReturnType<typeof setTimeout> | null = null;

  private stateIndexMap = new Map<string, number>([
    ['Baden-Württemberg', 0],
    ['Bayern', 1],
    ['Berlin', 2],
    ['Brandenburg', 3],
    ['Bremen', 4],
    ['Hamburg', 5],
    ['Hessen', 6],
    ['Mecklenburg-Vorpommern', 7],
    ['Niedersachsen', 8],
    ['Nordrhein-Westfalen', 9],
    ['Rheinland-Pfalz', 10],
    ['Saarland', 11],
    ['Sachsen', 12],
    ['Sachsen-Anhalt', 13],
    ['Schleswig-Holstein', 14],
    ['Thüringen', 15]
  ]);

  onItemClicked(licensePlate: LicensePlate): void {
    this.itemClicked.emit(licensePlate);
  }

  onViewChange(view: 'alphabetical' | 'grouped'): void {
    this.viewChange.emit(view);
  }

  onGroupHeadingClick(group: LicensePlateGroup): void {
    this.groupHeadingClicked.emit(group);
  }

  onBackClick(): void {
    this.backClicked.emit();
  }

  onClearFiltersClick(): void {
    this.clearFiltersClicked.emit();
  }

  trackByCode(index: number, licensePlate: LicensePlate): string {
    return licensePlate.code;
  }

  trackByState(index: number, group: LicensePlateGroup): string {
    return group.state;
  }

  getTotalCount(groups: LicensePlateGroup[]): number {
    return groups.reduce((total, group) => total + group.licensePlates.length, 0);
  }

  getSeenDate(code: string): string | null {
    return this.localStorageService.getSeenDate(code);
  }

  getStateColorClass(stateName: string): string {
    const index = this.stateIndexMap.get(stateName);
    return index !== undefined ? `state-${index}` : '';
  }

  isGroupFocused(groupName: string): boolean {
    return this.focusedGroup === groupName;
  }

  ngAfterViewInit(): void {
    this.updateNavButtonVisibility();
    this.showBackToTop = updateBackToTopVisibility();
    window.addEventListener('scroll', this.scrollListener);
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.scrollListener);
  }

  ngAfterViewChecked(): void {
    const container = this.listContainer?.nativeElement;
    if (container) {
      const sections = container.querySelectorAll('.group');
      const currentCount = sections.length;

      if (currentCount !== this.lastSectionCount) {
        this.lastSectionCount = currentCount;
        setTimeout(() => {
          this.updateNavButtonVisibility();
        }, 0);
      }

      if (this.targetScrollPosition >= 0) {
        window.scrollTo({
          top: this.targetScrollPosition,
          behavior: 'instant'
        });
      }
    }
  }

  updateNavButtonVisibility(): void {
    const container = this.listContainer?.nativeElement;
    if (container) {
      const sections = container.querySelectorAll('.group');
      this.totalSections = sections.length;
      this.showNavButtons = this.totalSections > 1;
      this.cdr.detectChanges();
    }
  }

  scrollToTopButton(): void {
    scrollToTopButton();
  }

  scrollToNextSection(): void {
    scrollToNextSection(this);
  }

  scrollToPreviousSection(): void {
    scrollToPreviousSection(this);
  }

  canScrollNext(): boolean {
    return canScrollNext(this);
  }

  canScrollPrevious(): boolean {
    return canScrollPrevious(this);
  }
}