import { LicensePlate } from './models/license-plate.interface';
import { LicensePlateGroup } from './services/license-plate';
import { FilterStateService } from './services/filter-state.service';
import { LicensePlateService } from './services/license-plate';

export interface AppFilterContext {
  targetScrollPosition: number;
  currentSearchTerm: string;
  selectedCode: string;
  focusedGroup: string;
  licensePlateService: LicensePlateService;
  filterStateService: FilterStateService;
}

function resetScrollPosition(ctx: AppFilterContext): void {
  setTimeout(() => {
    ctx.targetScrollPosition = -1;
  }, 100);
}

export function handleStateChange(ctx: AppFilterContext, state: string): void {
  const currentStateFilter = ctx.licensePlateService.getCurrentStateFilter();
  const result = ctx.filterStateService.handleStateChange(
    state,
    ctx.currentSearchTerm,
    currentStateFilter
  );

  if (result.action === 'clear') {
    ctx.targetScrollPosition = result.scrollPosition ?? 0;
    ctx.currentSearchTerm = result.searchTerm ?? '';
    ctx.focusedGroup = result.focusedGroup ?? '';
    ctx.licensePlateService.setStateFilter('');
    ctx.licensePlateService.setSearchTerm(result.searchTerm ?? '');
    resetScrollPosition(ctx);
  } else if (result.action === 'set') {
    ctx.focusedGroup = result.focusedGroup ?? state;
    if (ctx.currentSearchTerm !== '') {
      ctx.licensePlateService.setSearchTerm('');
    }
    ctx.currentSearchTerm = '';
    ctx.licensePlateService.setStateFilter(state);
  }
}

export function handleLicensePlateClicked(
  ctx: AppFilterContext,
  licensePlate: LicensePlate
): void {
  const currentStateFilter = ctx.licensePlateService.getCurrentStateFilter();
  const result = ctx.filterStateService.handlePlateSelection(
    licensePlate.code,
    ctx.selectedCode,
    ctx.currentSearchTerm,
    currentStateFilter
  );

  if (result.action === 'deselect') {
    ctx.targetScrollPosition = result.scrollPosition ?? 0;
    ctx.selectedCode = '';
    ctx.currentSearchTerm = result.searchTerm ?? '';
    ctx.focusedGroup = result.focusedGroup ?? '';
    ctx.licensePlateService.setSearchTerm(result.searchTerm ?? '');
    ctx.licensePlateService.setStateFilter(result.stateFilter ?? '');
    resetScrollPosition(ctx);
  } else if (result.action === 'select') {
    ctx.selectedCode = result.selectedCode ?? licensePlate.code;
    ctx.currentSearchTerm = licensePlate.code;
    ctx.focusedGroup = '';
    ctx.licensePlateService.setStateFilter('');
    ctx.licensePlateService.setSearchTerm('==' + licensePlate.code);
  }
}

export function handleBackClick(ctx: AppFilterContext): void {
  const restored = ctx.filterStateService.restoreState();

  ctx.targetScrollPosition = restored.scrollPosition;
  ctx.selectedCode = '';
  ctx.currentSearchTerm = restored.searchTerm;
  ctx.focusedGroup = restored.stateFilter;
  ctx.licensePlateService.setSearchTerm(restored.searchTerm);
  ctx.licensePlateService.setStateFilter(restored.stateFilter);
  resetScrollPosition(ctx);
}

export function handleGroupHeadingClicked(
  ctx: AppFilterContext,
  group: LicensePlateGroup
): void {
  const currentStateFilter = ctx.licensePlateService.getCurrentStateFilter();
  const result = ctx.filterStateService.handleGroupHeadingClick(
    group,
    ctx.focusedGroup,
    ctx.currentSearchTerm,
    currentStateFilter
  );

  if (result.action === 'toggle-off') {
    ctx.targetScrollPosition = result.scrollPosition ?? 0;
    ctx.currentSearchTerm = result.searchTerm ?? '';
    ctx.focusedGroup = result.focusedGroup ?? '';
    ctx.licensePlateService.setStateFilter(result.stateFilter ?? '');
    ctx.licensePlateService.setSearchTerm(result.searchTerm ?? '');
    resetScrollPosition(ctx);
  } else if (result.action === 'filter-state') {
    ctx.focusedGroup = result.focusedGroup ?? group.state;
    if (ctx.currentSearchTerm !== '') {
      ctx.licensePlateService.setSearchTerm('');
    }
    ctx.currentSearchTerm = '';
    ctx.licensePlateService.setStateFilter(group.state);
  } else if (result.action === 'filter-letter') {
    ctx.currentSearchTerm = group.state;
    ctx.focusedGroup = group.state;
    ctx.licensePlateService.setSearchTerm(group.state);
    ctx.licensePlateService.setStateFilter('');
  }
}

export function handleSeenFilterToggle(ctx: AppFilterContext): void {
  const currentFilter = ctx.licensePlateService.getCurrentSeenFilter();
  const currentStateFilter = ctx.licensePlateService.getCurrentStateFilter();
  const result = ctx.filterStateService.handleSeenFilterToggle(
    currentFilter,
    ctx.currentSearchTerm,
    currentStateFilter
  );

  if (result.action === 'turn-off') {
    ctx.targetScrollPosition = result.scrollPosition ?? 0;
    ctx.currentSearchTerm = result.searchTerm ?? '';
    ctx.focusedGroup = result.stateFilter ?? '';
    ctx.licensePlateService.setSeenFilter(false);
    ctx.licensePlateService.setSearchTerm(result.searchTerm ?? '');
    ctx.licensePlateService.setStateFilter(result.stateFilter ?? '');
    resetScrollPosition(ctx);
  } else if (result.action === 'turn-on') {
    ctx.currentSearchTerm = '';
    ctx.selectedCode = '';
    ctx.licensePlateService.setSeenFilter(true);
    ctx.licensePlateService.setSearchTerm('');
  }
}