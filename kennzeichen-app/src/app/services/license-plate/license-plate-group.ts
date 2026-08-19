import { LicensePlate } from '../../models/license-plate.interface';

export interface LicensePlateGroup {
  state: string;
  licensePlates: LicensePlate[];
}

function groupByKey(
  plates: LicensePlate[],
  keyFor: (plate: LicensePlate) => string
): Map<string, LicensePlate[]> {
  const groups = new Map<string, LicensePlate[]>();
  plates.forEach((plate) => {
    const key = keyFor(plate);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(plate);
  });
  return groups;
}

function sortGroupsBySearch(
  groups: LicensePlateGroup[],
  searchTerm: string
): LicensePlateGroup[] {
  const term = searchTerm.toLowerCase();
  return groups.sort((a, b) => {
    const aHasCodeMatch = a.licensePlates.some((plate) =>
      plate.code.toLowerCase().startsWith(term)
    );
    const bHasCodeMatch = b.licensePlates.some((plate) =>
      plate.code.toLowerCase().startsWith(term)
    );
    if (aHasCodeMatch && !bHasCodeMatch) return -1;
    if (!aHasCodeMatch && bHasCodeMatch) return 1;
    if (aHasCodeMatch && bHasCodeMatch) {
      const aShortest = Math.min(
        ...a.licensePlates
          .filter((plate) => plate.code.toLowerCase().startsWith(term))
          .map((plate) => plate.code.length)
      );
      const bShortest = Math.min(
        ...b.licensePlates
          .filter((plate) => plate.code.toLowerCase().startsWith(term))
          .map((plate) => plate.code.length)
      );
      if (aShortest !== bShortest) return aShortest - bShortest;
    }
    return a.state.localeCompare(b.state);
  });
}

export function groupLicensePlates(
  licensePlates: LicensePlate[],
  viewMode: 'alphabetical' | 'grouped',
  searchTerm: string
): LicensePlateGroup[] {
  if (viewMode === 'alphabetical') {
    const groups = groupByKey(licensePlates, (plate) => plate.code.charAt(0).toUpperCase());
    return Array.from(groups.entries())
      .map(([state, plates]) => ({ state, licensePlates: plates }))
      .sort((a, b) => a.state.localeCompare(b.state));
  }

  const groups = groupByKey(licensePlates, (plate) => plate.federal_state);
  const sorted = Array.from(groups.entries()).map(([state, plates]) => ({
    state,
    licensePlates: plates,
  }));

  if (searchTerm.trim()) return sortGroupsBySearch(sorted, searchTerm);
  return sorted.sort((a, b) => a.state.localeCompare(b.state));
}
