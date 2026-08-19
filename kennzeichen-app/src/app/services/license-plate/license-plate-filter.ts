import { LicensePlate } from '../../models/license-plate.interface';

function matchesSearch(plates: LicensePlate[], rawTerm: string): LicensePlate[] {
  let term = rawTerm.toLowerCase();
  let isExactMatch = false;

  if (term.startsWith('==')) {
    isExactMatch = true;
    term = term.substring(2);
  }

  if (isExactMatch) {
    return plates.filter((plate) => plate.code.toLowerCase() === term);
  }

  const codeMatches = plates.filter((plate) => plate.code.toLowerCase().startsWith(term));
  if (codeMatches.length > 0) return codeMatches;

  return plates.filter((plate) => {
    const cityMatch = plate.city_district.toLowerCase().includes(term);
    const derivedMatch = plate.derived_from.toLowerCase().includes(term);
    const stateMatch = plate.federal_state.toLowerCase().includes(term);
    return cityMatch || derivedMatch || stateMatch;
  });
}

function sortFiltered(plates: LicensePlate[], searchTerm: string): LicensePlate[] {
  return plates.sort((a, b) => {
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const aCodeMatch = a.code.toLowerCase().startsWith(term);
      const bCodeMatch = b.code.toLowerCase().startsWith(term);
      if (aCodeMatch && !bCodeMatch) return -1;
      if (!aCodeMatch && bCodeMatch) return 1;
      if (aCodeMatch && bCodeMatch) {
        if (a.code.length !== b.code.length) return a.code.length - b.code.length;
        return a.code.localeCompare(b.code);
      }
    }
    return a.code.localeCompare(b.code);
  });
}

export function filterLicensePlates(
  licensePlates: LicensePlate[],
  searchTerm: string,
  stateFilter: string,
  seenFilter: boolean,
  seenCodes: Set<string>
): LicensePlate[] {
  let filtered = licensePlates;
  if (seenFilter) filtered = filtered.filter((plate) => seenCodes.has(plate.code));
  if (stateFilter.trim()) {
    filtered = filtered.filter((plate) => plate.federal_state === stateFilter);
  }
  if (searchTerm.trim()) filtered = matchesSearch(filtered, searchTerm);
  return sortFiltered(filtered, searchTerm);
}

export function pickMapLicensePlates(
  filtered: LicensePlate[],
  seenCodes: Set<string>,
  allPlates: LicensePlate[]
): LicensePlate[] {
  if (filtered.length <= 200) return filtered;
  const seenPlates = allPlates.filter((plate) => seenCodes.has(plate.code));
  if (seenPlates.length > 0 && seenPlates.length <= 200) return seenPlates;
  return [];
}

export function suggestLicensePlates(
  plates: LicensePlate[],
  input: string,
  limit = 10
): LicensePlate[] {
  if (!input.trim()) return [];
  const term = input.toLowerCase();
  return plates
    .filter((plate) => plate.code.toLowerCase().startsWith(term))
    .sort((a, b) => {
      if (a.code.length !== b.code.length) return a.code.length - b.code.length;
      return a.code.localeCompare(b.code);
    })
    .slice(0, limit);
}
