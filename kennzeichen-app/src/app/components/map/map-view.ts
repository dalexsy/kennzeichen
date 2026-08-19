import { LicensePlate } from '../../models/license-plate.interface';
import { LocalizationService } from '../../services/localization/localization.service';

export function shouldShowMapButton(
  licensePlates: LicensePlate[],
  hasMarkers: boolean,
  isMapVisible: boolean
): boolean {
  if (window.innerWidth < 768) return true;
  if (hasMarkers || isMapVisible) return true;
  if (licensePlates.length > 0 && licensePlates.length <= 200) {
    return licensePlates.some(
      (plate) => plate.derived_from && plate.derived_from !== 'willkürlich gewählt'
    );
  }
  return false;
}

export function highlightedStateName(
  stateFilter: string,
  selectedCode: string,
  licensePlates: LicensePlate[]
): string {
  if (stateFilter) return stateFilter;
  if (selectedCode) {
    const selectedPlate = licensePlates.find((p) => p.code === selectedCode);
    if (selectedPlate?.federal_state) return selectedPlate.federal_state;
  }
  return '';
}

export function activeFilterLabel(
  localizationService: LocalizationService,
  seenFilterActive: boolean,
  stateFilter: string
): string {
  const t = localizationService.getTranslations();
  const parts: string[] = [];
  if (seenFilterActive) parts.push(t.seen);
  parts.push(
    stateFilter
      ? localizationService.translateStateName(stateFilter)
      : seenFilterActive
        ? t.all_states_dative
        : t.all_states
  );
  return parts.join(' in ');
}
