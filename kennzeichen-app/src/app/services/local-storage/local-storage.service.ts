import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { SeenLicensePlate } from './seen-license-plate';
import {
  readSeenData,
  writeSeenData,
  clearSeenData,
  exportSeenDownload,
  mergeImportedSeen,
} from './local-storage-io';

export type { SeenLicensePlate };

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {
  private readonly VIEW_MODE_KEY = 'view-mode-preference';
  private seenLicensePlatesSubject = new BehaviorSubject<Set<string>>(new Set());
  private dataChanged$ = new Subject<void>();

  public seenLicensePlates$ = this.seenLicensePlatesSubject.asObservable();
  public onDataChanged$ = this.dataChanged$.asObservable();

  constructor() {
    this.loadSeenLicensePlates();
  }

  private loadSeenLicensePlates(): void {
    try {
      const seenCodes = new Set(readSeenData().map((item) => item.code));
      this.seenLicensePlatesSubject.next(seenCodes);
    } catch (error) {
      console.error('Error loading seen license plates:', error);
    }
  }

  private publishSeen(seenData: SeenLicensePlate[], notify = false): void {
    writeSeenData(seenData);
    this.seenLicensePlatesSubject.next(new Set(seenData.map((item) => item.code)));
    if (notify) this.dataChanged$.next();
  }

  markAsSeen(code: string): void {
    try {
      const seenData = readSeenData();
      const existingIndex = seenData.findIndex((item) => item.code === code);
      if (existingIndex === -1) {
        seenData.push({ code, seenAt: new Date().toISOString() });
      } else {
        seenData[existingIndex].seenAt = new Date().toISOString();
      }
      this.publishSeen(seenData, true);
    } catch (error) {
      console.error('Error marking license plate as seen:', error);
    }
  }

  isSeen(code: string): boolean {
    return this.seenLicensePlatesSubject.value.has(code);
  }

  getSeenDate(code: string): string | null {
    const found = this.getSeenDetails().find((item) => item.code === code);
    return found ? found.seenAt : null;
  }

  getSeenCodes(): string[] {
    return Array.from(this.seenLicensePlatesSubject.value);
  }

  setSeenCodes(codes: string[]): void {
    try {
      const existingMap = new Map(this.getSeenDetails().map((item) => [item.code, item]));
      const updatedData: SeenLicensePlate[] = codes.map(
        (code) => existingMap.get(code) || { code, seenAt: new Date().toISOString() }
      );
      this.publishSeen(updatedData);
    } catch (error) {
      console.error('Error setting seen codes:', error);
    }
  }

  getSeenDetails(): SeenLicensePlate[] {
    return readSeenData();
  }

  clearSeen(): void {
    clearSeenData();
    this.seenLicensePlatesSubject.next(new Set());
  }

  getSeenCount(): number {
    return this.seenLicensePlatesSubject.value.size;
  }

  toggleSeen(code: string): void {
    if (this.isSeen(code)) this.removeSeen(code);
    else this.markAsSeen(code);
  }

  removeSeen(code: string): void {
    try {
      this.publishSeen(
        readSeenData().filter((item) => item.code !== code),
        true
      );
    } catch (error) {
      console.error('Error removing seen license plates:', error);
    }
  }

  getRecentlySeen(limit: number = 10): SeenLicensePlate[] {
    return this.getSeenDetails()
      .sort((a, b) => new Date(b.seenAt).getTime() - new Date(a.seenAt).getTime())
      .slice(0, limit);
  }

  saveViewMode(mode: 'alphabetical' | 'grouped'): void {
    try {
      localStorage.setItem(this.VIEW_MODE_KEY, mode);
    } catch (error) {
      console.error('Error saving view mode:', error);
    }
  }

  getViewMode(): 'alphabetical' | 'grouped' | null {
    try {
      return localStorage.getItem(this.VIEW_MODE_KEY) as 'alphabetical' | 'grouped' | null;
    } catch (error) {
      console.error('Error getting view mode:', error);
      return null;
    }
  }

  exportSeenData(): void {
    exportSeenDownload(this.getSeenDetails());
  }

  importSeenData(fileContent: string): {
    success: boolean;
    imported: number;
    skipped: number;
    error?: string;
  } {
    try {
      const result = mergeImportedSeen(fileContent, this.getSeenDetails());
      if (result.success && result.imported > 0) this.publishSeen(result.data);
      return {
        success: result.success,
        imported: result.imported,
        skipped: result.skipped,
        error: result.error,
      };
    } catch (error) {
      console.error('Error importing seen data:', error);
      return {
        success: false,
        imported: 0,
        skipped: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
