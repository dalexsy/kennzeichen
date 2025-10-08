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
}
