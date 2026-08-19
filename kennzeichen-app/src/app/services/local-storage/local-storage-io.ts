import { SeenLicensePlate, parseSeenData } from './seen-license-plate';

const SEEN_KEY = 'license-plates-seen';

export function readSeenData(): SeenLicensePlate[] {
  try {
    return parseSeenData(localStorage.getItem(SEEN_KEY));
  } catch (error) {
    console.error('Error getting seen details:', error);
    return [];
  }
}

export function writeSeenData(seenData: SeenLicensePlate[]): void {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(seenData));
  } catch (error) {
    console.error('Error saving seen license plates:', error);
  }
}

export function clearSeenData(): void {
  try {
    localStorage.removeItem(SEEN_KEY);
  } catch (error) {
    console.error('Error clearing seen license plates:', error);
  }
}

export function exportSeenDownload(seenData: SeenLicensePlate[]): void {
  const dataStr = JSON.stringify(seenData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `kennzeichen-gesehen-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function mergeImportedSeen(
  fileContent: string,
  existingData: SeenLicensePlate[]
): { success: boolean; imported: number; skipped: number; data: SeenLicensePlate[]; error?: string } {
  const importedData: SeenLicensePlate[] = JSON.parse(fileContent);
  if (!Array.isArray(importedData)) {
    return {
      success: false,
      imported: 0,
      skipped: 0,
      data: existingData,
      error: 'Invalid data format: expected an array',
    };
  }

  const existingCodes = new Set(existingData.map((item) => item.code));
  let imported = 0;
  let skipped = 0;

  importedData.forEach((item) => {
    if (!item.code || !item.seenAt) {
      skipped++;
      return;
    }
    if (!existingCodes.has(item.code)) {
      existingData.push(item);
      imported++;
    } else {
      skipped++;
    }
  });

  return { success: true, imported, skipped, data: existingData };
}
