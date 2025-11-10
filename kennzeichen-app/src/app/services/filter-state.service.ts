import { Injectable } from '@angular/core';
import { LicensePlateService, LicensePlateGroup } from './license-plate';

/**
 * Service responsible for managing filter state and restoration.
 * Handles state filter, search term, seen filter state management
 * and restoration when toggling filters on/off.
 */
@Injectable({
  providedIn: 'root',
})
export class FilterStateService {
  private savedScrollPosition = 0;
  private savedSearchTerm = '';
  private savedStateFilter = '';

  constructor(private licensePlateService: LicensePlateService) {}

  /**
   * Save current filter state before applying a new filter
   */
  saveState(searchTerm: string, stateFilter: string): void {
    this.savedScrollPosition = window.scrollY || document.documentElement.scrollTop;
    this.savedSearchTerm = searchTerm;
    this.savedStateFilter = stateFilter;
  }

  /**
   * Restore previously saved filter state
   */
  restoreState(): { scrollPosition: number; searchTerm: string; stateFilter: string } {
    return {
      scrollPosition: this.savedScrollPosition,
      searchTerm: this.savedSearchTerm,
      stateFilter: this.savedStateFilter,
    };
  }

  /**
   * Get saved scroll position
   */
  getSavedScrollPosition(): number {
    return this.savedScrollPosition;
  }

  /**
   * Get saved search term
   */
  getSavedSearchTerm(): string {
    return this.savedSearchTerm;
  }

  /**
   * Get saved state filter
   */
  getSavedStateFilter(): string {
    return this.savedStateFilter;
  }

  /**
   * Clear saved state (useful when starting fresh)
   */
  clearSavedState(): void {
    this.savedScrollPosition = 0;
    this.savedSearchTerm = '';
    this.savedStateFilter = '';
  }

  /**
   * Handle state filter change
   */
  handleStateChange(
    state: string,
    currentSearchTerm: string,
    currentStateFilter: string
  ): {
    action: 'clear' | 'set';
    scrollPosition?: number;
    searchTerm?: string;
    stateFilter?: string;
    focusedGroup?: string;
  } {
    if (state === '') {
      // Clearing filter - restore previous search
      const restored = this.restoreState();
      return {
        action: 'clear',
        scrollPosition: restored.scrollPosition,
        searchTerm: restored.searchTerm,
        stateFilter: '',
        focusedGroup: '',
      };
    } else if (currentStateFilter !== state) {
      // Setting new filter - save current state BEFORE filtering
      this.saveState(currentSearchTerm, ''); // Always save empty - we want to return to full list
      return {
        action: 'set',
        searchTerm: '',
        stateFilter: state,
        focusedGroup: state,
      };
    }

    return { action: 'clear' };
  }

  /**
   * Handle license plate selection/deselection
   */
  handlePlateSelection(
    code: string,
    selectedCode: string,
    currentSearchTerm: string,
    currentStateFilter: string
  ): {
    action: 'select' | 'deselect' | 'none';
    scrollPosition?: number;
    searchTerm?: string;
    stateFilter?: string;
    focusedGroup?: string;
    selectedCode?: string;
  } {
    // Toggle selection
    if (selectedCode === code) {
      // Deselecting - restore previous state completely
      const restored = this.restoreState();
      return {
        action: 'deselect',
        scrollPosition: restored.scrollPosition,
        searchTerm: restored.searchTerm,
        stateFilter: restored.stateFilter,
        focusedGroup: restored.stateFilter,
        selectedCode: '',
      };
    } else {
      // Selecting - save current state only if we're not already filtered to this plate
      const currentTerm = currentSearchTerm.toLowerCase();
      const clickedCode = code.toLowerCase();

      // Only save scroll position if we're changing the filter
      if (currentTerm !== clickedCode) {
        this.saveState(currentSearchTerm, currentStateFilter);
      }

      return {
        action: 'select',
        searchTerm: '==' + code, // Use exact match delimiter
        stateFilter: '',
        focusedGroup: '',
        selectedCode: code,
      };
    }
  }

  /**
   * Handle group heading click (for filtering by state or letter)
   */
  handleGroupHeadingClick(
    group: LicensePlateGroup,
    focusedGroup: string,
    currentSearchTerm: string,
    currentStateFilter: string
  ): {
    action: 'toggle-off' | 'filter-state' | 'filter-letter';
    scrollPosition?: number;
    searchTerm?: string;
    stateFilter?: string;
    focusedGroup?: string;
  } {
    // Determine if we're in grouped or alphabetical mode
    const isGroupedByState = group.state.length > 1;

    if (isGroupedByState) {
      // In region view - check if we're already focused on this state
      if (focusedGroup === group.state) {
        // Already focused - clear and return to full list
        const restored = this.restoreState();
        return {
          action: 'toggle-off',
          scrollPosition: restored.scrollPosition,
          searchTerm: restored.searchTerm,
          stateFilter: '',
          focusedGroup: '',
        };
      } else {
        // Filter to this state
        this.saveState(currentSearchTerm, currentStateFilter);
        return {
          action: 'filter-state',
          searchTerm: '',
          stateFilter: group.state,
          focusedGroup: group.state,
        };
      }
    } else {
      // In alphabetical view - check if already filtered to this letter
      if (currentSearchTerm === group.state) {
        // Already filtered - untoggle
        const restored = this.restoreState();
        return {
          action: 'toggle-off',
          scrollPosition: restored.scrollPosition,
          searchTerm: restored.searchTerm,
          stateFilter: restored.stateFilter,
          focusedGroup: '',
        };
      } else {
        // Filter by first letter
        this.saveState(currentSearchTerm, currentStateFilter);
        return {
          action: 'filter-letter',
          searchTerm: group.state,
          stateFilter: '',
          focusedGroup: group.state,
        };
      }
    }
  }

  /**
   * Handle seen filter toggle
   */
  handleSeenFilterToggle(
    isActive: boolean,
    currentSearchTerm: string,
    currentStateFilter: string
  ): {
    action: 'turn-on' | 'turn-off';
    scrollPosition?: number;
    searchTerm?: string;
    stateFilter?: string;
    focusedGroup?: string;
  } {
    if (isActive) {
      // Turning off - restore previous state
      const restored = this.restoreState();
      return {
        action: 'turn-off',
        scrollPosition: restored.scrollPosition,
        searchTerm: restored.searchTerm,
        stateFilter: restored.stateFilter,
        focusedGroup: restored.stateFilter,
      };
    } else {
      // Turning on - save current state and clear search term only
      this.saveState(currentSearchTerm, currentStateFilter);
      return {
        action: 'turn-on',
        searchTerm: '',
        // Keep the state filter active
      };
    }
  }

  /**
   * Clear all filters and return to initial state
   */
  clearAllFilters(): void {
    this.licensePlateService.setSearchTerm('');
    this.licensePlateService.setStateFilter('');
    this.licensePlateService.setSeenFilter(false);
    this.clearSavedState();
  }
}
