import { Injectable, NgZone, ChangeDetectorRef } from '@angular/core';
import { MapStateService } from './map-state.service';

/**
 * Service responsible for managing scroll-related state and behavior.
 * Handles IntersectionObserver for section highlighting, TOC navigation,
 * and scroll position tracking.
 */
@Injectable({
  providedIn: 'root',
})
export class ScrollStateService {
  private observer?: IntersectionObserver;
  private scrollTimeout?: number;
  private isScrollingProgrammatically = false;
  private tocClickedSection: string = '';

  public activeSection: string = '';

  constructor(private mapStateService: MapStateService, private ngZone: NgZone) {}

  /**
   * Set up scroll listener to detect when user is scrolling
   */
  setupScrollListener(): void {
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

  /**
   * Set up IntersectionObserver to detect which section is currently visible
   */
  setupScrollObserver(cdr: ChangeDetectorRef): void {
    const options = {
      root: null,
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0,
    };

    this.observer = new IntersectionObserver((entries) => {
      // Don't update active section during programmatic scrolls or TOC clicks
      if (this.isScrollingProgrammatically || this.tocClickedSection) {
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
              this.activeSection = stateName;
              this.updateAccentColor(stateName);
              cdr.detectChanges();
            });
          }
        }
      });
    }, options);

    // Observe all group headings after a short delay
    setTimeout(() => {
      const headings = document.querySelectorAll('.group-heading');
      headings.forEach((heading) => this.observer?.observe(heading));
    }, 100);
  }

  /**
   * Re-observe headings when the grouped list changes
   */
  reobserveHeadings(): void {
    if (this.observer) {
      this.observer.disconnect();
      setTimeout(() => {
        const headings = document.querySelectorAll('.group-heading');
        headings.forEach((heading) => this.observer?.observe(heading));
      }, 100);
    }
  }

  /**
   * Handle TOC section click and scroll to that section
   */
  scrollToSection(section: string): void {
    // Lock the section so IntersectionObserver can't change it
    this.tocClickedSection = section;
    this.isScrollingProgrammatically = true;

    // Immediately update the active section and color
    this.activeSection = section;
    this.updateAccentColor(section);

    // Find the group container element and scroll to it
    const groups = document.querySelectorAll('.group');

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

        break;
      }
    }

    // Keep the section locked for 1.5 seconds to allow smooth scroll to complete
    setTimeout(() => {
      this.tocClickedSection = '';
      this.isScrollingProgrammatically = false;
    }, 1500);
  }

  /**
   * Update the accent color based on the currently active section
   */
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

  /**
   * Set the active section and update accent color (used on init)
   */
  setActiveSection(section: string): void {
    this.activeSection = section;
    this.updateAccentColor(section);
  }

  /**
   * Clean up observers and timers
   */
  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
  }
}
