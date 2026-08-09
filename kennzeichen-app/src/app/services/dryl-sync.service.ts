import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { LocalStorageService } from './local-storage';

declare global {
  interface Window {
    drylUserDataStore?: (appKey: string) => {
      authMe(): Promise<{ id: string; username?: string } | null>;
      loadRemote(): Promise<unknown>;
      saveRemote(data: unknown): Promise<void>;
    };
  }
}

const APP_KEY = 'kennzeichen';

type KennzeichenBlob = {
  version: 1;
  seenCodes: string[];
  updatedAt: string;
};

/**
 * Account-scoped plate progress via dryl-auth user-app-data (no Firebase).
 * Cross-device sync = sign in with the same dryl account.
 */
@Injectable({ providedIn: 'root' })
export class DrylSyncService {
  private readonly localStorageService = inject(LocalStorageService);
  private readonly syncStatus$ = new BehaviorSubject<
    'offline' | 'syncing' | 'synced' | 'error'
  >('offline');
  private readonly lastSyncTime$ = new BehaviorSubject<Date | null>(null);
  private readonly accountLabel$ = new BehaviorSubject<string | null>(null);
  private signedIn = false;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.localStorageService.onDataChanged$.subscribe(() => {
      if (this.signedIn) {
        this.queueSave();
      }
    });
    void this.bootstrap();
  }

  private store() {
    if (typeof window === 'undefined' || !window.drylUserDataStore) {
      return null;
    }
    return window.drylUserDataStore(APP_KEY);
  }

  private async bootstrap(): Promise<void> {
    const store = this.store();
    if (!store) {
      this.syncStatus$.next('offline');
      return;
    }
    try {
      const user = await store.authMe();
      if (!user?.id) {
        this.signedIn = false;
        this.syncStatus$.next('offline');
        this.accountLabel$.next(null);
        return;
      }
      this.signedIn = true;
      this.accountLabel$.next(user.username || user.id.slice(0, 8));
      await this.pullAndMerge(store);
    } catch {
      this.signedIn = false;
      this.syncStatus$.next('error');
    }
  }

  private async pullAndMerge(
    store: NonNullable<ReturnType<DrylSyncService['store']>>,
  ): Promise<void> {
    this.syncStatus$.next('syncing');
    try {
      const remote = await store.loadRemote();
      const remoteCodes =
        remote && typeof remote === 'object' && Array.isArray((remote as KennzeichenBlob).seenCodes)
          ? (remote as KennzeichenBlob).seenCodes
          : [];
      const localCodes = this.localStorageService.getSeenCodes();
      const merged = Array.from(new Set([...localCodes, ...remoteCodes]));
      if (merged.length > localCodes.length) {
        this.localStorageService.setSeenCodes(merged);
      }
      await store.saveRemote({
        version: 1,
        seenCodes: merged,
        updatedAt: new Date().toISOString(),
      } satisfies KennzeichenBlob);
      this.lastSyncTime$.next(new Date());
      this.syncStatus$.next('synced');
    } catch {
      this.syncStatus$.next('error');
    }
  }

  private queueSave(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
    this.saveTimer = setTimeout(() => {
      void this.pushLocal();
    }, 800);
  }

  private async pushLocal(): Promise<void> {
    const store = this.store();
    if (!store || !this.signedIn) {
      return;
    }
    this.syncStatus$.next('syncing');
    try {
      const blob: KennzeichenBlob = {
        version: 1,
        seenCodes: this.localStorageService.getSeenCodes(),
        updatedAt: new Date().toISOString(),
      };
      await store.saveRemote(blob);
      this.lastSyncTime$.next(new Date());
      this.syncStatus$.next('synced');
    } catch {
      this.syncStatus$.next('error');
    }
  }

  getSyncStatus(): Observable<'offline' | 'syncing' | 'synced' | 'error'> {
    return this.syncStatus$.asObservable();
  }

  getLastSyncTime(): Observable<Date | null> {
    return this.lastSyncTime$.asObservable();
  }

  /** Shown in UI instead of Firebase short codes. */
  getShortCode(): Observable<string | null> {
    return this.accountLabel$.asObservable();
  }

  getUserId(): string | null {
    return this.accountLabel$.value;
  }

  exportUserId(): string | null {
    return this.getUserId();
  }

  /** Peer short-code import removed — sign in with dryl on each device. */
  async importUserId(_input: string): Promise<boolean> {
    return false;
  }

  async manualSync(): Promise<void> {
    const store = this.store();
    if (!store) {
      this.syncStatus$.next('offline');
      return;
    }
    const user = await store.authMe();
    if (!user?.id) {
      this.signedIn = false;
      this.syncStatus$.next('offline');
      return;
    }
    this.signedIn = true;
    this.accountLabel$.next(user.username || user.id.slice(0, 8));
    await this.pullAndMerge(store);
  }

  isSyncEnabled(): boolean {
    return this.signedIn;
  }

  destroy(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
  }
}
