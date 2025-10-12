import { Component, Input, Output, EventEmitter, inject, ElementRef, ViewChild, AfterViewInit, AfterViewChecked, ChangeDetectorRef, OnDestroy, HostListener } from '@angular/core';
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
  @Output() itemClicked = new EventEmitter<LicensePlate>();
  @Output() viewChange = new EventEmitter<'alphabetical' | 'grouped'>();

  private licensePlateService = inject(LicensePlateService);
  private localStorageService = inject(LocalStorageService);
  private cdr = inject(ChangeDetectorRef);
  viewMode$ = this.licensePlateService.viewMode$;

  showNavButtons = false;
  totalSections = 0;
  private lastSectionCount = 0;
  private scrollCheckInterval?: number;
  private isScrolling = false;

  onItemClicked(licensePlate: LicensePlate): void {
    this.itemClicked.emit(licensePlate);
  }

  onViewChange(view: 'alphabetical' | 'grouped'): void {
    this.viewChange.emit(view);
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

  ngAfterViewInit(): void {
    this.updateNavButtonVisibility();
    // Check scroll position periodically to update arrow visibility
    this.scrollCheckInterval = window.setInterval(() => {
      this.cdr.detectChanges();
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.scrollCheckInterval) {
      clearInterval(this.scrollCheckInterval);
    }
  }

  ngAfterViewChecked(): void {
    const container = this.listContainer?.nativeElement;
    if (container) {
      const sections = container.querySelectorAll('.group');
      const currentCount = sections.length;

      // Only update if section count changed to avoid excessive updates
      if (currentCount !== this.lastSectionCount) {
        this.lastSectionCount = currentCount;
        // Use setTimeout to defer the update and avoid ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => {
          this.updateNavButtonVisibility();
        }, 0);
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
    const stickyHeaderOffset = 15 * 16;

    let currentIndex = 0;

    for (let i = sections.length - 1; i >= 0; i--) {
      const rect = sections[i].getBoundingClientRect();
      const absoluteTop = rect.top + scrollTop;

      if (absoluteTop <= scrollTop + stickyHeaderOffset + 10) {
        currentIndex = i;
        break;
      }
    }

    return currentIndex;
  }

  scrollToNextSection(): void {
    if (this.isScrolling) return;

    const container = this.listContainer?.nativeElement;
    if (!container) return;

    const sections = Array.from(container.querySelectorAll('.group')) as HTMLElement[];
    const currentIndex = this.getCurrentSectionIndex();

    if (currentIndex < sections.length - 1) {
      this.isScrolling = true;
      this.scrollToSection(sections[currentIndex + 1]);

      setTimeout(() => {
        this.isScrolling = false;
      }, 500);
    }
  }

  scrollToPreviousSection(): void {
    if (this.isScrolling) return;

    const container = this.listContainer?.nativeElement;
    if (!container) return;

    const sections = Array.from(container.querySelectorAll('.group')) as HTMLElement[];
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const stickyHeaderOffset = 15 * 16;
    let currentIndex = this.getCurrentSectionIndex();

    const currentSection = sections[currentIndex];
    const rect = currentSection.getBoundingClientRect();
    const absoluteTop = rect.top + scrollTop;

    if (absoluteTop < scrollTop + stickyHeaderOffset - 10) {
      this.isScrolling = true;
      this.scrollToSection(currentSection);
      setTimeout(() => {
        this.isScrolling = false;
      }, 500);
    } else if (currentIndex > 0) {
      this.isScrolling = true;
      this.scrollToSection(sections[currentIndex - 1]);
      setTimeout(() => {
        this.isScrolling = false;
      }, 500);
    }
  }

  private scrollToSection(section: HTMLElement): void {
    const stickyHeaderOffset = 15 * 16;
    const rect = section.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const absoluteTop = rect.top + scrollTop;
    const targetScroll = absoluteTop - stickyHeaderOffset;

    window.scrollTo({
      top: targetScroll,
      behavior: 'smooth'
    });
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
