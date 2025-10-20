import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface SeenLicensePlate {
  code: string;
  seenAt: string; // ISO date string
}

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  private readonly SEEN_KEY = 'license-plates-seen';
  private readonly VIEW_MODE_KEY = 'view-mode-preference';
  private seenLicensePlatesSubject = new BehaviorSubject<Set<string>>(new Set());

  public seenLicensePlates$ = this.seenLicensePlatesSubject.asObservable();

  constructor() {
    this.loadSeenLicensePlates();
  }

  private loadSeenLicensePlates(): void {
    try {
      const stored = localStorage.getItem(this.SEEN_KEY);
      if (stored) {
        const seenData: SeenLicensePlate[] = JSON.parse(stored);
        const seenCodes = new Set(seenData.map(item => item.code));
        this.seenLicensePlatesSubject.next(seenCodes);
      }
    } catch (error) {
      console.error('Error loading seen license plates:', error);
    }
  }

  private saveSeenLicensePlates(seenData: SeenLicensePlate[]): void {
    try {
      localStorage.setItem(this.SEEN_KEY, JSON.stringify(seenData));
    } catch (error) {
      console.error('Error saving seen license plates:', error);
    }
  }

  markAsSeen(code: string): void {
    try {
      const stored = localStorage.getItem(this.SEEN_KEY);
      let seenData: SeenLicensePlate[] = stored ? JSON.parse(stored) : [];

      // Check if already seen
      const existingIndex = seenData.findIndex(item => item.code === code);

      if (existingIndex === -1) {
        // Add new entry
        seenData.push({
          code,
          seenAt: new Date().toISOString()
        });
      } else {
        // Update existing entry
        seenData[existingIndex].seenAt = new Date().toISOString();
      }

      this.saveSeenLicensePlates(seenData);

      // Update the subject
      const currentSeen = this.seenLicensePlatesSubject.value;
      currentSeen.add(code);
      this.seenLicensePlatesSubject.next(new Set(currentSeen));
    } catch (error) {
      console.error('Error marking license plate as seen:', error);
    }
  }

  isSeen(code: string): boolean {
    return this.seenLicensePlatesSubject.value.has(code);
  }

  getSeenDate(code: string): string | null {
    try {
      const seenData = this.getSeenDetails();
      const found = seenData.find(item => item.code === code);
      return found ? found.seenAt : null;
    } catch (error) {
      console.error('Error getting seen date:', error);
      return null;
    }
  }

  getSeenCodes(): string[] {
    return Array.from(this.seenLicensePlatesSubject.value);
  }

  getSeenDetails(): SeenLicensePlate[] {
    try {
      const stored = localStorage.getItem(this.SEEN_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting seen details:', error);
      return [];
    }
  }

  clearSeen(): void {
    try {
      localStorage.removeItem(this.SEEN_KEY);
      this.seenLicensePlatesSubject.next(new Set());
    } catch (error) {
      console.error('Error clearing seen license plates:', error);
    }
  }

  getSeenCount(): number {
    return this.seenLicensePlatesSubject.value.size;
  }

  toggleSeen(code: string): void {
    if (this.isSeen(code)) {
      this.removeSeen(code);
    } else {
      this.markAsSeen(code);
    }
  }

  removeSeen(code: string): void {
    try {
      const stored = localStorage.getItem(this.SEEN_KEY);
      let seenData: SeenLicensePlate[] = stored ? JSON.parse(stored) : [];

      // Remove the entry
      seenData = seenData.filter(item => item.code !== code);

      this.saveSeenLicensePlates(seenData);

      // Update the subject
      const currentSeen = this.seenLicensePlatesSubject.value;
      currentSeen.delete(code);
      this.seenLicensePlatesSubject.next(new Set(currentSeen));
    } catch (error) {
      console.error('Error removing seen license plates:', error);
    }
  }

  // Get recently seen (last 10)
  getRecentlySeen(limit: number = 10): SeenLicensePlate[] {
    try {
      const seenData = this.getSeenDetails();
      return seenData
        .sort((a, b) => new Date(b.seenAt).getTime() - new Date(a.seenAt).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting recently seen:', error);
      return [];
    }
  }

  // View mode preference
  saveViewMode(mode: 'alphabetical' | 'grouped'): void {
    try {
      localStorage.setItem(this.VIEW_MODE_KEY, mode);
    } catch (error) {
      console.error('Error saving view mode:', error);
    }
  }

  getViewMode(): 'alphabetical' | 'grouped' | null {
    try {
      const mode = localStorage.getItem(this.VIEW_MODE_KEY);
      return mode as 'alphabetical' | 'grouped' | null;
    } catch (error) {
      console.error('Error getting view mode:', error);
      return null;
    }
  }

  // Export seen data as JSON file
  exportSeenData(): void {
    try {
      const seenData = this.getSeenDetails();
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
    } catch (error) {
      console.error('Error exporting seen data:', error);
      throw error;
    }
  }

  // Import seen data from JSON file
  importSeenData(fileContent: string): { success: boolean; imported: number; skipped: number; error?: string } {
    try {
      const importedData: SeenLicensePlate[] = JSON.parse(fileContent);

      // Validate the data structure
      if (!Array.isArray(importedData)) {
        return { success: false, imported: 0, skipped: 0, error: 'Invalid data format: expected an array' };
      }

      const existingData = this.getSeenDetails();
      const existingCodes = new Set(existingData.map(item => item.code));

      let imported = 0;
      let skipped = 0;

      importedData.forEach(item => {
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

      if (imported > 0) {
        this.saveSeenLicensePlates(existingData);
        const seenCodes = new Set(existingData.map(item => item.code));
        this.seenLicensePlatesSubject.next(seenCodes);
      }

      return { success: true, imported, skipped };
    } catch (error) {
      console.error('Error importing seen data:', error);
      return {
        success: false,
        imported: 0,
        skipped: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
