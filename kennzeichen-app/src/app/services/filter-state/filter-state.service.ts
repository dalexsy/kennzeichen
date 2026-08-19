import { Injectable } from '@angular/core';
import { LicensePlateService } from '../license-plate/license-plate.service';
import { LicensePlateGroup, SavedFilterState } from './filter-state.types';
import {
  FilterMemory,
  stateChangeAction,
  plateSelectionAction,
  groupHeadingAction,
  seenFilterAction,
} from './filter-state-actions';

@Injectable({
  providedIn: 'root',
})
export class FilterStateService implements FilterMemory {
  private savedScrollPosition = 0;
  private savedSearchTerm = '';
  private savedStateFilter = '';

  constructor(private licensePlateService: LicensePlateService) {}

  saveState(searchTerm: string, stateFilter: string): void {
    this.savedScrollPosition = window.scrollY || document.documentElement.scrollTop;
    this.savedSearchTerm = searchTerm;
    this.savedStateFilter = stateFilter;
  }

  restoreState(): SavedFilterState {
    return {
      scrollPosition: this.savedScrollPosition,
      searchTerm: this.savedSearchTerm,
      stateFilter: this.savedStateFilter,
    };
  }

  getSavedScrollPosition(): number {
    return this.savedScrollPosition;
  }

  getSavedSearchTerm(): string {
    return this.savedSearchTerm;
  }

  getSavedStateFilter(): string {
    return this.savedStateFilter;
  }

  clearSavedState(): void {
    this.savedScrollPosition = 0;
    this.savedSearchTerm = '';
    this.savedStateFilter = '';
  }

  handleStateChange(state: string, currentSearchTerm: string, currentStateFilter: string) {
    return stateChangeAction(this, state, currentSearchTerm, currentStateFilter);
  }

  handlePlateSelection(
    code: string,
    selectedCode: string,
    currentSearchTerm: string,
    currentStateFilter: string
  ) {
    return plateSelectionAction(this, code, selectedCode, currentSearchTerm, currentStateFilter);
  }

  handleGroupHeadingClick(
    group: LicensePlateGroup,
    focusedGroup: string,
    currentSearchTerm: string,
    currentStateFilter: string
  ) {
    return groupHeadingAction(this, group, focusedGroup, currentSearchTerm, currentStateFilter);
  }

  handleSeenFilterToggle(isActive: boolean, currentSearchTerm: string, currentStateFilter: string) {
    return seenFilterAction(this, isActive, currentSearchTerm, currentStateFilter);
  }

  clearAllFilters(): void {
    this.licensePlateService.setSearchTerm('');
    this.licensePlateService.setStateFilter('');
    this.licensePlateService.setSeenFilter(false);
    this.clearSavedState();
  }
}
