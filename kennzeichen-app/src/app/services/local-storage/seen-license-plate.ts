export interface SeenLicensePlate {
  code: string;
  seenAt: string;
}

export function parseSeenData(stored: string | null): SeenLicensePlate[] {
  if (!stored) return [];
  return JSON.parse(stored) as SeenLicensePlate[];
}
