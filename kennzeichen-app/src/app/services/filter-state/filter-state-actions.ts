import {
  SavedFilterState,
  StateChangeResult,
  PlateSelectionResult,
  GroupHeadingResult,
  SeenFilterResult,
  LicensePlateGroup,
} from './filter-state.types';

export interface FilterMemory {
  saveState(searchTerm: string, stateFilter: string): void;
  restoreState(): SavedFilterState;
}

export function stateChangeAction(
  memory: FilterMemory,
  state: string,
  currentSearchTerm: string,
  currentStateFilter: string
): StateChangeResult {
  if (state === '') {
    const restored = memory.restoreState();
    return {
      action: 'clear',
      scrollPosition: restored.scrollPosition,
      searchTerm: restored.searchTerm,
      stateFilter: '',
      focusedGroup: '',
    };
  }
  if (currentStateFilter !== state) {
    memory.saveState(currentSearchTerm, '');
    return { action: 'set', searchTerm: '', stateFilter: state, focusedGroup: state };
  }
  return { action: 'clear' };
}

export function plateSelectionAction(
  memory: FilterMemory,
  code: string,
  selectedCode: string,
  currentSearchTerm: string,
  currentStateFilter: string
): PlateSelectionResult {
  if (selectedCode === code) {
    const restored = memory.restoreState();
    return {
      action: 'deselect',
      scrollPosition: restored.scrollPosition,
      searchTerm: restored.searchTerm,
      stateFilter: restored.stateFilter,
      focusedGroup: restored.stateFilter,
      selectedCode: '',
    };
  }
  if (currentSearchTerm.toLowerCase() !== code.toLowerCase()) {
    memory.saveState(currentSearchTerm, currentStateFilter);
  }
  return {
    action: 'select',
    searchTerm: '==' + code,
    stateFilter: '',
    focusedGroup: '',
    selectedCode: code,
  };
}

export function groupHeadingAction(
  memory: FilterMemory,
  group: LicensePlateGroup,
  focusedGroup: string,
  currentSearchTerm: string,
  currentStateFilter: string
): GroupHeadingResult {
  const isGroupedByState = group.state.length > 1;
  if (isGroupedByState) {
    if (focusedGroup === group.state) {
      const restored = memory.restoreState();
      return {
        action: 'toggle-off',
        scrollPosition: restored.scrollPosition,
        searchTerm: restored.searchTerm,
        stateFilter: '',
        focusedGroup: '',
      };
    }
    memory.saveState(currentSearchTerm, currentStateFilter);
    return { action: 'filter-state', searchTerm: '', stateFilter: group.state, focusedGroup: group.state };
  }
  if (currentSearchTerm === group.state) {
    const restored = memory.restoreState();
    return {
      action: 'toggle-off',
      scrollPosition: restored.scrollPosition,
      searchTerm: restored.searchTerm,
      stateFilter: restored.stateFilter,
      focusedGroup: '',
    };
  }
  memory.saveState(currentSearchTerm, currentStateFilter);
  return { action: 'filter-letter', searchTerm: group.state, stateFilter: '', focusedGroup: group.state };
}

export function seenFilterAction(
  memory: FilterMemory,
  isActive: boolean,
  currentSearchTerm: string,
  currentStateFilter: string
): SeenFilterResult {
  if (isActive) {
    const restored = memory.restoreState();
    return {
      action: 'turn-off',
      scrollPosition: restored.scrollPosition,
      searchTerm: restored.searchTerm,
      stateFilter: restored.stateFilter,
      focusedGroup: restored.stateFilter,
    };
  }
  memory.saveState(currentSearchTerm, currentStateFilter);
  return { action: 'turn-on', searchTerm: '' };
}
