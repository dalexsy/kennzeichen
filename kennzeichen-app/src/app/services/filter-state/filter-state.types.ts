import { LicensePlateGroup } from '../license-plate/license-plate-group';

export interface SavedFilterState {
  scrollPosition: number;
  searchTerm: string;
  stateFilter: string;
}

export interface StateChangeResult {
  action: 'clear' | 'set';
  scrollPosition?: number;
  searchTerm?: string;
  stateFilter?: string;
  focusedGroup?: string;
}

export interface PlateSelectionResult {
  action: 'select' | 'deselect' | 'none';
  scrollPosition?: number;
  searchTerm?: string;
  stateFilter?: string;
  focusedGroup?: string;
  selectedCode?: string;
}

export interface GroupHeadingResult {
  action: 'toggle-off' | 'filter-state' | 'filter-letter';
  scrollPosition?: number;
  searchTerm?: string;
  stateFilter?: string;
  focusedGroup?: string;
}

export interface SeenFilterResult {
  action: 'turn-on' | 'turn-off';
  scrollPosition?: number;
  searchTerm?: string;
  stateFilter?: string;
  focusedGroup?: string;
}

export type { LicensePlateGroup };
