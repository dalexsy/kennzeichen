import { Component, Input, Output, EventEmitter, inject, ElementRef, ViewChild, AfterViewInit, AfterViewChecked, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { LicensePlate } from '../../models/license-plate.interface';
import { LicensePlateGroup, LicensePlateService } from '../../services/license-plate';
import { LocalStorageService } from '../../services/local-storage';
import { LicensePlateItem } from '../license-plate-item/license-plate-item';
import { ViewToggle } from '../view-toggle/view-toggle';

@Component({
  selector: 'app-license-plate-list',
  imports: [CommonModule, LicensePlateItem, ViewToggle],
  templateUrl: './license-plate-list.html',
  styleUrl: './license-plate-list.scss'
})
export class LicensePlateList implements AfterViewInit, AfterViewChecked, OnDestroy {
  @ViewChild('listContainer') listContainer?: ElementRef;
  @Input() groupedLicensePlates$!: Observable<LicensePlateGroup[]>;
  @Input() seenCodes$!: Observable<Set<string>>;
  @Input() searchTerm: string = '';
  @Input() selectedCode: string = '';
  @Input() isLoading: boolean = false;
  @Input() isMapButtonVisible: boolean = false;
  @Input() targetScrollPosition: number = -1;
  @Input() focusedGroup: string = '';
  @Output() itemClicked = new EventEmitter<LicensePlate>();
  @Output() viewChange = new EventEmitter<'alphabetical' | 'grouped'>();
  @Output() groupHeadingClicked = new EventEmitter<LicensePlateGroup>();

  private licensePlateService = inject(LicensePlateService);
  private localStorageService = inject(LocalStorageService);
  private cdr = inject(ChangeDetectorRef);
  viewMode$ = this.licensePlateService.viewMode$;

  showNavButtons = false;
  totalSections = 0;
  private lastSectionCount = 0;
  private isScrolling = false;
  private scrollListener = () => this.cdr.detectChanges();
  private lastClickTime = 0;
  private clickTimeout: any = null;

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

      // Apply target scroll position if set
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

  private getCurrentSectionIndex(): number {
    const container = this.listContainer?.nativeElement;
    if (!container) return 0;

    const sections = Array.from(container.querySelectorAll('.group')) as HTMLElement[];
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const stickyHeaderOffset = 253;

    let currentIndex = 0;

    for (let i = sections.length - 1; i >= 0; i--) {
      const rect = sections[i].getBoundingClientRect();
      const absoluteTop = rect.top + scrollTop;

      if (absoluteTop <= scrollTop + stickyHeaderOffset + 50) {
        currentIndex = i;
        break;
      }
    }

    return currentIndex;
  }

  scrollToNextSection(): void {
    if (this.isScrolling) return;

    const now = Date.now();
    const timeSinceLastClick = now - this.lastClickTime;

    // Double-click detection (within 300ms)
    if (timeSinceLastClick < 300) {
      clearTimeout(this.clickTimeout);
      this.scrollToBottom();
      this.lastClickTime = 0;
      return;
    }

    this.lastClickTime = now;

    // Single click with delay to detect potential double-click
    this.clickTimeout = setTimeout(() => {
      const container = this.listContainer?.nativeElement;
      if (!container) return;

      const sections = Array.from(container.querySelectorAll('.group')) as HTMLElement[];
      const currentIndex = this.getCurrentSectionIndex();

      if (currentIndex < sections.length - 1) {
        this.isScrolling = true;
        this.scrollToSection(sections[currentIndex + 1]);

        setTimeout(() => {
          this.isScrolling = false;
        }, 600);
      }
    }, 300);
  }

  scrollToPreviousSection(): void {
    if (this.isScrolling) return;

    const now = Date.now();
    const timeSinceLastClick = now - this.lastClickTime;

    // Double-click detection (within 300ms)
    if (timeSinceLastClick < 300) {
      clearTimeout(this.clickTimeout);
      this.scrollToTop();
      this.lastClickTime = 0;
      return;
    }

    this.lastClickTime = now;

    // Single click with delay to detect potential double-click
    this.clickTimeout = setTimeout(() => {
      const container = this.listContainer?.nativeElement;
      if (!container) return;

      const sections = Array.from(container.querySelectorAll('.group')) as HTMLElement[];
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const stickyHeaderOffset = 253;
      let currentIndex = this.getCurrentSectionIndex();

      const currentSection = sections[currentIndex];
      const rect = currentSection.getBoundingClientRect();
      const absoluteTop = rect.top + scrollTop;

      if (absoluteTop < scrollTop + stickyHeaderOffset - 50) {
        this.isScrolling = true;
        this.scrollToSection(currentSection);
        setTimeout(() => {
          this.isScrolling = false;
        }, 600);
      } else if (currentIndex > 0) {
        this.isScrolling = true;
        this.scrollToSection(sections[currentIndex - 1]);
        setTimeout(() => {
          this.isScrolling = false;
        }, 600);
      }
    }, 300);
  }

  private scrollToSection(section: HTMLElement): void {
    const stickyHeaderOffset = 253;
    const rect = section.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const absoluteTop = rect.top + scrollTop;
    const targetScroll = absoluteTop - stickyHeaderOffset;

    window.scrollTo({
      top: targetScroll,
      behavior: 'smooth'
    });
  }

  private scrollToTop(): void {
    this.isScrolling = true;
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    setTimeout(() => {
      this.isScrolling = false;
    }, 600);
  }

  private scrollToBottom(): void {
    this.isScrolling = true;
    const documentHeight = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    );
    window.scrollTo({
      top: documentHeight,
      behavior: 'smooth'
    });
    setTimeout(() => {
      this.isScrolling = false;
    }, 600);
  }

  canScrollNext(): boolean {
    const container = this.listContainer?.nativeElement;
    if (!container) return false;

    const sections = Array.from(container.querySelectorAll('.group')) as HTMLElement[];
    if (sections.length <= 1) return false;

    const currentIndex = this.getCurrentSectionIndex();
    return currentIndex < sections.length - 1;
  }

  canScrollPrevious(): boolean {
    const container = this.listContainer?.nativeElement;
    if (!container) return false;

    const sections = Array.from(container.querySelectorAll('.group')) as HTMLElement[];
    if (sections.length <= 1) return false;

    const currentIndex = this.getCurrentSectionIndex();
    return currentIndex > 0;
  }
}
