import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface SeenKennzeichen {
  code: string;
  seenAt: string; // ISO date string
}

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  private readonly SEEN_KEY = 'kennzeichen-seen';
  private seenKennzeichenSubject = new BehaviorSubject<Set<string>>(new Set());

  public seenKennzeichen$ = this.seenKennzeichenSubject.asObservable();

  constructor() {
    this.loadSeenKennzeichen();
  }

  private loadSeenKennzeichen(): void {
    try {
      const stored = localStorage.getItem(this.SEEN_KEY);
      if (stored) {
        const seenData: SeenKennzeichen[] = JSON.parse(stored);
        const seenCodes = new Set(seenData.map(item => item.code));
        this.seenKennzeichenSubject.next(seenCodes);
      }
    } catch (error) {
      console.error('Error loading seen kennzeichen:', error);
    }
  }

  private saveSeenKennzeichen(seenData: SeenKennzeichen[]): void {
    try {
      localStorage.setItem(this.SEEN_KEY, JSON.stringify(seenData));
    } catch (error) {
      console.error('Error saving seen kennzeichen:', error);
    }
  }

  markAsSeen(code: string): void {
    try {
      const stored = localStorage.getItem(this.SEEN_KEY);
      let seenData: SeenKennzeichen[] = stored ? JSON.parse(stored) : [];

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

      this.saveSeenKennzeichen(seenData);

      // Update the subject
      const currentSeen = this.seenKennzeichenSubject.value;
      currentSeen.add(code);
      this.seenKennzeichenSubject.next(new Set(currentSeen));
    } catch (error) {
      console.error('Error marking kennzeichen as seen:', error);
    }
  }

  isSeen(code: string): boolean {
    return this.seenKennzeichenSubject.value.has(code);
  }

  getSeenCodes(): string[] {
    return Array.from(this.seenKennzeichenSubject.value);
  }

  getSeenDetails(): SeenKennzeichen[] {
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
      this.seenKennzeichenSubject.next(new Set());
    } catch (error) {
      console.error('Error clearing seen kennzeichen:', error);
    }
  }

  getSeenCount(): number {
    return this.seenKennzeichenSubject.value.size;
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
      let seenData: SeenKennzeichen[] = stored ? JSON.parse(stored) : [];

      // Remove the entry
      seenData = seenData.filter(item => item.code !== code);

      this.saveSeenKennzeichen(seenData);

      // Update the subject
      const currentSeen = this.seenKennzeichenSubject.value;
      currentSeen.delete(code);
      this.seenKennzeichenSubject.next(new Set(currentSeen));
    } catch (error) {
      console.error('Error removing seen kennzeichen:', error);
    }
  }

  // Get recently seen (last 10)
  getRecentlySeen(limit: number = 10): SeenKennzeichen[] {
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
